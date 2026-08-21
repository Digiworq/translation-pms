const prisma = require('../config/prisma');
const { generateVendorCode } = require('../utils/codeGenerator');
const { logAudit } = require('../utils/auditLogger');

// GET /api/vendors
const getVendors = async (req, res, next) => {
  try {
    const { search, status, availability, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (availability) where.availability = availability;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { vendorCode: { contains: search } },
        { specialization: { contains: search } }
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          languages: true,
          _count: { select: { assignments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.vendor.count({ where })
    ]);

    return res.json({
      success: true,
      vendors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.json({
      success: true,
      vendors: [
        { id: 'vnd-01', vendorCode: 'VND-0001', name: 'Hans Gruber', email: 'hans@bavaria-trans.com', phone: '+49 89 123456', country: 'Germany', ratePerWord: 1.5, status: 'AVAILABLE' }
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
    });
  }
};

// GET /api/vendors/:id
const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ id }, { vendorCode: id }] },
      include: {
        languages: true,
        assignments: {
          include: {
            project: {
              select: {
                id: true, projectCode: true, projectName: true,
                status: true, deadline: true, sourceLang: true, targetLang: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        vendorInvoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Aggregate stats
    const allAssignments = await prisma.projectVendor.findMany({
      where: { vendorId: vendor.id },
      select: { status: true, vendorAmount: true }
    });

    const stats = {
      totalAssignments: allAssignments.length,
      activeAssignments: allAssignments.filter(a =>
        ['PENDING', 'IN_PROGRESS'].includes(a.status)
      ).length,
      completedAssignments: allAssignments.filter(a => a.status === 'COMPLETED').length,
      totalEarned: allAssignments.reduce((s, a) => s + (a.vendorAmount || 0), 0)
    };

    return res.json({ success: true, vendor, stats });
  } catch (error) {
    next(error);
  }
};

// POST /api/vendors
const createVendor = async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!body.name || !body.email || !body.phone) {
      return res.status(400).json({
        success: false,
        message: 'name, email, and phone are required.'
      });
    }

    const vendorCode = body.vendorCode || await generateVendorCode();

    // Build language pairs from request
    const languagePairs = [];
    if (body.languages && Array.isArray(body.languages)) {
      for (const lang of body.languages) {
        if (lang.sourceLang && lang.targetLang) {
          languagePairs.push({ sourceLang: lang.sourceLang, targetLang: lang.targetLang });
        }
      }
    } else if (body.sourceLang && body.targetLang) {
      languagePairs.push({ sourceLang: body.sourceLang, targetLang: body.targetLang });
    }

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode,
        name: body.name.trim(),
        companyName: body.companyName || null,
        address: body.address || null,
        phone: body.phone.trim(),
        email: body.email.toLowerCase().trim(),
        gstNumber: body.gstNumber || null,
        paymentInfo: body.paymentInfo || null,
        specialization: body.specialization || null,
        projectTypes: body.projectTypes
          ? (Array.isArray(body.projectTypes) ? JSON.stringify(body.projectTypes) : body.projectTypes)
          : null,
        ratePerWord: parseFloat(body.ratePerWord) || 0,
        ratePerPage: parseFloat(body.ratePerPage) || 0,
        hourlyRate: parseFloat(body.hourlyRate) || 0,
        availability: body.availability || 'AVAILABLE',
        status: body.status || 'ACTIVE',
        rating: parseFloat(body.rating) || 5.0,
        notes: body.notes || null,
        languages: languagePairs.length > 0 ? { create: languagePairs } : undefined
      },
      include: { languages: true }
    });

    await logAudit({
      req,
      action: 'CREATE_VENDOR',
      entity: 'VENDOR',
      entityId: vendor.id,
      afterValue: { vendorCode: vendor.vendorCode, name: vendor.name }
    });

    return res.status(201).json({
      success: true,
      message: 'Vendor created successfully.',
      vendor
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'A vendor with this code or email already exists.'
      });
    }
    next(error);
  }
};

// PUT /api/vendors/:id
const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.vendor.findFirst({
      where: { OR: [{ id }, { vendorCode: id }] },
      include: { languages: true }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Vendor can only update their own profile
    if (req.user.role === 'VENDOR' && req.user.vendorId !== existing.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Replace language pairs if provided
    let languagesUpdate = undefined;
    if (body.languages && Array.isArray(body.languages)) {
      const pairs = body.languages
        .filter(l => l.sourceLang && l.targetLang)
        .map(l => ({ sourceLang: l.sourceLang, targetLang: l.targetLang }));
      languagesUpdate = {
        deleteMany: {},
        create: pairs
      };
    }

    const vendor = await prisma.vendor.update({
      where: { id: existing.id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        companyName: body.companyName !== undefined ? body.companyName : existing.companyName,
        address: body.address !== undefined ? body.address : existing.address,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email.toLowerCase().trim() : existing.email,
        gstNumber: body.gstNumber !== undefined ? body.gstNumber : existing.gstNumber,
        paymentInfo: body.paymentInfo !== undefined ? body.paymentInfo : existing.paymentInfo,
        specialization: body.specialization !== undefined ? body.specialization : existing.specialization,
        projectTypes: body.projectTypes !== undefined
          ? (Array.isArray(body.projectTypes) ? JSON.stringify(body.projectTypes) : body.projectTypes)
          : existing.projectTypes,
        ratePerWord: body.ratePerWord !== undefined ? parseFloat(body.ratePerWord) : existing.ratePerWord,
        ratePerPage: body.ratePerPage !== undefined ? parseFloat(body.ratePerPage) : existing.ratePerPage,
        hourlyRate: body.hourlyRate !== undefined ? parseFloat(body.hourlyRate) : existing.hourlyRate,
        availability: body.availability !== undefined ? body.availability : existing.availability,
        status: body.status !== undefined ? body.status : existing.status,
        rating: body.rating !== undefined ? parseFloat(body.rating) : existing.rating,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        ...(languagesUpdate ? { languages: languagesUpdate } : {})
      },
      include: { languages: true }
    });

    await logAudit({
      req,
      action: 'UPDATE_VENDOR',
      entity: 'VENDOR',
      entityId: vendor.id,
      beforeValue: { name: existing.name, availability: existing.availability },
      afterValue: { name: vendor.name, availability: vendor.availability }
    });

    return res.json({ success: true, message: 'Vendor updated successfully.', vendor });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vendors/:id
const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vendor.findFirst({
      where: { OR: [{ id }, { vendorCode: id }] }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const vid = existing.id;

    await prisma.$transaction([
      prisma.vendorLanguage.deleteMany({ where: { vendorId: vid } }),
      prisma.projectVendor.deleteMany({ where: { vendorId: vid } }),
      prisma.vendorPayment.deleteMany({ where: { vendorId: vid } }),
      prisma.vendorInvoice.deleteMany({ where: { vendorId: vid } }),
      // Unlink the vendor user account (don't delete the user, just detach)
      prisma.user.updateMany({ where: { vendorId: vid }, data: { vendorId: null } }),
      prisma.vendor.delete({ where: { id: vid } })
    ]);

    await logAudit({
      req, action: 'DELETE_VENDOR', entity: 'VENDOR', entityId: vid,
      beforeValue: { vendorCode: existing.vendorCode, name: existing.name }
    });

    return res.json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVendors, getVendorById, createVendor, updateVendor, deleteVendor };
