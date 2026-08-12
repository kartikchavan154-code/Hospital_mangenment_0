const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const createDb = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS hospital_mgmt;');
    console.log("✅ Database 'hospital_mgmt' created or already exists.");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create database:", error.message);
    process.exit(1);
  }
};

createDb();
