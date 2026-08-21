const prisma = require('../config/prisma');
const { recalculateProjectFinancials } = require('./projectController');
const { logAudit } = require('../utils/auditLogger');

const assignVendorToProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      vendorId,
      taskType,
      sourceLang,
      targetLang,
      assignedWords = 0,
      assignedPages = 0,
      vendorRate = 0,
      vendorAmount: customVendorAmount,
      startDate,
      deadline,
      notes
    } = req.body;

    if (!vendorId || !taskType) {
      return res.status(400).json({
        success: false,
        message: 'Vendor and task type are required.'
      });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const aWords = parseInt(assignedWords, 10) || 0;
    const aPages = parseInt(assignedPages, 10) || 0;
    const vRate = parseFloat(vendorRate) || 0;

    const computedVendorAmount = customVendorAmount !== undefined && customVendorAmount !== null && customVendorAmount !== ''
      ? parseFloat(customVendorAmount)
      : (aWords > 0 ? aWords * vRate : (aPages > 0 ? aPages * vRate : 0));

    const assignment = await prisma.projectVendor.create({
      data: {
        projectId,
        vendorId,
        taskType,
        sourceLang: sourceLang || project.sourceLang,
        targetLang: targetLang || project.targetLang,
        assignedWords: aWords,
        assignedPages: aPages,
        vendorRate: vRate,
        vendorAmount: computedVendorAmount,
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: deadline ? new Date(deadline) : project.deadline,
        status: 'PENDING',
        notes
      },
      include: {
        vendor: { select: { id: true, name: true, email: true, vendorCode: true } }
      }
    });

    // Update project status if still NEW
    if (project.status === 'NEW') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ASSIGNED' }
      });
    }

    // Recalculate margins
    await recalculateProjectFinancials(projectId);

    // Create Notification for Vendor User account if linked
    const vendorUser = await prisma.user.findFirst({ where: { vendorId } });
    if (vendorUser) {
      await prisma.notification.create({
        data: {
          userId: vendorUser.id,
          title: 'New Project Assignment',
          message: `You have been assigned task "${taskType}" on project ${project.projectCode} (${project.projectName}).`,
          type: 'ASSIGNMENT',
          link: `/projects/${projectId}`
        }
      });
    }

    await logAudit({
      req,
      action: 'ASSIGN_VENDOR',
      entity: 'PROJECT',
      entityId: projectId,
      afterValue: assignment
    });

    return res.status(201).json({
      success: true,
      message: 'Vendor assigned successfully.',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status, notes } = req.body;

    const assignment = await prisma.projectVendor.findUnique({
      where: { id: assignmentId },
      include: { project: true }
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Vendor access check
    if (req.user.role === 'VENDOR' && req.user.vendorId !== assignment.vendorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized assignment update.' });
    }

    const updatedAssignment = await prisma.projectVendor.update({
      where: { id: assignmentId },
      data: {
        status: status || assignment.status,
        ...(notes !== undefined && { notes })
      }
    });

    await logAudit({
      req,
      action: 'UPDATE_ASSIGNMENT_STATUS',
      entity: 'PROJECT_VENDOR',
      entityId: assignmentId,
      beforeValue: assignment,
      afterValue: updatedAssignment
    });

    return res.json({
      success: true,
      message: 'Assignment status updated.',
      assignment: updatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

const deleteVendorAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.projectVendor.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await prisma.projectVendor.delete({ where: { id: assignmentId } });

    // Recalculate project margins
    await recalculateProjectFinancials(assignment.projectId);

    await logAudit({
      req,
      action: 'REMOVE_VENDOR',
      entity: 'PROJECT',
      entityId: assignment.projectId,
      beforeValue: assignment
    });

    return res.json({
      success: true,
      message: 'Vendor assignment removed.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignVendorToProject,
  updateAssignmentStatus,
  deleteVendorAssignment
};
