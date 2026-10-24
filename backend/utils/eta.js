// Rolling ETA from the last `window` completed tokens of a service.
function computeStats(durations, fallbackAvg = 5, fallbackStd = 1) {
  const sample = durations.slice(-10);
  if (sample.length === 0) return { avg: fallbackAvg, std: fallbackStd, sample: 0 };
  const avg = sample.reduce((s, d) => s + d, 0) / sample.length;
  const variance = sample.reduce((s, d) => s + (d - avg) ** 2, 0) / sample.length;
  return {
    avg: Math.round(avg * 10) / 10,
    std: Math.max(0.5, Math.round(Math.sqrt(variance) * 10) / 10),
    sample: sample.length,
  };
}

// Predicted wait for a person at queue position `position` (1 = next).
function predictWait(position, stats) {
  if (position <= 0) return { minutes: 0, low: 0, high: 0 };
  const minutes = Math.round(position * stats.avg * 10) / 10;
  const spread = Math.round(stats.std * Math.sqrt(position) * 10) / 10;
  return { minutes, low: Math.max(0, Math.round((minutes - spread) * 10) / 10), high: Math.round((minutes + spread) * 10) / 10 };
}

module.exports = { computeStats, predictWait };
