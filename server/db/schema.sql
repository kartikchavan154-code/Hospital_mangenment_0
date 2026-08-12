-- ==========================================
-- Hospital Management System — Database Schema
-- ==========================================

CREATE DATABASE IF NOT EXISTS hospital_mgmt;
USE hospital_mgmt;

-- -------------------------------------------
-- 1. Users (authentication & role management)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'receptionist', 'patient') NOT NULL DEFAULT 'patient',
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(500),
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
);

-- -------------------------------------------
-- 2. Departments
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  headDoctorId INT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------
-- 3. Doctors
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  departmentId INT,
  specialization VARCHAR(200) NOT NULL,
  qualification VARCHAR(300),
  experience INT DEFAULT 0,
  consultationFee DECIMAL(10, 2) DEFAULT 0.00,
  availability JSON,
  bio TEXT,
  isAvailable BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (departmentId) REFERENCES Departments(id) ON DELETE SET NULL,
  INDEX idx_doctors_specialization (specialization)
);

-- Add FK for headDoctorId after Doctors table exists
ALTER TABLE Departments ADD FOREIGN KEY (headDoctorId) REFERENCES Doctors(id) ON DELETE SET NULL;

-- -------------------------------------------
-- 4. Patients
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  dateOfBirth DATE,
  gender ENUM('male', 'female', 'other'),
  bloodGroup ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  address TEXT,
  emergencyContact VARCHAR(100),
  emergencyPhone VARCHAR(20),
  allergies TEXT,
  insuranceProvider VARCHAR(200),
  insuranceNumber VARCHAR(100),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- -------------------------------------------
-- 5. Appointments
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  doctorId INT NOT NULL,
  appointmentDate DATE NOT NULL,
  appointmentTime TIME NOT NULL,
  duration INT DEFAULT 30,
  status ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  type ENUM('consultation', 'follow-up', 'emergency', 'routine-checkup') DEFAULT 'consultation',
  reason TEXT,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE,
  INDEX idx_appointments_date (appointmentDate),
  INDEX idx_appointments_doctor_date (doctorId, appointmentDate),
  INDEX idx_appointments_status (status)
);

-- -------------------------------------------
-- 6. Medical Records
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS MedicalRecords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  doctorId INT NOT NULL,
  appointmentId INT,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  vitals JSON,
  notes TEXT,
  followUpDate DATE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctorId) REFERENCES Doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (appointmentId) REFERENCES Appointments(id) ON DELETE SET NULL,
  INDEX idx_records_patient (patientId)
);

-- -------------------------------------------
-- 7. Prescriptions
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicalRecordId INT NOT NULL,
  medication VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  instructions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (medicalRecordId) REFERENCES MedicalRecords(id) ON DELETE CASCADE
);

-- -------------------------------------------
-- 8. Bills
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  appointmentId INT,
  invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
  items JSON NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'partial', 'overdue', 'cancelled') DEFAULT 'pending',
  dueDate DATE,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointmentId) REFERENCES Appointments(id) ON DELETE SET NULL,
  INDEX idx_bills_invoice (invoiceNumber),
  INDEX idx_bills_status (status)
);

-- -------------------------------------------
-- 9. Payments
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('cash', 'card', 'upi', 'insurance', 'bank-transfer') NOT NULL,
  transactionId VARCHAR(100),
  notes TEXT,
  paidAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (billId) REFERENCES Bills(id) ON DELETE CASCADE,
  INDEX idx_payments_bill (billId)
);

-- -------------------------------------------
-- 10. Audit Logs
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS AuditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entityId INT,
  previousData JSON,
  newData JSON,
  ipAddress VARCHAR(45),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity, entityId),
  INDEX idx_audit_user (userId),
  INDEX idx_audit_date (createdAt)
);

-- -------------------------------------------
-- 11. Reports
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS Reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientId INT NOT NULL,
  medicalRecordId INT,
  title VARCHAR(200) NOT NULL,
  type ENUM('lab-report', 'radiology', 'pathology', 'prescription', 'discharge-summary') NOT NULL,
  filePath VARCHAR(500),
  notes TEXT,
  generatedBy INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medicalRecordId) REFERENCES MedicalRecords(id) ON DELETE SET NULL,
  FOREIGN KEY (generatedBy) REFERENCES Users(id) ON DELETE SET NULL
);
