const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Service = require('../models/Service.model');
const Token = require('../models/Token.model');

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [staff, priya, arnav, zoya, imran] = await User.create(
    { name: 'Counter Staff', email: 'counter@demo.com', passwordHash: hash, role: 'staff' },
    { name: 'Priya Joshi', email: 'priya@demo.com', passwordHash: hash, phone: '9845012345' },
    { name: 'Arnav Gupta', email: 'arnav@demo.com', passwordHash: hash, phone: '9845067890' },
    { name: 'Zoya Khan', email: 'zoya@demo.com', passwordHash: hash, phone: '9845024680' },
    { name: 'Imran Sheikh', email: 'imran@demo.com', passwordHash: hash, phone: '9845013579' }
  );

  const opd = await Service.create({ name: 'General OPD', prefix: 'A', description: 'Walk-in general physician', avgDurationMin: 6, stdDevMin: 2, counterDate: new Date().toISOString().slice(0, 10) });
  const dental = await Service.create({ name: 'Dental', prefix: 'B', description: 'Dental checkups & cleaning', avgDurationMin: 12, stdDevMin: 3 });

  const now = Date.now();
  const min = 60000;

  // 10 completed OPD tokens with realistic durations (avg ≈ 6, spread 4-9)
  const durations = [5, 7, 4, 9, 6, 8, 5, 6, 7, 4];
  const patients = [priya, arnav, zoya, imran];
  for (let i = 0; i < 10; i++) {
    await Token.create({
      service: opd._id, user: patients[i % patients.length],
      number: i + 1, display: `A-${i + 1}`, state: 'done',
      calledAt: new Date(now - (30 - i * 3) * min),
      servedStartAt: new Date(now - (29 - i * 3) * min),
      doneAt: new Date(now - (29 - i * 3 - durations[i]) * min),
      durationMin: durations[i],
    });
  }
  opd.lastNumbers = 10;
  await opd.save();

  // live queue: 1 called (at counter), 3 waiting
  await Token.create({ service: opd._id, user: priya._id, number: 11, display: 'A-11', state: 'called', calledAt: new Date(now - 2 * min) });
  await Token.create({ service: opd._id, user: arnav._id, number: 12, display: 'A-12', state: 'waiting' });
  await Token.create({ service: opd._id, user: zoya._id, number: 13, display: 'A-13', state: 'waiting' });
  await Token.create({ service: opd._id, user: imran._id, number: 14, display: 'A-14', state: 'waiting' });
  opd.lastNumbers = 14;
  await opd.save();

  // a past no-show imran can rejoin from
  await Token.create({ service: dental._id, user: imran._id, number: 1, display: 'B-1', state: 'no-show', calledAt: new Date(now - 60 * min), noShowCount: 1 });
  await Token.create({ service: dental._id, user: zoya._id, number: 2, display: 'B-2', state: 'waiting' });
  dental.lastNumbers = 2;
  await dental.save();

  return { staff, priya, arnav, zoya, imran, opd, dental };
}

module.exports = seed;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
