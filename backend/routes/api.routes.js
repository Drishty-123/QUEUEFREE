const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const a = require('../controllers/auth.controller');
const q = require('../controllers/queue.controller');
const s = require('../controllers/staff.controller');
const extra = require('../controllers/extra.controller');
const { requireAuth } = require('../middlewares/auth');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

router.post('/auth/register', authLimiter, a.register);
router.post('/auth/login', authLimiter, a.login);
router.get('/auth/me', requireAuth, a.me);

// Public live board data
router.get('/services', q.services);
router.get('/services/:serviceId/analytics', requireAuth, extra.analytics);
router.get('/queues/:serviceId/stream', q.stream);

router.use(requireAuth);
router.post('/queues/:serviceId/join', q.join);
router.get('/queues/:serviceId/me', q.myToken);
router.delete('/queues/:serviceId/me', q.leave);
router.post('/queues/:serviceId/rejoin', q.rejoin);
router.post('/staff/:serviceId/next', s.callNext);
router.get('/staff/:serviceId/console', s.console);
router.patch('/staff/tokens/:id/no-show', s.noShow);
router.patch('/staff/tokens/:id/complete', s.complete);

module.exports = router;
