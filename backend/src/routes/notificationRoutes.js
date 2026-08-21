const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markNotificationRead);
router.patch('/read-all', notificationController.markAllNotificationsRead);

module.exports = router;
