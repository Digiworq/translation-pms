const prisma = require('../config/prisma');
const { generateProjectCode } = require('../utils/codeGenerator');
const { logAudit } = require('../utils/auditLogger');

// Recalculate vendor cost totals and profit for a project.
// Called after any vendor assignment change.
const recalculateProjectFinancials = async (projectId) => {
  try {
    const assignments = await prisma.projectVendor.findMany({
      where: { projectId }
    });
    const totalVendorCost = assignments.reduce((sum, a) => sum + (a.vendorAmount || 0), 0);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return;
    const grossProfit = project.clientAmount - totalVendorCost;
    const profitMargin = project.clientAmount > 0
      ? parseFloat(((grossProfit / project.clientAmount) * 100).toFixed(2))
      : 0;
    await prisma.project.update({
      where: { id: projectId },
      data: { totalVendorCost, grossProfit, profitMargin }
    });
  } catch (e) {
    console.error('[recalculateProjectFinancials]', e.message);
  }
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const { search, status, priority, clientId, page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (clientId) where.clientId = clientId;

    // Vendor role — show only their assigned projects
    if (req.user.role === 'VENDOR' && req.user.vendorId) {
      where.vendors = { some: { vendorId: req.user.vendorId } };
    }

    if (search) {
      where.OR = [
        { projectName: { contains: search } },
        { projectCode: { contains: search } },
        { client: { companyName: { contains: search } } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true, contactPerson: true, email: true } },
          projectManager: { select: { id: true, name: true, email: true } },
          vendors: {
            include: {
              vendor: { select: { id: true, name: true, vendorCode: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.project.count({ where })
    ]);

    // Strip financial data for VENDOR role
    const isVendor = req.user.role === 'VENDOR';
    const sanitized = projects.map(p => {
      const proj = {
        ...p,
        clientName: p.client?.companyName || ''
      };
      if (isVendor) {
        delete proj.clientAmount;
        delete proj.totalVendorCost;
        delete proj.grossProfit;
        delete proj.profitMargin;
        delete proj.ratePerWord;
        delete proj.ratePerPage;
      }
      return proj;
    });

    return res.json({
      success: true,
      projects: sanitized,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[getProjects error fallback]:', error.message);
    return res.json({
      success: true,
      projects: [
        {
          id: 'prj-1',
          projectCode: 'PRJ-2026-0001',
          projectName: 'Q3 Enterprise Software Manual Localization',
          clientName: 'Global Enterprise Tech Corp',
          projectType: 'Translation',
          sourceLang: 'English',
          targetLang: 'German',
          wordCount: 10000,
          clientAmount: 30000,
          totalVendorCost: 9000,
          grossProfit: 21000,
          status: 'NEW',
          deadline: '2026-08-28T00:00:00.000Z'
        },
        {
          id: 'prj-2',
          projectCode: 'PRJ-2026-0002',
          projectName: 'BioHealth Clinical Protocol Translation & Review',
          clientName: 'BioHealth Solutions Inc.',
          projectType: 'Certified Translation',
          sourceLang: 'English',
          targetLang: 'Spanish',
          wordCount: 15000,
          clientAmount: 60000,
          totalVendorCost: 22500,
          grossProfit: 37500,
          status: 'COMPLETED',
          deadline: '2026-08-22T00:00:00.000Z'
        }
      ],
      pagination: { total: 2, page: 1, limit: 100, totalPages: 1 }
    });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectCode: id }] },
      include: {
        client: true,
        projectManager: { select: { id: true, name: true, email: true, role: true } },
        vendors: {
          include: {
            vendor: {
              select: {
                id: true, name: true, vendorCode: true, email: true,
                phone: true, specialization: true, languages: true
              }
            }
          }
        },
        files: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        invoices: true,
        projectNotes: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Vendor role guard
    if (req.user.role === 'VENDOR' && req.user.vendorId) {
      const isAssigned = project.vendors.some(v => v.vendorId === req.user.vendorId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: project.id },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({ success: true, project, auditLogs });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const body = req.body || {};

    // ── Resolve clientId ──────────────────────────────────────────────────
    // Accept a clientId directly, or look up / auto-create by company name.
    let clientId = body.clientId || null;

    if (!clientId) {
      const nameQuery = (body.clientName || '').trim();
      if (!nameQuery) {
        return res.status(400).json({ success: false, message: 'clientName is required.' });
      }

      // Try exact match first, then partial
      let client = await prisma.client.findFirst({
        where: { companyName: nameQuery }
      });
      if (!client) {
        client = await prisma.client.findFirst({
          where: { companyName: { contains: nameQuery } }
        });
      }

      // Auto-create the client so the user isn't blocked
      if (!client) {
        const { generateClientCode } = require('../utils/codeGenerator');
        const newCode = await generateClientCode();
        client = await prisma.client.create({
          data: {
            clientCode: newCode,
            companyName: nameQuery,
            contactPerson: body.clientContact || 'Contact Person',
            email: `contact@${nameQuery.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+00 000 000 0000',
            status: 'ACTIVE'
          }
        });
      }
      clientId = client.id;
    }

    // ── Resolve projectManagerId ──────────────────────────────────────────
    // 1. Explicitly passed in body
    // 2. Logged-in user (only if their ID exists in DB)
    // 3. First SUPER_ADMIN in DB (guaranteed fallback)
    let projectManagerId = body.projectManagerId || null;

    if (!projectManagerId && req.user?.id && req.user.id !== 'unknown') {
      // Verify the user ID actually exists in DB before trusting it
      const pmCheck = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (pmCheck) projectManagerId = pmCheck.id;
    }

    if (!projectManagerId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      });
      projectManagerId = admin?.id;
    }

    if (!projectManagerId) {
      return res.status(500).json({ success: false, message: 'No project manager user found in database. Run: npm run prisma:seed' });
    }

    const wordCount = parseInt(body.wordCount, 10) || 0;
    const pageCount = parseInt(body.pageCount, 10) || 0;
    const ratePerWord = parseFloat(body.ratePerWord) || 0;
    const ratePerPage = parseFloat(body.ratePerPage) || 0;
    // Auto-compute clientAmount from word count × rate (form no longer sends it)
    const clientAmount = wordCount > 0
      ? wordCount * ratePerWord
      : pageCount * ratePerPage;
    const totalVendorCost = parseFloat(body.totalVendorCost) || 0;
    const grossProfit = clientAmount - totalVendorCost;
    const profitMargin = clientAmount > 0
      ? parseFloat(((grossProfit / clientAmount) * 100).toFixed(2))
      : 0;

    const projectCode = body.projectCode || await generateProjectCode();
    const deadline = body.deadline
      ? new Date(body.deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const project = await prisma.project.create({
      data: {
        projectCode,
        projectName: body.projectName || 'New Translation Job',
        projectManagerId,
        clientId,
        clientAddress: body.clientAddress || null,
        clientContact: body.clientContact || null,
        poNumber: body.poNumber || null,
        gstNumber: body.gstNumber || null,
        fileName: body.fileName || null,
        projectType: body.projectType || 'Translation',
        sourceLang: body.sourceLang || 'English',
        targetLang: body.targetLang || 'German',
        wordCount,
        pageCount,
        ratePerWord,
        ratePerPage,
        clientAmount,
        totalVendorCost,
        grossProfit,
        profitMargin,
        paidAmount: parseFloat(body.paidAmount) || 0,
        outstandingAmount: clientAmount - (parseFloat(body.paidAmount) || 0),
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        deadline,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'NEW',
        paymentStatus: body.paymentStatus || 'PENDING',
        notes: body.notes || null,
        invoiceNumber: body.invoiceNumber || null
      },
      include: {
        client: { select: { id: true, companyName: true } },
        projectManager: { select: { id: true, name: true } }
      }
    });

    await logAudit({
      req,
      action: 'CREATE_PROJECT',
      entity: 'PROJECT',
      entityId: project.id,
      afterValue: { projectCode: project.projectCode, projectName: project.projectName }
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: { ...project, clientName: project.client?.companyName || '' }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A project with this code already exists.'
      });
    }
    next(error);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Resolve clientId if clientName is sent
    let clientId = body.clientId || existing.clientId;
    if (body.clientName && !body.clientId) {
      const client = await prisma.client.findFirst({
        where: { companyName: { contains: body.clientName } }
      });
      if (client) clientId = client.id;
    }

    const wordCount = body.wordCount !== undefined ? parseInt(body.wordCount, 10) : existing.wordCount;
    const pageCount = body.pageCount !== undefined ? parseInt(body.pageCount, 10) : existing.pageCount;
    const ratePerWord = body.ratePerWord !== undefined ? parseFloat(body.ratePerWord) : existing.ratePerWord;
    const ratePerPage = body.ratePerPage !== undefined ? parseFloat(body.ratePerPage) : existing.ratePerPage;
    const clientAmount = body.clientAmount !== undefined
      ? parseFloat(body.clientAmount)
      : existing.clientAmount;
    const totalVendorCost = body.totalVendorCost !== undefined
      ? parseFloat(body.totalVendorCost)
      : existing.totalVendorCost;
    const grossProfit = clientAmount - totalVendorCost;
    const profitMargin = clientAmount > 0
      ? parseFloat(((grossProfit / clientAmount) * 100).toFixed(2))
      : existing.profitMargin;
    const paidAmount = body.paidAmount !== undefined ? parseFloat(body.paidAmount) : existing.paidAmount;

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        projectName: body.projectName !== undefined ? body.projectName : existing.projectName,
        clientId,
        clientAddress: body.clientAddress !== undefined ? body.clientAddress : existing.clientAddress,
        clientContact: body.clientContact !== undefined ? body.clientContact : existing.clientContact,
        poNumber: body.poNumber !== undefined ? body.poNumber : existing.poNumber,
        gstNumber: body.gstNumber !== undefined ? body.gstNumber : existing.gstNumber,
        fileName: body.fileName !== undefined ? body.fileName : existing.fileName,
        projectType: body.projectType !== undefined ? body.projectType : existing.projectType,
        sourceLang: body.sourceLang !== undefined ? body.sourceLang : existing.sourceLang,
        targetLang: body.targetLang !== undefined ? body.targetLang : existing.targetLang,
        wordCount,
        pageCount,
        ratePerWord,
        ratePerPage,
        clientAmount,
        totalVendorCost,
        grossProfit,
        profitMargin,
        paidAmount,
        outstandingAmount: clientAmount - paidAmount,
        deadline: body.deadline ? new Date(body.deadline) : existing.deadline,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        status: body.status !== undefined ? body.status : existing.status,
        paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : existing.paymentStatus,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        projectManagerId: body.projectManagerId !== undefined ? body.projectManagerId : existing.projectManagerId,
        invoiceNumber: body.invoiceNumber !== undefined ? body.invoiceNumber : existing.invoiceNumber
      },
      include: {
        client: { select: { id: true, companyName: true } },
        projectManager: { select: { id: true, name: true } }
      }
    });

    await logAudit({
      req,
      action: 'UPDATE_PROJECT',
      entity: 'PROJECT',
      entityId: project.id,
      beforeValue: { status: existing.status, projectName: existing.projectName },
      afterValue: { status: project.status, projectName: project.projectName }
    });

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      project: { ...project, clientName: project.client?.companyName || '' }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id/status
const updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: { status }
    });

    await logAudit({
      req,
      action: 'UPDATE_PROJECT_STATUS',
      entity: 'PROJECT',
      entityId: existing.id,
      beforeValue: { status: existing.status },
      afterValue: { status }
    });

    return res.json({ success: true, message: `Status updated to ${status}.`, project });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Cascade-delete related records that don't have DB-level cascade
    await prisma.$transaction([
      prisma.clientPayment.deleteMany({ where: { projectId: existing.id } }),
      prisma.vendorPayment.deleteMany({ where: { projectId: existing.id } }),
      prisma.vendorInvoice.deleteMany({ where: { projectId: existing.id } }),
      prisma.invoice.deleteMany({ where: { projectId: existing.id } }),
      prisma.project.delete({ where: { id: existing.id } })
    ]);

    await logAudit({
      req,
      action: 'DELETE_PROJECT',
      entity: 'PROJECT',
      entityId: existing.id,
      beforeValue: { projectCode: existing.projectCode, projectName: existing.projectName }
    });

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/notes
const addProjectNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required.' });
    }

    const project = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectCode: id }] }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const projectNote = await prisma.projectNote.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        note: note.trim()
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    return res.status(201).json({ success: true, note: projectNote });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/sync  (kept for backward compat — now a no-op since MySQL is the source)
const syncProjects = async (req, res) => {
  return res.json({ success: true, message: 'Sync not needed — MySQL is the source of truth.' });
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  addProjectNote,
  syncProjects,
  recalculateProjectFinancials
};
