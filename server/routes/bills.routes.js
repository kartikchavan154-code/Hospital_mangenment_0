const router = require('express').Router();
const ctrl = require('../controllers/billController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/download', ctrl.downloadPDF);
router.post('/', authorize('admin', 'receptionist'), auditMiddleware('Bill', 'CREATE'), ctrl.create);
router.put('/:id', authorize('admin', 'receptionist'), auditMiddleware('Bill', 'UPDATE'), ctrl.update);

module.exports = router;
