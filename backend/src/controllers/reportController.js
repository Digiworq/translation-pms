const prisma = require('../config/prisma');

const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate, clientId, projectManagerId } = req.query;

    const where = {};
    if (clientId) where.clientId = clientId;
    if (projectManagerId) where.projectManagerId = projectManagerId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        projectManager: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = projects.reduce((sum, p) => sum + p.clientAmount, 0);
    const totalVendorExpenses = projects.reduce((sum, p) => sum + p.totalVendorCost, 0);
    const totalGrossProfit = totalRevenue - totalVendorExpenses;
    const overallMargin = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(2) : 0;

    return res.json({
      success: true,
      summary: {
        totalProjects: projects.length,
        totalRevenue,
        totalVendorExpenses,
        totalGrossProfit,
        overallMargin: parseFloat(overallMargin)
      },
      projects
    });
  } catch (error) {
    next(error);
  }
};

const getClientReport = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: {
            id: true,
            clientAmount: true,
            paidAmount: true,
            outstandingAmount: true,
            status: true
          }
        }
      }
    });

    const report = clients.map(c => {
      const totalBilled = c.projects.reduce((sum, p) => sum + p.clientAmount, 0);
      const totalPaid = c.projects.reduce((sum, p) => sum + p.paidAmount, 0);
      const outstanding = c.projects.reduce((sum, p) => sum + p.outstandingAmount, 0);
      return {
        id: c.id,
        clientCode: c.clientCode,
        companyName: c.companyName,
        contactPerson: c.contactPerson,
        email: c.email,
        totalProjects: c.projects.length,
        totalBilled,
        totalPaid,
        outstanding
      };
    });

    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getVendorReport = async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        assignments: {
          select: {
            vendorAmount: true,
            status: true
          }
        },
        languages: true
      }
    });

    const report = vendors.map(v => {
      const totalAssignments = v.assignments.length;
      const totalEarned = v.assignments.reduce((sum, a) => sum + a.vendorAmount, 0);
      return {
        id: v.id,
        vendorCode: v.vendorCode,
        name: v.name,
        email: v.email,
        rating: v.rating,
        availability: v.availability,
        status: v.status,
        totalAssignments,
        totalEarned,
        languages: v.languages.map(l => `${l.sourceLang}->${l.targetLang}`).join(', ')
      };
    });

    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getLanguageReport = async (req, res, next) => {
  try {
    const groups = await prisma.project.groupBy({
      by: ['sourceLang', 'targetLang'],
      _count: { id: true },
      _sum: {
        clientAmount: true,
        totalVendorCost: true,
        wordCount: true
      }
    });

    const report = groups.map(g => ({
      pair: `${g.sourceLang} → ${g.targetLang}`,
      sourceLang: g.sourceLang,
      targetLang: g.targetLang,
      projectCount: g._count.id,
      totalWords: g._sum.wordCount || 0,
      totalRevenue: g._sum.clientAmount || 0,
      totalCost: g._sum.totalVendorCost || 0
    }));

    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialReport,
  getClientReport,
  getVendorReport,
  getLanguageReport
};
