const prisma = require('../config/prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const isVendor = req.user?.role === 'VENDOR';
    const vendorId = req.user?.vendorId;

    // Base project filter — vendors only see their own projects
    const projectWhere = isVendor && vendorId
      ? { vendors: { some: { vendorId } } }
      : {};

    // Parallel queries for all stats
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects,
      overdueProjects,
      totalClients,
      totalVendors,
      allProjects,
      recentProjects,
      upcomingDeadlines
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),

      prisma.project.count({
        where: { ...projectWhere, status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'] } }
      }),

      prisma.project.count({
        where: { ...projectWhere, status: { in: ['COMPLETED', 'DELIVERED'] } }
      }),

      prisma.project.count({
        where: { ...projectWhere, status: 'NEW' }
      }),

      prisma.project.count({
        where: {
          ...projectWhere,
          deadline: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] }
        }
      }),

      isVendor ? Promise.resolve(0) : prisma.client.count(),

      isVendor ? Promise.resolve(0) : prisma.vendor.count(),

      // Aggregate financials from all projects (hidden from vendors)
      isVendor
        ? Promise.resolve([])
        : prisma.project.findMany({
            select: {
              clientAmount: true,
              totalVendorCost: true,
              paidAmount: true,
              outstandingAmount: true
            }
          }),

      // Recent projects for the activity feed
      prisma.project.findMany({
        where: projectWhere,
        include: {
          client: { select: { id: true, companyName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),

      // Upcoming deadlines
      prisma.project.findMany({
        where: {
          ...projectWhere,
          status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] },
          deadline: { gte: new Date() }
        },
        include: {
          client: { select: { id: true, companyName: true } }
        },
        orderBy: { deadline: 'asc' },
        take: 6
      })
    ]);

    // Financial roll-ups (admin/PM/accounts only)
    const revenue = allProjects.reduce((s, p) => s + (p.clientAmount || 0), 0);
    const vendorExpenses = allProjects.reduce((s, p) => s + (p.totalVendorCost || 0), 0);
    const profit = revenue - vendorExpenses;
    const outstandingClientPayments = allProjects.reduce((s, p) => s + (p.outstandingAmount || 0), 0);

    // Pending vendor payments — sum of approved/processing vendor invoices
    const pendingVendorInvoices = isVendor
      ? []
      : await prisma.vendorInvoice.findMany({
          where: { status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
          select: { amount: true }
        });
    const pendingVendorPayments = pendingVendorInvoices.reduce((s, v) => s + (v.amount || 0), 0);

    // Chart: projects by status
    const statusGroups = await prisma.project.groupBy({
      by: ['status'],
      where: projectWhere,
      _count: { status: true }
    });
    const projectsByStatus = statusGroups.map(g => ({
      name: g.status,
      value: g._count.status
    }));

    // Chart: projects by type
    const typeGroups = await prisma.project.groupBy({
      by: ['projectType'],
      where: projectWhere,
      _count: { projectType: true }
    });
    const projectsByType = typeGroups.map(g => ({
      name: g.projectType,
      value: g._count.projectType
    }));

    // Chart: projects by language pair
    const langProjects = await prisma.project.findMany({
      where: projectWhere,
      select: { sourceLang: true, targetLang: true }
    });
    const langMap = {};
    langProjects.forEach(p => {
      const pair = `${p.sourceLang} → ${p.targetLang}`;
      langMap[pair] = (langMap[pair] || 0) + 1;
    });
    const projectsByLanguage = Object.entries(langMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Recent audit log activity
    const recentActivities = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Pending invoices
    const pendingInvoices = isVendor
      ? []
      : await prisma.invoice.findMany({
          where: { paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] } },
          include: { client: { select: { id: true, companyName: true } } },
          orderBy: { dueDate: 'asc' },
          take: 5
        });

    return res.json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        pendingProjects,
        overdueProjects,
        totalClients,
        totalVendors,
        outstandingClientPayments,
        pendingVendorPayments,
        revenue,
        vendorExpenses,
        profit
      },
      charts: {
        projectsByStatus,
        projectsByType,
        projectsByLanguage
      },
      recentProjects,
      upcomingDeadlines,
      recentActivities,
      pendingInvoices
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
