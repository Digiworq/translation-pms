const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

router.post('/projects/:projectId/upload', fileController.upload.single('file'), fileController.uploadProjectFile);
router.get('/projects/:projectId', fileController.getProjectFiles);
router.get('/:fileId/download', fileController.downloadFile);
router.delete('/:fileId', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), fileController.deleteFile);

module.exports = router;
