const router = require('express').Router();
const ctrl = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', ctrl.getAll);

module.exports = router;
