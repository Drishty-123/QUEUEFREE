const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');
const { wateringStreak } = require('../controllers/extra.controller');

let ctx, veda;

before(async () => {
  ctx = await startTest();
  veda = await login(ctx, 'veda@demo.com');
});

after(async () => stopTest(ctx));

test('watering streak unit test: consecutive days count, gaps reset', () => {
  const now = new Date();
  const day = (o) => new Date(now.getTime() - o * 86400000).toISOString();
  assert.equal(wateringStreak([day(0), day(1), day(2)], now), 3);
  assert.equal(wateringStreak([day(1), day(2)], now), 2); // today not watered yet
  assert.equal(wateringStreak([day(0), day(2)], now), 1); // gap breaks it
});

test('garden stats compute water totals, streak and rainwater saved', async () => {
  const r = await api(ctx, 'GET', '/stats/garden', { token: veda.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.plants >= 6);
  assert.ok(r.body.waterings >= 6);
  assert.ok(r.body.totalLitres > 0);
  assert.ok(r.body.rainSkips >= 1, 'seed has one rain-postponed plant');
  assert.ok(r.body.rainwaterSavedLitres > 0);
  assert.ok(r.body.tip.length > 10);
});
