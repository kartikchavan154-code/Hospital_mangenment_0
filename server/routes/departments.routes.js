const router = require('express').Router();
const ctrl = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.delete);

module.exports = router;
