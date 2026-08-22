const prisma = require('../config/prisma');
const { generateInvoiceNumber } = require('../utils/codeGenerator');
const { logAudit } = require('../utils/auditLogger');

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { search, paymentStatus, clientId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { companyName: { contains: search } } }
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true, contactPerson: true, email: true } },
          project: { select: { id: true, projectCode: true, projectName: true } },
          items: true
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.invoice.count({ where })
    ]);

    return res.json({
      success: true,
      invoices,
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

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
      include: {
        client: true,
        project: {
          select: {
            id: true, projectCode: true, projectName: true,
            sourceLang: true, targetLang: true, projectType: true
          }
        },
        items: true,
        clientPayments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices
const createInvoice = async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!body.clientId) {
      return res.status(400).json({ success: false, message: 'clientId is required.' });
    }

    const client = await prisma.client.findUnique({ where: { id: body.clientId } });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    // Validate project if provided
    if (body.projectId) {
      const project = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }
    }

    const invoiceNumber = body.invoiceNumber || await generateInvoiceNumber();

    // Build line items
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0) || parseFloat(body.subtotal) || 0;

    const initialPaid = parseFloat(body.paidAmount || body.initialPaid) || 0;
    const paidAmount = Math.min(grandTotal, initialPaid);
    const balanceAmount = Math.max(0, grandTotal - paidAmount);
    
    let paymentStatus = body.paymentStatus || 'PENDING';
    if (paidAmount >= grandTotal && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: body.clientId,
        projectId: body.projectId || null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
        dueDate,
        poNumber: body.poNumber || client.poInfo || null,
        gstNumber: body.gstNumber || client.gstNumber || null,
        subtotal,
        taxAmount,
        discount,
        grandTotal,
        paidAmount,
        balanceAmount,
        paymentStatus,
        paymentMethod: body.paymentMethod || null,
        notes: body.notes || null,
        items: items.length > 0
          ? {
              create: items.map(item => ({
                service: item.service || 'Translation Service',
                language: item.language || null,
                quantity: parseFloat(item.quantity) || 1,
                unit: item.unit || 'word',
                rate: parseFloat(item.rate) || 0,
                amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0)
              }))
            }
          : undefined
      },
      include: {
        client: { select: { id: true, companyName: true, contactPerson: true, email: true } },
        project: { select: { id: true, projectCode: true } },
        items: true
      }
    });

    await logAudit({
      req,
      action: 'CREATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      afterValue: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal }
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      invoice
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'An invoice with this number already exists.'
      });
    }
    next(error);
  }
};

// PUT /api/invoices/:id
const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const subtotal = body.subtotal !== undefined ? parseFloat(body.subtotal) : existing.subtotal;
    const taxAmount = body.taxAmount !== undefined ? parseFloat(body.taxAmount) : existing.taxAmount;
    const discount = body.discount !== undefined ? parseFloat(body.discount) : existing.discount;
    const grandTotal = subtotal + taxAmount - discount;
    const paidAmount = body.paidAmount !== undefined ? parseFloat(body.paidAmount) : existing.paidAmount;
    const balanceAmount = grandTotal - paidAmount;

    let paymentStatus = existing.paymentStatus;
    if (body.paymentStatus) {
      paymentStatus = body.paymentStatus;
    } else if (balanceAmount <= 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
        poNumber: body.poNumber !== undefined ? body.poNumber : existing.poNumber,
        gstNumber: body.gstNumber !== undefined ? body.gstNumber : existing.gstNumber,
        subtotal,
        taxAmount,
        discount,
        grandTotal,
        paidAmount,
        balanceAmount,
        paymentStatus,
        notes: body.notes !== undefined ? body.notes : existing.notes
      },
      include: {
        client: { select: { id: true, companyName: true } },
        project: { select: { id: true, projectCode: true } },
        items: true
      }
    });

    await logAudit({
      req,
      action: 'UPDATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      beforeValue: { paymentStatus: existing.paymentStatus, paidAmount: existing.paidAmount },
      afterValue: { paymentStatus: invoice.paymentStatus, paidAmount: invoice.paidAmount }
    });

    return res.json({ success: true, message: 'Invoice updated successfully.', invoice });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    await prisma.$transaction([
      prisma.clientPayment.deleteMany({ where: { invoiceId: existing.id } }),
      prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } }),
      prisma.invoice.delete({ where: { id: existing.id } })
    ]);
    await logAudit({ req, action: 'DELETE_INVOICE', entity: 'INVOICE', entityId: existing.id,
      beforeValue: { invoiceNumber: existing.invoiceNumber, grandTotal: existing.grandTotal } });
    return res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice };
