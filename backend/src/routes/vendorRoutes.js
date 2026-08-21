const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS']), vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), vendorController.createVendor);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VENDOR']), vendorController.updateVendor);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), vendorController.deleteVendor);

module.exports = router;
