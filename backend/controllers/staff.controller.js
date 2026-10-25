const Service = require('../models/Service.model');
const Token = require('../models/Token.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { publish } = require('../utils/queueEvents');

function requireStaff(req) {
  if (req.user.role !== 'staff') throw new AppError(403, 'Counter staff only');
}

// Call the next waiting token; if someone is mid-call, their slot auto-closes
// as "done" (they walked away without checkout) so the rolling average stays honest.
exports.callNext = asyncHandler(async (req, res) => {
  requireStaff(req);
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');

  const current = await Token.findOne({ service: service._id, state: { $in: ['called', 'serving'] } });
  if (current) {
    // auto-complete the previous token with a real measured duration
    const start = current.servedStartAt || current.calledAt || new Date();
    current.state = 'done';
    current.doneAt = new Date();
    current.durationMin = Math.max(1, Math.round(((current.doneAt - start) / 60000) * 10) / 10);
    await current.save();
  }

  // priority-assistance tokens (elderly/pregnant/accessible) jump the queue
  const next = (await Token.findOne({ service: service._id, state: 'waiting', priority: true }).sort('number'))
    || (await Token.findOne({ service: service._id, state: 'waiting' }).sort('number'));
  if (!next) {
    publish(service._id, { type: 'now-serving', display: null });
    return res.json({ called: null, closed: current ? current.display : null });
  }
  next.state = 'called';
  next.calledAt = new Date();
  await next.save();
  publish(service._id, { type: 'now-serving', display: next.display });
  res.json({ called: next, closed: current ? current.display : null });
});

// Mark a called token as a no-show (customer missed their call).
exports.noShow = asyncHandler(async (req, res) => {
  requireStaff(req);
  const token = await Token.findById(req.params.id);
  if (!token) throw new AppError(404, 'Token not found');
  if (token.state !== 'called') throw new AppError(409, 'Only called tokens can be marked no-show');
  token.state = 'no-show';
  token.noShowCount += 1;
  await token.save();
  publish(token.service, { type: 'no-show', display: token.display });
  res.json(token);
});

// Finish serving the current token (records the measured duration).
exports.complete = asyncHandler(async (req, res) => {
  requireStaff(req);
  const token = await Token.findById(req.params.id);
  if (!token) throw new AppError(404, 'Token not found');
  if (!['called', 'serving'].includes(token.state)) throw new AppError(409, 'That token is not at the counter');
  const start = token.servedStartAt || token.calledAt || new Date();
  token.state = 'done';
  token.doneAt = new Date();
  token.durationMin = Math.max(1, Math.round(((token.doneAt - start) / 60000) * 10) / 10);
  await token.save();
  publish(token.service, { type: 'done', display: token.display, durationMin: token.durationMin });
  res.json(token);
});

// Counter console state for staff.
exports.console = asyncHandler(async (req, res) => {
  requireStaff(req);
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  const current = await Token.findOne({ service: service._id, state: { $in: ['called', 'serving'] } }).populate('user', 'name');
  const waiting = await Token.find({ service: service._id, state: 'waiting' }).sort('number').limit(20).populate('user', 'name');
  const recent = await Token.find({ service: service._id, state: { $in: ['done', 'no-show', 'cancelled'] } }).sort('-doneAt -updatedAt').limit(10);
  res.json({ service, current, waiting, recent });
});


// Open/close the counter: closed counters refuse new tokens.
exports.toggleOpen = asyncHandler(async (req, res) => {
  requireStaff(req);
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  service.open = typeof req.body.open === 'boolean' ? req.body.open : !service.open;
  await service.save();
  publish(service._id, { type: 'open-toggled', open: service.open });
  res.json(service);
});
