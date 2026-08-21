const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.post('/:id/reset-password', userController.resetUserPassword);

module.exports = router;
