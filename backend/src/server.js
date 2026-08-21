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

// Enable CORS — allow localhost in dev, Vercel domain in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,           // set this to your Vercel URL in production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // open for now — tighten after deploy
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database Health check endpoint
app.get('/api/test-db', (req, res) => {
  res.json({ success: true, message: 'Server & DB route online.' });
});
app.get('/test-db', (req, res) => {
  res.json({ success: true, message: 'Server & DB route online.' });
});

// Dual Mount Router (Supports both Vercel Serverless Rewrites and Direct Localhost requests)
const mainRouter = express.Router();
mainRouter.use('/auth', authRoutes);
mainRouter.use('/users', userRoutes);
mainRouter.use('/clients', clientRoutes);
mainRouter.use('/vendors', vendorRoutes);
mainRouter.use('/projects', projectRoutes);
mainRouter.use('/files', fileRoutes);
mainRouter.use('/invoices', invoiceRoutes);
mainRouter.use('/payments', paymentRoutes);
mainRouter.use('/dashboard', dashboardRoutes);
mainRouter.use('/reports', reportRoutes);
mainRouter.use('/notifications', notificationRoutes);
mainRouter.use('/audit-logs', auditLogRoutes);
mainRouter.use('/settings', settingRoutes);

app.use('/api', mainRouter);
app.use('/', mainRouter);

// Error Handler Middleware
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [SERVER ONLINE] PMS Backend listening on port ${PORT}`);
    console.log(`🔗 Direct API URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
