const prisma = require('../config/prisma');

/**
 * Log action to audit trail
 */
const logAudit = async ({
  req,
  action,
  entity,
  entityId,
  beforeValue = null,
  afterValue = null
}) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : 'System';
    const userRole = req.user ? req.user.role : 'SYSTEM';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        ipAddress,
        beforeValue: beforeValue ? JSON.stringify(beforeValue) : null,
        afterValue: afterValue ? JSON.stringify(afterValue) : null
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

module.exports = { logAudit };
