const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'PROJECT_MANAGER']));

router.get('/financial', reportController.getFinancialReport);
router.get('/clients', reportController.getClientReport);
router.get('/vendors', reportController.getVendorReport);
router.get('/languages', reportController.getLanguageReport);

module.exports = router;
