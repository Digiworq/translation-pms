const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const vendorAssignmentController = require('../controllers/vendorAssignmentController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authMiddleware);

// Project Endpoints
router.get('/', projectController.getProjects);
router.post('/sync', projectController.syncProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), projectController.createProject);
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), projectController.updateProject);
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), projectController.updateProjectStatus);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), projectController.deleteProject);
router.post('/:id/notes', projectController.addProjectNote);

// Vendor Assignment Endpoints
router.post('/:projectId/vendors', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), vendorAssignmentController.assignVendorToProject);
router.patch('/assignments/:assignmentId/status', vendorAssignmentController.updateAssignmentStatus);
router.delete('/assignments/:assignmentId', requireRole(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), vendorAssignmentController.deleteVendorAssignment);

module.exports = router;
