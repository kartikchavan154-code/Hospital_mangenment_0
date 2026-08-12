require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize, User, Department, Doctor, Patient, Appointment, MedicalRecord, Prescription, Bill, Payment } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Sync (force: true drops and recreates all tables)
    await sequelize.sync({ force: true });
    console.log('📦 Tables recreated.');

    // 1. Departments
    const departments = await Department.bulkCreate([
      { name: 'Cardiology', description: 'Heart and cardiovascular diseases' },
      { name: 'Neurology', description: 'Brain and nervous system disorders' },
      { name: 'Orthopedics', description: 'Bone, joint, and muscle conditions' },
      { name: 'Pediatrics', description: 'Medical care for infants and children' },
      { name: 'General Medicine', description: 'Primary healthcare and general diagnosis' },
    ]);
    console.log('✅ Departments seeded.');

    // 2. Users — Admin
    const admin = await User.create({
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '555-0100',
    });

    // 3. Users — Receptionist
    const receptionist = await User.create({
      email: 'reception@hospital.com',
      password: 'reception123',
      role: 'receptionist',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0101',
    });

    // 4. Users — Doctors
    const doctorUsers = await User.bulkCreate([
      { email: 'dr.smith@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'Robert', lastName: 'Smith', phone: '555-0201' },
      { email: 'dr.patel@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'Priya', lastName: 'Patel', phone: '555-0202' },
      { email: 'dr.chen@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'Wei', lastName: 'Chen', phone: '555-0203' },
      { email: 'dr.garcia@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'Maria', lastName: 'Garcia', phone: '555-0204' },
      { email: 'dr.wilson@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'James', lastName: 'Wilson', phone: '555-0205' },
      { email: 'dr.kumar@hospital.com', password: '$2a$12$LJ3dBhsa2jRkIOGqaF7Qbu/KeIZRv.5LBwBqv.Ls3lGRfaVb5m7yO', role: 'doctor', firstName: 'Raj', lastName: 'Kumar', phone: '555-0206' },
    ], { individualHooks: false });

    // Note: The hashed passwords above are the bcrypt hash of "doctor123"
    // Since we used individualHooks: false, we need pre-hashed passwords
    console.log('✅ Doctor users seeded.');

    // 5. Doctor profiles
    const doctors = await Doctor.bulkCreate([
      { userId: doctorUsers[0].id, departmentId: departments[0].id, specialization: 'Interventional Cardiology', qualification: 'MD, DM Cardiology', experience: 15, consultationFee: 200, bio: 'Expert in cardiac catheterization and stent placement.' },
      { userId: doctorUsers[1].id, departmentId: departments[1].id, specialization: 'Neurophysiology', qualification: 'MD, DM Neurology', experience: 12, consultationFee: 250, bio: 'Specialist in epilepsy and movement disorders.' },
      { userId: doctorUsers[2].id, departmentId: departments[2].id, specialization: 'Joint Replacement', qualification: 'MS Orthopedics, Fellowship', experience: 18, consultationFee: 180, bio: 'Pioneer in minimally invasive joint replacement surgery.' },
      { userId: doctorUsers[3].id, departmentId: departments[3].id, specialization: 'Pediatric Immunology', qualification: 'MD Pediatrics, Fellowship', experience: 10, consultationFee: 150, bio: 'Focused on childhood allergies and immune disorders.' },
      { userId: doctorUsers[4].id, departmentId: departments[4].id, specialization: 'Internal Medicine', qualification: 'MD Internal Medicine', experience: 20, consultationFee: 120, bio: 'Comprehensive primary care with a focus on preventive medicine.' },
      { userId: doctorUsers[5].id, departmentId: departments[0].id, specialization: 'Cardiac Electrophysiology', qualification: 'MD, DM Cardiology', experience: 8, consultationFee: 220, bio: 'Expert in cardiac arrhythmias and pacemaker implantation.' },
    ]);
    console.log('✅ Doctor profiles seeded.');

    // Set department heads
    await departments[0].update({ headDoctorId: doctors[0].id });
    await departments[1].update({ headDoctorId: doctors[1].id });
    await departments[2].update({ headDoctorId: doctors[2].id });

    // 6. Users — Patients
    const patientUsers = await User.bulkCreate([
      { email: 'john.doe@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'John', lastName: 'Doe', phone: '555-1001' },
      { email: 'jane.doe@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Jane', lastName: 'Doe', phone: '555-1002' },
      { email: 'mike.brown@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Michael', lastName: 'Brown', phone: '555-1003' },
      { email: 'emily.davis@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Emily', lastName: 'Davis', phone: '555-1004' },
      { email: 'alex.johnson@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Alex', lastName: 'Johnson', phone: '555-1005' },
      { email: 'sophia.lee@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Sophia', lastName: 'Lee', phone: '555-1006' },
      { email: 'david.miller@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'David', lastName: 'Miller', phone: '555-1007' },
      { email: 'olivia.wilson@hospital.com', password: '$2a$12$k4kq.5m4e9nL3Q3d5hJ1oOGQWyZrHG5Bi.R7V/b0F9M3zQh3Xs8Y6', role: 'patient', firstName: 'Olivia', lastName: 'Wilson', phone: '555-1008' },
    ], { individualHooks: false });
    console.log('✅ Patient users seeded.');

    // 7. Patient profiles
    const patients = await Patient.bulkCreate([
      { userId: patientUsers[0].id, dateOfBirth: '1985-03-15', gender: 'male', bloodGroup: 'A+', address: '123 Oak Street, Anytown', emergencyContact: 'Jane Doe', emergencyPhone: '555-1002', allergies: 'Penicillin', insuranceProvider: 'Blue Cross', insuranceNumber: 'BC-12345' },
      { userId: patientUsers[1].id, dateOfBirth: '1990-07-22', gender: 'female', bloodGroup: 'B+', address: '456 Elm Avenue, Anytown', emergencyContact: 'John Doe', emergencyPhone: '555-1001', allergies: 'None', insuranceProvider: 'Aetna', insuranceNumber: 'AE-67890' },
      { userId: patientUsers[2].id, dateOfBirth: '1978-11-08', gender: 'male', bloodGroup: 'O+', address: '789 Pine Road, Anytown', emergencyContact: 'Lisa Brown', emergencyPhone: '555-2003', allergies: 'Sulfa drugs', insuranceProvider: 'United Health', insuranceNumber: 'UH-11111' },
      { userId: patientUsers[3].id, dateOfBirth: '1995-01-30', gender: 'female', bloodGroup: 'AB-', address: '321 Maple Lane, Anytown', emergencyContact: 'Tom Davis', emergencyPhone: '555-2004', allergies: 'Latex', insuranceProvider: 'Cigna', insuranceNumber: 'CG-22222' },
      { userId: patientUsers[4].id, dateOfBirth: '1982-06-12', gender: 'male', bloodGroup: 'A-', address: '654 Cedar Drive, Anytown', emergencyContact: 'Karen Johnson', emergencyPhone: '555-2005', allergies: 'None', insuranceProvider: 'Blue Cross', insuranceNumber: 'BC-33333' },
      { userId: patientUsers[5].id, dateOfBirth: '1998-09-25', gender: 'female', bloodGroup: 'O-', address: '987 Birch Court, Anytown', emergencyContact: 'James Lee', emergencyPhone: '555-2006', allergies: 'Aspirin', insuranceProvider: 'Aetna', insuranceNumber: 'AE-44444' },
      { userId: patientUsers[6].id, dateOfBirth: '1970-04-18', gender: 'male', bloodGroup: 'B-', address: '147 Walnut Street, Anytown', emergencyContact: 'Sarah Miller', emergencyPhone: '555-2007', allergies: 'Ibuprofen', insuranceProvider: 'Kaiser', insuranceNumber: 'KP-55555' },
      { userId: patientUsers[7].id, dateOfBirth: '1988-12-05', gender: 'female', bloodGroup: 'AB+', address: '258 Spruce Way, Anytown', emergencyContact: 'James Wilson', emergencyPhone: '555-2008', allergies: 'None', insuranceProvider: 'United Health', insuranceNumber: 'UH-66666' },
    ]);
    console.log('✅ Patient profiles seeded.');

    // 8. Appointments
    const today = new Date();
    const appointments = [];
    const statuses = ['scheduled', 'confirmed', 'completed', 'completed', 'completed'];
    const types = ['consultation', 'follow-up', 'routine-checkup', 'consultation'];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 60) + 5);
      const hour = 9 + Math.floor(Math.random() * 8);
      const minute = Math.random() > 0.5 ? '00' : '30';

      appointments.push({
        patientId: patients[Math.floor(Math.random() * patients.length)].id,
        doctorId: doctors[Math.floor(Math.random() * doctors.length)].id,
        appointmentDate: date.toISOString().split('T')[0],
        appointmentTime: `${String(hour).padStart(2, '0')}:${minute}:00`,
        duration: [15, 30, 45][Math.floor(Math.random() * 3)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        reason: ['General checkup', 'Follow-up visit', 'Chest pain', 'Headache', 'Joint pain', 'Fever', 'Back pain', 'Routine screening'][Math.floor(Math.random() * 8)],
      });
    }

    const createdAppointments = await Appointment.bulkCreate(appointments);
    console.log('✅ Appointments seeded.');

    // 9. Medical Records (for completed appointments)
    const completedAppts = createdAppointments.filter((a) => a.status === 'completed');
    const records = [];

    for (const appt of completedAppts.slice(0, 15)) {
      records.push({
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        appointmentId: appt.id,
        diagnosis: ['Hypertension Stage 1', 'Mild Osteoarthritis', 'Tension Headache', 'Upper Respiratory Infection', 'Type 2 Diabetes - Controlled', 'Vitamin D Deficiency', 'Gastritis'][Math.floor(Math.random() * 7)],
        symptoms: ['chest pain, shortness of breath', 'headache, dizziness', 'joint pain, stiffness', 'fever, cough, sore throat', 'fatigue, frequent urination', 'bone pain, muscle weakness'][Math.floor(Math.random() * 6)],
        vitals: JSON.stringify({ bp: `${120 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 20)}`, pulse: 60 + Math.floor(Math.random() * 40), temp: (97 + Math.random() * 3).toFixed(1), weight: 60 + Math.floor(Math.random() * 40) }),
        notes: 'Patient is advised to follow up in 2 weeks. Continue medication as prescribed.',
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    const createdRecords = await MedicalRecord.bulkCreate(records);
    console.log('✅ Medical records seeded.');

    // 10. Prescriptions
    const prescriptions = [];
    for (const record of createdRecords) {
      const numMeds = 1 + Math.floor(Math.random() * 3);
      const meds = [
        { medication: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning with water' },
        { medication: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '90 days', instructions: 'Take with meals' },
        { medication: 'Ibuprofen', dosage: '400mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Take after food' },
        { medication: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', duration: '14 days', instructions: 'Take before breakfast' },
        { medication: 'Vitamin D3', dosage: '60000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'Take with a fatty meal' },
        { medication: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '10 days', instructions: 'Take at bedtime' },
      ];

      for (let i = 0; i < numMeds; i++) {
        const med = meds[Math.floor(Math.random() * meds.length)];
        prescriptions.push({ ...med, medicalRecordId: record.id });
      }
    }

    await Prescription.bulkCreate(prescriptions);
    console.log('✅ Prescriptions seeded.');

    // 11. Bills
    const bills = [];
    for (const appt of completedAppts.slice(0, 12)) {
      const doctor = doctors.find((d) => d.id === appt.doctorId);
      const fee = parseFloat(doctor?.consultationFee || 100);
      const labFee = Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 50 : 0;
      const subtotal = fee + labFee;
      const tax = subtotal * 0.05;
      const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0;

      bills.push({
        patientId: appt.patientId,
        appointmentId: appt.id,
        invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        items: JSON.stringify([
          { name: 'Consultation Fee', description: 'Doctor consultation', quantity: 1, rate: fee, amount: fee },
          ...(labFee > 0 ? [{ name: 'Lab Tests', description: 'Blood work & diagnostics', quantity: 1, rate: labFee, amount: labFee }] : []),
        ]),
        subtotal,
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        totalAmount: (subtotal + tax - discount).toFixed(2),
        status: Math.random() > 0.3 ? 'paid' : 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    const createdBills = await Bill.bulkCreate(bills);
    console.log('✅ Bills seeded.');

    // 12. Payments (for paid bills)
    const payments = [];
    for (const bill of createdBills.filter((b) => b.status === 'paid')) {
      payments.push({
        billId: bill.id,
        amount: bill.totalAmount,
        method: ['cash', 'card', 'upi', 'insurance'][Math.floor(Math.random() * 4)],
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paidAt: new Date(),
      });
    }

    await Payment.bulkCreate(payments);
    console.log('✅ Payments seeded.');

    console.log('\n🎉 All seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:        admin@hospital.com / admin123');
    console.log('   Receptionist: reception@hospital.com / reception123');
    console.log('   Doctor:       dr.smith@hospital.com / doctor123');
    console.log('   Patient:      john.doe@hospital.com / patient123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
