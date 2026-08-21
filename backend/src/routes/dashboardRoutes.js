const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', dashboardController.getDashboardStats);
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
