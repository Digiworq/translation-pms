const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const projectRoutes = require('./routes/projectRoutes');
const fileRoutes = require('./routes/fileRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingRoutes = require('./routes/settingRoutes');

const { connectMongoDB, getDb, DB_NAME } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MongoDB Connection
connectMongoDB();

// Enable Universal CORS for all Origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Core Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'pms_cookie_secret_key_987654'));

// Root API info endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Translation & Localization PMS REST API Server is active.',
    health: 'http://localhost:5000/api/health',
    testDb: 'http://localhost:5000/api/test-db'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Translation & Localization PMS API'
  });
});

// Direct MongoDB Verification Endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    let db = getDb();
    if (!db) db = await connectMongoDB();

    if (!db) {
      return res.status(500).json({ success: false, message: 'MongoDB Not Connected' });
    }

    const projects = await db.collection('projects').find({}).toArray();
    const clients = await db.collection('clients').find({}).toArray();
    const vendors = await db.collection('vendors').find({}).toArray();

    return res.json({
      success: true,
      database: DB_NAME,
      connectionStatus: 'CONNECTED & ACTIVE',
      collectionsCount: {
        projects: projects.length,
        clients: clients.length,
        vendors: vendors.length
      },
      projectsList: projects
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', settingRoutes);

// Error Handler Middleware
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [SERVER ONLINE] PMS Backend listening on port ${PORT}`);
    console.log(`🔗 Direct API URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;

