const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { logAudit } = require('../utils/auditLogger');

const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          vendorId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      success: true,
      users,
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

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        vendorId: true,
        vendor: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, name, phone, role, vendorId } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and role are required.'
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        phone,
        role,
        vendorId: vendorId || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        vendorId: true,
        createdAt: true
      }
    });

    await logAudit({
      req,
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: user.id,
      afterValue: user
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, vendorId } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : currentUser.name,
        phone: phone !== undefined ? phone : currentUser.phone,
        role: role !== undefined ? role : currentUser.role,
        status: status !== undefined ? status : currentUser.status,
        vendorId: vendorId !== undefined ? (vendorId || null) : currentUser.vendorId
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        vendorId: true,
        updatedAt: true
      }
    });

    await logAudit({
      req,
      action: 'UPDATE_USER',
      entity: 'USER',
      entityId: id,
      beforeValue: currentUser,
      afterValue: updatedUser
    });

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    await logAudit({
      req,
      action: 'RESET_PASSWORD',
      entity: 'USER',
      entityId: id
    });

    return res.json({
      success: true,
      message: 'User password reset successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword
};
