const Token = require('../models/Token.model');
const Service = require('../models/Service.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Queue analytics: throughput per hour, avg service time per hour, no-show rate.
exports.analytics = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId);
  if (!service) throw new AppError(404, 'Service not found');
  const tokens = await Token.find({ service: service._id });
  const done = tokens.filter((t) => t.state === 'done' && t.durationMin);

  const byHour = {};
  for (const t of done) {
    const hour = new Date(t.doneAt || t.createdAt).getHours();
    (byHour[hour] ||= { served: 0, totalMin: 0 });
    byHour[hour].served += 1;
    byHour[hour].totalMin += t.durationMin;
  }
  const hourly = Object.entries(byHour)
    .map(([hour, d]) => ({ hour: Number(hour), served: d.served, avgMin: Math.round((d.totalMin / d.served) * 10) / 10 }))
    .sort((a, b) => a.hour - b.hour);

  const waited = tokens.filter((t) => t.calledAt);
  const avgWaitMin = waited.length
    ? Math.max(0, Math.round((waited.reduce((s, t) => s + (t.calledAt - new Date(t.createdAt)), 0) / waited.length / 60000) * 10) / 10)
    : null;

  res.json({
    tokensIssued: tokens.length,
    served: done.length,
    noShowRate: tokens.length ? Math.round((tokens.filter((t) => t.state === 'no-show').length / tokens.length) * 100) : 0,
    avgWaitMin,
    peakHour: hourly.length ? hourly.reduce((a, b) => (b.served > a.served ? b : a)).hour : null,
    hourly,
  });
});
