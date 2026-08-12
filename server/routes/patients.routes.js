const router = require('express').Router();
const ctrl = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('admin', 'doctor', 'receptionist'), ctrl.getAll);
router.get('/:id', authorize('admin', 'doctor', 'receptionist', 'patient'), ctrl.getById);
router.post('/', authorize('admin', 'receptionist'), auditMiddleware('Patient', 'CREATE'), ctrl.create);
router.put('/:id', authorize('admin', 'receptionist', 'patient'), auditMiddleware('Patient', 'UPDATE'), ctrl.update);
router.delete('/:id', authorize('admin'), auditMiddleware('Patient', 'DELETE'), ctrl.delete);
router.get('/:id/medical-history', authorize('admin', 'doctor', 'patient'), ctrl.getMedicalHistory);

module.exports = router;
