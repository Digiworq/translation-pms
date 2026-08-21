const prisma = require('../config/prisma');
const { logAudit } = require('../utils/auditLogger');

// POST /api/payments/client
const recordClientPayment = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { invoiceId, clientId, projectId, amount, paymentMethod, transactionRef, notes } = body;

    if (!invoiceId || !clientId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'invoiceId, clientId, and amount are required.'
      });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const paymentAmount = parseFloat(amount);

    // Record the payment
    const payment = await prisma.clientPayment.create({
      data: {
        invoiceId,
        clientId,
        projectId: projectId || invoice.projectId || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        amount: paymentAmount,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionRef: transactionRef || null,
        status: 'COMPLETED',
        notes: notes || null
      },
      include: {
        client: { select: { id: true, companyName: true } },
        invoice: { select: { id: true, invoiceNumber: true, grandTotal: true } }
      }
    });

    // Update invoice paid/balance amounts and status
    const newPaid = invoice.paidAmount + paymentAmount;
    const newBalance = invoice.grandTotal - newPaid;
    let paymentStatus = 'PARTIALLY_PAID';
    if (newBalance <= 0) paymentStatus = 'PAID';
    else if (newPaid <= 0) paymentStatus = 'PENDING';

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        balanceAmount: Math.max(0, newBalance),
        paymentStatus
      }
    });

    // Also update project paidAmount and outstandingAmount if linked
    const linkedProjectId = projectId || invoice.projectId;
    if (linkedProjectId) {
      const project = await prisma.project.findUnique({ where: { id: linkedProjectId } });
      if (project) {
        const newProjectPaid = project.paidAmount + paymentAmount;
        const newOutstanding = Math.max(0, project.clientAmount - newProjectPaid);
        let projectPaymentStatus = 'PARTIALLY_PAID';
        if (newOutstanding <= 0) projectPaymentStatus = 'PAID';
        else if (newProjectPaid <= 0) projectPaymentStatus = 'PENDING';

        await prisma.project.update({
          where: { id: linkedProjectId },
          data: {
            paidAmount: newProjectPaid,
            outstandingAmount: newOutstanding,
            paymentStatus: projectPaymentStatus
          }
        });
      }
    }

    await logAudit({
      req,
      action: 'RECORD_CLIENT_PAYMENT',
      entity: 'INVOICE',
      entityId: invoiceId,
      afterValue: { amount: paymentAmount, paymentMethod, transactionRef }
    });

    return res.status(201).json({
      success: true,
      message: 'Client payment recorded successfully.',
      payment
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/client
const getClientPayments = async (req, res, next) => {
  try {
    const { clientId, invoiceId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (clientId) where.clientId = clientId;
    if (invoiceId) where.invoiceId = invoiceId;

    const [payments, total] = await Promise.all([
      prisma.clientPayment.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          invoice: { select: { id: true, invoiceNumber: true, grandTotal: true } },
          project: { select: { id: true, projectCode: true, projectName: true } }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.clientPayment.count({ where })
    ]);

    return res.json({
      success: true,
      payments,
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

// POST /api/payments/vendor
const recordVendorPayment = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { vendorId, vendorInvoiceId, projectId, amount, paymentMethod, transactionRef, notes } = body;

    if (!vendorId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'vendorId and amount are required.'
      });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const paymentAmount = parseFloat(amount);

    const payment = await prisma.vendorPayment.create({
      data: {
        vendorId,
        vendorInvoiceId: vendorInvoiceId || null,
        projectId: projectId || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        amount: paymentAmount,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionRef: transactionRef || null,
        status: 'PAID',
        notes: notes || null
      },
      include: {
        vendor: { select: { id: true, name: true, vendorCode: true } },
        project: { select: { id: true, projectCode: true, projectName: true } }
      }
    });

    // If linked to a vendor invoice, update its status
    if (vendorInvoiceId) {
      const vendorInvoice = await prisma.vendorInvoice.findUnique({ where: { id: vendorInvoiceId } });
      if (vendorInvoice) {
        await prisma.vendorInvoice.update({
          where: { id: vendorInvoiceId },
          data: { status: 'PAID' }
        });
      }
    }

    await logAudit({
      req,
      action: 'RECORD_VENDOR_PAYMENT',
      entity: 'VENDOR',
      entityId: vendorId,
      afterValue: { amount: paymentAmount, paymentMethod, transactionRef }
    });

    return res.status(201).json({
      success: true,
      message: 'Vendor payment recorded successfully.',
      payment
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/vendor
const getVendorPayments = async (req, res, next) => {
  try {
    const { vendorId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (vendorId) where.vendorId = vendorId;

    const [payments, total] = await Promise.all([
      prisma.vendorPayment.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, vendorCode: true } },
          project: { select: { id: true, projectCode: true, projectName: true } }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.vendorPayment.count({ where })
    ]);

    return res.json({
      success: true,
      payments,
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

module.exports = {
  recordClientPayment,
  getClientPayments,
  recordVendorPayment,
  getVendorPayments
};
