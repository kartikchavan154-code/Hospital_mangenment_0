const router = require('express').Router();
const ctrl = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/schedule', ctrl.getSchedule);
router.post('/', authorize('admin'), auditMiddleware('Doctor', 'CREATE'), ctrl.create);
router.put('/:id', authorize('admin', 'doctor'), auditMiddleware('Doctor', 'UPDATE'), ctrl.update);
router.put('/:id/availability', authorize('admin', 'doctor'), ctrl.updateAvailability);
router.delete('/:id', authorize('admin'), auditMiddleware('Doctor', 'DELETE'), ctrl.delete);

module.exports = router;
