const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.post('/', authorize('admin', 'receptionist'), auditMiddleware('Payment', 'CREATE'), ctrl.create);
router.get('/bill/:billId', ctrl.getByBill);

module.exports = router;
