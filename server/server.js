require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeTransporter } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for reports/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hospital Management System API is running.', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patients', require('./routes/patients.routes'));
app.use('/api/doctors', require('./routes/doctors.routes'));
app.use('/api/departments', require('./routes/departments.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));
app.use('/api/bills', require('./routes/bills.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/medical-records', require('./routes/medical-records.routes'));
app.use('/api/prescriptions', require('./routes/prescriptions.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/audit-logs', require('./routes/audit-logs.routes'));
app.use('/api/ml', require('./routes/ml.routes'));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

// Database Initialization
const dbType = process.env.DB_TYPE || 'firestore';
const { initializeFirestore } = require('./config/firestore');

// Start server
const start = async () => {
  try {
    if (dbType === 'firestore') {
      console.log('🔥 Configured Database: Cloud Firestore');
      initializeFirestore();
    } else {
      console.log('📦 Configured Database: MySQL');
      try {
        await testConnection();
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('📦 MySQL Database synced.');
      } catch (dbErr) {
        console.warn('⚠️ MySQL connection failed, falling back to Firestore mode:', dbErr.message);
        initializeFirestore();
      }
    }

    initializeTransporter();

    app.listen(PORT, () => {
      console.log(`\n🏥 Hospital Management System API`);
      console.log(`   Server running on http://localhost:${PORT}`);
      console.log(`   Database Mode: ${dbType.toUpperCase()}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
