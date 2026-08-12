const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/overview', ctrl.getOverview);
router.get('/patient-trends', ctrl.getPatientTrends);
router.get('/revenue', ctrl.getRevenue);
router.get('/doctor-workload', ctrl.getDoctorWorkload);
router.get('/appointments-by-status', ctrl.getAppointmentsByStatus);
router.get('/department-distribution', ctrl.getDepartmentDistribution);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
