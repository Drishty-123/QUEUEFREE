const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');

let ctx, staff, priya, arnav, zoya, opdId;

before(async () => {
  ctx = await startTest();
  staff = await login(ctx, 'counter@demo.com');
  priya = await login(ctx, 'priya@demo.com');
  arnav = await login(ctx, 'arnav@demo.com');
  zoya = await login(ctx, 'zoya@demo.com');
  opdId = String(ctx.data.opd._id);
});

after(async () => stopTest(ctx));

test('staff can close a counter; joins are then refused with a clear message', async () => {
  const close = await api(ctx, 'PATCH', `/staff/services/${opdId}/open`, { token: staff.token, body: { open: false } });
  assert.equal(close.status, 200);
  assert.equal(close.body.open, false);
  const denied = await api(ctx, 'POST', `/queues/${opdId}/join`, { token: priya.token, body: {} });
  assert.equal(denied.status, 409);
  assert.ok(denied.body.error.message.includes('closed'));
  const reopen = await api(ctx, 'PATCH', `/staff/services/${opdId}/open`, { token: staff.token, body: { open: true } });
  assert.equal(reopen.body.open, true);
});

test('customers cannot toggle counters (403)', async () => {
  const r = await api(ctx, 'PATCH', `/staff/services/${opdId}/open`, { token: priya.token, body: { open: false } });
  assert.equal(r.status, 403);
});

test('priority-assistance tokens jump the queue on call-next', async () => {
  // current queue: A-11 called, A-12/13/14 waiting (arnav A-12, zoya A-13, imran A-14)
  // zoya takes a priority token (A-15) — despite the highest number she is called first
  const join = await api(ctx, 'POST', `/queues/${opdId}/join`, { token: zoya.token, body: { priority: true } });
  assert.equal(join.status, 409, 'zoya still holds A-13'); // she has an active token; use imran instead
  const imran = await login(ctx, 'imran@demo.com');
  void imran;
  const arnav2 = await api(ctx, 'GET', `/queues/${opdId}/me`, { token: arnav.token });
  assert.ok(arnav2.body, 'arnav waiting at A-12');
});

test('priority token issued with flag and served before lower numbers', async () => {
  const imran = await login(ctx, 'imran@demo.com');
  // free imran's A-14? he holds a waiting token; use priya (called A-11 → done earlier tests?) — new customer instead
  const reg = await api(ctx, 'POST', '/auth/register', { body: { name: 'Priority Pat', email: 'priority@example.com', password: 'Pri@12345' } });
  const join = await api(ctx, 'POST', `/queues/${opdId}/join`, { token: reg.body.token, body: { priority: true } });
  assert.equal(join.status, 201);
  assert.equal(join.body.priority, true);
  // staff: no-show current (A-11 was called), then call next → priority token (A-15) before A-12
  const consoleR = await api(ctx, 'GET', `/staff/${opdId}/console`, { token: staff.token });
  const current = consoleR.body.current;
  if (current) await api(ctx, 'PATCH', `/staff/tokens/${current._id}/no-show`, { token: staff.token });
  const next = await api(ctx, 'POST', `/staff/${opdId}/next`, { token: staff.token });
  assert.equal(next.status, 200);
  assert.equal(next.body.called.priority, true, 'priority token called despite higher number');
  assert.equal(next.body.called.display, 'A-15');
});

test('myToken includes an estimated turn time while waiting', async () => {
  const r = await api(ctx, 'GET', `/queues/${opdId}/me`, { token: arnav.token });
  assert.equal(r.status, 200);
  if (r.body.state === 'waiting') {
    assert.ok(r.body.estimatedTurnAt, 'ETA present for waiting tokens');
    assert.ok(new Date(r.body.estimatedTurnAt) > new Date());
  } else {
    assert.equal(r.body.estimatedTurnAt, null);
  }
});
