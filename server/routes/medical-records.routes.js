const router = require('express').Router();
const ctrl = require('../controllers/medicalRecordController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'doctor'), auditMiddleware('MedicalRecord', 'CREATE'), ctrl.create);
router.put('/:id', authorize('admin', 'doctor'), auditMiddleware('MedicalRecord', 'UPDATE'), ctrl.update);
router.delete('/:id', authorize('admin', 'doctor'), auditMiddleware('MedicalRecord', 'DELETE'), ctrl.delete);

module.exports = router;
