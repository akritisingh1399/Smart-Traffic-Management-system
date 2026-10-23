const express = require('express');
const router = express.Router();
const {
  getAllSignals,
  updateSignal,
  getLiveCongestion,
  getAlerts,
  getAnalytics,
  getUsers,
  createUser,
  exportReports
} = require('../controllers/adminController');
const { auth, authorize } = require('../middlewares/auth');
const { validateTrafficSignal } = require('../middlewares/validation');

router.use(auth);
router.use(authorize('admin'));

router.get('/signals', getAllSignals);
router.put('/signals/:id', validateTrafficSignal, updateSignal);
router.get('/congestion', getLiveCongestion);
router.get('/alerts', getAlerts);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/reports/export', exportReports);

module.exports = router;
