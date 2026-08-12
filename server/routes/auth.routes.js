const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.post('/login', ctrl.login);
router.post('/register', ctrl.register);
router.get('/me', authenticate, ctrl.getMe);
router.put('/change-password', authenticate, ctrl.changePassword);
router.get('/users', authenticate, authorize('admin'), ctrl.getAllUsers);

module.exports = router;
