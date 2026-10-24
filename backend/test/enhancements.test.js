const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');

let ctx, staff, opdId;

before(async () => {
  ctx = await startTest();
  staff = await login(ctx, 'counter@demo.com');
  opdId = String(ctx.data.opd._id);
});

after(async () => stopTest(ctx));

test('queue analytics compute throughput, no-show rate and wait time', async () => {
  const r = await api(ctx, 'GET', `/services/${opdId}/analytics`, { token: staff.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.tokensIssued >= 14);
  assert.ok(r.body.served >= 10);
  assert.ok(r.body.noShowRate >= 0 && r.body.noShowRate <= 100);
  assert.ok(r.body.avgWaitMin === null || r.body.avgWaitMin >= 0);
  assert.ok(Array.isArray(r.body.hourly));
});

test('customers can view analytics too (queue transparency)', async () => {
  const priya = await login(ctx, 'priya@demo.com');
  const r = await api(ctx, 'GET', `/services/${opdId}/analytics`, { token: priya.token });
  assert.equal(r.status, 200);
});
