const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');
const { computeStats, predictWait } = require('../utils/eta');

let ctx, staff, priya, arnav;

before(async () => {
  ctx = await startTest();
  staff = await login(ctx, 'counter@demo.com');
  priya = await login(ctx, 'priya@demo.com');
  arnav = await login(ctx, 'arnav@demo.com');
});

after(async () => stopTest(ctx));

// ---- ETA unit tests ------------------------------------------------------
test('ETA: rolling stats over known fixtures', () => {
  const stats = computeStats([5, 7, 4, 9, 6, 8, 5, 6, 7, 4]);
  assert.equal(stats.avg, 6.1);
  assert.equal(stats.sample, 10);
  assert.ok(stats.std > 0);
});

test('ETA: window uses only the last 10 durations', () => {
  const stats = computeStats([100, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(stats.avg, 5.5); // 1..10, the 100 fell out of the window
});

test('ETA: prediction scales with position and widens the band', () => {
  const stats = { avg: 6, std: 2 };
  const p1 = predictWait(1, stats);
  const p5 = predictWait(5, stats);
  assert.equal(p1.minutes, 6);
  assert.equal(p5.minutes, 30);
  assert.ok(p5.high - p5.low > p1.high - p1.low, 'uncertainty grows with position');
});

// ---- health & auth -------------------------------------------------------
test('health endpoint responds ok', async () => {
  const r = await api(ctx, 'GET', '/health');
  assert.equal(r.status, 200);
});

test('login rejects wrong password with 401', async () => {
  const r = await api(ctx, 'POST', '/auth/login', { body: { email: 'priya@demo.com', password: 'nope@123' } });
  assert.equal(r.status, 401);
});

test('joining requires auth (401)', async () => {
  const r = await api(ctx, 'POST', `/queues/${ctx.data.opd._id}/join`);
  assert.equal(r.status, 401);
});

// ---- queue flow ----------------------------------------------------------
test('services list shows live stats and waiting counts', async () => {
  const r = await api(ctx, 'GET', '/services');
  assert.equal(r.status, 200);
  const opd = r.body.find((s) => s.prefix === 'A');
  assert.equal(opd.waiting, 3);
  assert.equal(opd.stats.avg, 6.1);
});

test('priya (called) sees position 0; arnav (waiting) sees position 1', async () => {
  const me1 = await api(ctx, 'GET', `/queues/${ctx.data.opd._id}/me`, { token: priya.token });
  assert.equal(me1.body.state, 'called');
  assert.equal(me1.body.position, 0);
  const me2 = await api(ctx, 'GET', `/queues/${ctx.data.opd._id}/me`, { token: arnav.token });
  assert.equal(me2.body.position, 1);
});

test('double-joining the same queue returns 409', async () => {
  const r = await api(ctx, 'POST', `/queues/${ctx.data.opd._id}/join`, { token: arnav.token });
  assert.equal(r.status, 409);
});

test('staff console requires the staff role (403 for customers)', async () => {
  const r = await api(ctx, 'GET', `/staff/${ctx.data.opd._id}/console`, { token: priya.token });
  assert.equal(r.status, 403);
});

test('staff calls the next token; previous auto-completes with measured duration', async () => {
  const r = await api(ctx, 'POST', `/staff/${ctx.data.opd._id}/next`, { token: staff.token });
  assert.equal(r.status, 200);
  assert.equal(r.body.called.display, 'A-12'); // arnav
  assert.ok(r.body.closed, 'A-11 auto-closed');
  const arnavMe = await api(ctx, 'GET', `/queues/${ctx.data.opd._id}/me`, { token: arnav.token });
  assert.equal(arnavMe.body.state, 'called');
});

test('only called tokens can be marked no-show (409 otherwise)', async () => {
  const consoleR = await api(ctx, 'GET', `/staff/${ctx.data.opd._id}/console`, { token: staff.token });
  const waiting = consoleR.body.waiting[0];
  const r = await api(ctx, 'PATCH', `/staff/tokens/${waiting._id}/no-show`, { token: staff.token });
  assert.equal(r.status, 409);
  const current = consoleR.body.current;
  const ok = await api(ctx, 'PATCH', `/staff/tokens/${current._id}/no-show`, { token: staff.token });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.state, 'no-show');
  ctx.missedToken = ok.body;
});

test('no-showed customer can rejoin at the back of the queue', async () => {
  const r = await api(ctx, 'POST', `/queues/${ctx.data.opd._id}/rejoin`, { token: arnav.token });
  assert.equal(r.status, 201);
  assert.equal(r.body.rejoinedAfterNoShow, true);
  assert.equal(r.body.noShowCount, 1);
  ctx.rejoined = r.body;
});

test('completing a token records its service duration for the ETA', async () => {
  const r = await api(ctx, 'POST', `/staff/${ctx.data.opd._id}/next`, { token: staff.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.called, 'next waiting token gets called');
  const done = await api(ctx, 'PATCH', `/staff/tokens/${r.body.called._id}/complete`, { token: staff.token });
  assert.equal(done.status, 200);
  assert.ok(done.body.durationMin >= 1);
  assert.equal(done.body.state, 'done');
});

test('leaving a queue cancels the token', async () => {
  const join = await api(ctx, 'POST', `/queues/${ctx.data.dental._id}/join`, { token: priya.token });
  assert.equal(join.status, 201);
  const leave = await api(ctx, 'DELETE', `/queues/${ctx.data.dental._id}/me`, { token: priya.token });
  assert.equal(leave.status, 200);
  const me = await api(ctx, 'GET', `/queues/${ctx.data.dental._id}/me`, { token: priya.token });
  assert.equal(me.body, null);
});

test('customers cannot call next (403)', async () => {
  const r = await api(ctx, 'POST', `/staff/${ctx.data.opd._id}/next`, { token: priya.token });
  assert.equal(r.status, 403);
});

// ---- SSE -----------------------------------------------------------------
test('SSE stream pushes live state on connect', async () => {
  const controller = new AbortController();
  let sawState = false;
  try {
    const res = await fetch(`${ctx.base}/queues/${ctx.data.opd._id}/stream`, { signal: controller.signal });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/event-stream'));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    // The first frames may split across chunks (retry preamble, then state)
    for (let i = 0; i < 5 && !sawState; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      sawState = decoder.decode(value).includes('event: state');
    }
    assert.ok(sawState, 'stream includes a state event');
  } finally {
    controller.abort(); // always close so the test process can exit
  }
});

test('unknown service returns structured 404', async () => {
  const r = await api(ctx, 'GET', `/queues/${'0'.repeat(24)}/me`, { token: priya.token });
  assert.equal(r.status, 404);
});
