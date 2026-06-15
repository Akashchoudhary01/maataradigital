const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getNotifications,
  markNotificationsRead,
  getReports,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', getDashboard);
router.get('/notifications', getNotifications);
router.put('/notifications/mark-read', markNotificationsRead);
router.get('/reports', getReports);

module.exports = router;
