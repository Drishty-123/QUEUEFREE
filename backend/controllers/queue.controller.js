const Service = require('../models/Service.model');
const Token = require('../models/Token.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { computeStats, predictWait } = require('../utils/eta');
const { publish, subscribe } = require('../utils/queueEvents');

const today = () => new Date().toISOString().slice(0, 10);

async function serviceStats(service) {
  const done = await Token.find({ service: service._id, state: 'done', durationMin: { $ne: null } })
    .sort('-doneAt')
    .limit(10)
    .select('durationMin');
  return computeStats(done.map((t) => t.durationMin), service.avgDurationMin, service.stdDevMin);
}

async function liveState(serviceId) {
  const service = await Service.findById(serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  const stats = await serviceStats(service);
  const nowServing = await Token.findOne({ service: service._id, state: { $in: ['called', 'serving'] } }).sort('-number');
  const waiting = await Token.countDocuments({ service: service._id, state: 'waiting' });
  const board = await Token.find({ service: service._id, state: { $in: ['waiting', 'called', 'serving'] } })
    .sort('number')
    .limit(12)
    .populate('user', 'name');
  return { service, stats, nowServing, waiting, board };
}

exports.services = asyncHandler(async (_req, res) => {
  const services = await Service.find().sort('name');
  const withLive = await Promise.all(
    services.map(async (s) => {
      const stats = await serviceStats(s);
      const waiting = await Token.countDocuments({ service: s._id, state: 'waiting' });
      return { ...s.toObject(), stats, waiting };
    })
  );
  res.json(withLive);
});

exports.join = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  if (!service.open) throw new AppError(409, 'This counter is closed right now — check back later');

  const existing = await Token.findOne({ service: service._id, user: req.user.id, state: { $in: ['waiting', 'called', 'serving'] } });
  if (existing) throw new AppError(409, `You already hold ${existing.display} for this queue`);

  // daily numbering
  if (service.counterDate !== today()) {
    service.counterDate = today();
    service.lastNumbers = 0;
  }
  service.lastNumbers += 1;
  await service.save();

  const token = await Token.create({
    service: service._id,
    user: req.user.id,
    number: service.lastNumbers,
    display: `${service.prefix}-${service.lastNumbers}`,
    priority: !!req.body.priority,
  });
  publish(service._id, { type: 'joined', display: token.display, waiting: await Token.countDocuments({ service: service._id, state: 'waiting' }) });
  const stats = await serviceStats(service);
  const ahead = await Token.countDocuments({ service: service._id, state: 'waiting', number: { $lt: token.number } });
  res.status(201).json({ ...token.toObject(), position: ahead + 1, stats: predictWait(ahead + 1, stats) });
});

exports.myToken = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  const token = await Token.findOne({ service: service._id, user: req.user.id, state: { $in: ['waiting', 'called', 'serving'] } });
  if (!token) return res.json(null);
  const stats = await serviceStats(service);
  const ahead = await Token.countDocuments({
    service: service._id,
    state: 'waiting',
    number: { $lt: token.number },
    ...(token.state === 'waiting' ? {} : {}),
  });
  const position = token.state === 'waiting' ? ahead + 1 : 0; // 0 = at the counter
  const estimatedTurnAt = token.state === 'waiting'
    ? new Date(Date.now() + position * stats.avg * 60000).toISOString()
    : null;
  res.json({ ...token.toObject(), position, estimatedTurnAt, stats: predictWait(position, stats), statsMeta: stats });
});

exports.leave = asyncHandler(async (req, res) => {
  const token = await Token.findOne({ service: req.params.serviceId, user: req.user.id, state: { $in: ['waiting', 'called'] } });
  if (!token) throw new AppError(404, 'You have no active token in this queue');
  token.state = 'cancelled';
  await token.save();
  publish(req.params.serviceId, { type: 'left', display: token.display });
  res.json({ left: true, display: token.display });
});

// SSE stream — pushes the full live state on connect and on every mutation.
exports.stream = asyncHandler(async (req, res) => {
  const serviceId = req.params.serviceId;
  const service = await Service.findById(serviceId);
  if (!service) throw new AppError(404, 'Service not found');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
  });
  res.write('retry: 3000\n\n');

  const send = async () => {
    try {
      const state = await liveState(serviceId);
      res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
    } catch { /* connection closed */ }
  };

  await send();
  const unsubscribe = subscribe(serviceId, () => send());
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

exports.rejoin = asyncHandler(async (req, res) => {
  const missed = await Token.findOne({ service: req.params.serviceId, user: req.user.id, state: 'no-show' }).sort('-number');
  if (!missed) throw new AppError(404, 'No missed token to rejoin from');
  const service = await Service.findById(req.params.serviceId);

  const existing = await Token.findOne({ service: service._id, user: req.user.id, state: { $in: ['waiting', 'called', 'serving'] } });
  if (existing) throw new AppError(409, `You already hold ${existing.display}`);

  if (service.counterDate !== today()) {
    service.counterDate = today();
    service.lastNumbers = 0;
  }
  service.lastNumbers += 1;
  await service.save();

  const token = await Token.create({
    service: service._id,
    user: req.user.id,
    number: service.lastNumbers,
    display: `${service.prefix}-${service.lastNumbers}`,
    noShowCount: missed.noShowCount, // the no-show handler already counted it
  });
  publish(service._id, { type: 'joined', display: token.display });
  res.status(201).json({ ...token.toObject(), rejoinedAfterNoShow: true });
});
