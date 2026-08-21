const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
