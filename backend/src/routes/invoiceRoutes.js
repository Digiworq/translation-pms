const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS']), invoiceController.getInvoices);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS']), invoiceController.getInvoiceById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), invoiceController.createInvoice);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), invoiceController.updateInvoice);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), invoiceController.deleteInvoice);

module.exports = router;
