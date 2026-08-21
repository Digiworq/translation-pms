const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.post('/client', requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), paymentController.recordClientPayment);
router.get('/client', requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'PROJECT_MANAGER']), paymentController.getClientPayments);

router.post('/vendor', requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), paymentController.recordVendorPayment);
router.get('/vendor', paymentController.getVendorPayments);

module.exports = router;
