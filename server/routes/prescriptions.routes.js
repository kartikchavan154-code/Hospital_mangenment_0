const router = require('express').Router();
const ctrl = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate);

router.get('/record/:recordId', ctrl.getByRecord);
router.post('/', authorize('doctor'), ctrl.create);
router.put('/:id', authorize('doctor'), ctrl.update);
router.delete('/:id', authorize('doctor', 'admin'), ctrl.delete);

module.exports = router;
