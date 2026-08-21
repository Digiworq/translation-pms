const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/', settingController.getSettings);
router.put('/', requireRole(['SUPER_ADMIN', 'ADMIN']), settingController.updateSettings);

module.exports = router;
