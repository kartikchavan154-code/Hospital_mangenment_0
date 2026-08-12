const router = require('express').Router();
const ctrl = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/available-slots', ctrl.getAvailableSlots);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'receptionist', 'patient'), auditMiddleware('Appointment', 'CREATE'), ctrl.create);
router.put('/:id', authorize('admin', 'receptionist', 'doctor'), auditMiddleware('Appointment', 'UPDATE'), ctrl.update);
router.put('/:id/cancel', auditMiddleware('Appointment', 'CANCEL'), ctrl.cancel);

module.exports = router;
