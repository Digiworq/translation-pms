const prisma = require('../config/prisma');

const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, search, page = 1, limit = 25 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { action: { contains: search } },
        { entity: { contains: search } },
        { entityId: { contains: search } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
