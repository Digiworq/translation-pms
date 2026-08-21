const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS']), clientController.getClients);
router.get('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS']), clientController.getClientById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), clientController.createClient);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), clientController.updateClient);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), clientController.deleteClient);

module.exports = router;
