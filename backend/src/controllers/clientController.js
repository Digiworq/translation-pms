const prisma = require('../config/prisma');
const { generateClientCode } = require('../utils/codeGenerator');
const { logAudit } = require('../utils/auditLogger');

// GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { clientCode: { contains: search } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: { select: { projects: true, invoices: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.client.count({ where })
    ]);

    return res.json({
      success: true,
      clients,
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

// GET /api/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: { OR: [{ id }, { clientCode: id }] },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, projectCode: true, projectName: true,
            status: true, paymentStatus: true, clientAmount: true,
            paidAmount: true, outstandingAmount: true, deadline: true
          }
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10,
          select: {
            id: true, invoiceNumber: true, grandTotal: true,
            paidAmount: true, balanceAmount: true, paymentStatus: true, dueDate: true
          }
        },
        _count: { select: { projects: true, invoices: true } }
      }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    // Aggregate financial stats from real project data
    const allProjects = await prisma.project.findMany({
      where: { clientId: client.id },
      select: { status: true, clientAmount: true, paidAmount: true, outstandingAmount: true }
    });

    const stats = {
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p =>
        ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(p.status)
      ).length,
      completedProjects: allProjects.filter(p =>
        ['COMPLETED', 'DELIVERED'].includes(p.status)
      ).length,
      totalBilled: allProjects.reduce((s, p) => s + (p.clientAmount || 0), 0),
      totalPaid: allProjects.reduce((s, p) => s + (p.paidAmount || 0), 0),
      outstandingAmount: allProjects.reduce((s, p) => s + (p.outstandingAmount || 0), 0)
    };

    return res.json({ success: true, client, stats });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!body.companyName || !body.email || !body.phone || !body.contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'companyName, contactPerson, email, and phone are required.'
      });
    }

    const clientCode = body.clientCode || await generateClientCode();

    const client = await prisma.client.create({
      data: {
        clientCode,
        companyName: body.companyName.trim(),
        contactPerson: body.contactPerson.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone.trim(),
        address: body.address || null,
        gstNumber: body.gstNumber || null,
        taxInfo: body.taxInfo || null,
        poInfo: body.poInfo || null,
        paymentTerms: body.paymentTerms || '30 Days',
        status: body.status || 'ACTIVE',
        notes: body.notes || null
      }
    });

    await logAudit({
      req,
      action: 'CREATE_CLIENT',
      entity: 'CLIENT',
      entityId: client.id,
      afterValue: { clientCode: client.clientCode, companyName: client.companyName }
    });

    return res.status(201).json({
      success: true,
      message: 'Client account created successfully.',
      client
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A client with this code or email already exists.'
      });
    }
    next(error);
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.client.findFirst({
      where: { OR: [{ id }, { clientCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        companyName: body.companyName !== undefined ? body.companyName : existing.companyName,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : existing.contactPerson,
        email: body.email !== undefined ? body.email.toLowerCase().trim() : existing.email,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        address: body.address !== undefined ? body.address : existing.address,
        gstNumber: body.gstNumber !== undefined ? body.gstNumber : existing.gstNumber,
        taxInfo: body.taxInfo !== undefined ? body.taxInfo : existing.taxInfo,
        poInfo: body.poInfo !== undefined ? body.poInfo : existing.poInfo,
        paymentTerms: body.paymentTerms !== undefined ? body.paymentTerms : existing.paymentTerms,
        status: body.status !== undefined ? body.status : existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes
      }
    });

    await logAudit({
      req,
      action: 'UPDATE_CLIENT',
      entity: 'CLIENT',
      entityId: client.id,
      beforeValue: { companyName: existing.companyName, status: existing.status },
      afterValue: { companyName: client.companyName, status: client.status }
    });

    return res.json({ success: true, message: 'Client updated successfully.', client });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.client.findFirst({
      where: { OR: [{ id }, { clientCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const cid = existing.id;

    // Gather all project IDs belonging to this client so we can delete their children too
    const clientProjects = await prisma.project.findMany({
      where: { clientId: cid },
      select: { id: true }
    });
    const projectIds = clientProjects.map(p => p.id);

    // Delete everything in dependency order inside a transaction
    await prisma.$transaction([
      // Project children
      prisma.projectVendor.deleteMany({ where: { projectId: { in: projectIds } } }),
      prisma.projectFile.deleteMany({ where: { projectId: { in: projectIds } } }),
      prisma.projectNote.deleteMany({ where: { projectId: { in: projectIds } } }),
      prisma.vendorInvoice.deleteMany({ where: { projectId: { in: projectIds } } }),
      prisma.vendorPayment.deleteMany({ where: { projectId: { in: projectIds } } }),
      // Invoice children
      prisma.clientPayment.deleteMany({ where: { clientId: cid } }),
      prisma.invoiceItem.deleteMany({
        where: { invoice: { clientId: cid } }
      }),
      prisma.invoice.deleteMany({ where: { clientId: cid } }),
      // Projects themselves
      prisma.project.deleteMany({ where: { clientId: cid } }),
      // Finally the client
      prisma.client.delete({ where: { id: cid } })
    ]);

    await logAudit({
      req, action: 'DELETE_CLIENT', entity: 'CLIENT', entityId: cid,
      beforeValue: { clientCode: existing.clientCode, companyName: existing.companyName }
    });

    return res.json({ success: true, message: 'Client and all related records deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };
