const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.patch('/:id/read', notificationController.markNotificationRead);

module.exports = router;
