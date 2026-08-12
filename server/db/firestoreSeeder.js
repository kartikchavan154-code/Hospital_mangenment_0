require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { initializeFirestore } = require('../config/firestore');
const { COLLECTIONS } = require('./firestoreAdapter');

const seedFirestore = async () => {
  try {
    const db = initializeFirestore();
    console.log('🔥 Initializing Cloud Firestore Seeder...');

    // 1. Seed Departments
    const departmentData = [
      { id: 'dept-cardio', name: 'Cardiology', description: 'Heart and cardiovascular diseases' },
      { id: 'dept-neuro', name: 'Neurology', description: 'Brain and nervous system disorders' },
      { id: 'dept-ortho', name: 'Orthopedics', description: 'Bone, joint, and muscle conditions' },
      { id: 'dept-peds', name: 'Pediatrics', description: 'Medical care for infants and children' },
      { id: 'dept-genmed', name: 'General Medicine', description: 'Primary healthcare and general diagnosis' },
    ];

    for (const dept of departmentData) {
      await db.collection(COLLECTIONS.DEPARTMENTS).doc(dept.id).set({
        ...dept,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Departments seeded in Firestore.');

    // 2. Admin & Receptionist Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const receptionPasswordHash = await bcrypt.hash('reception123', 10);
    const doctorPasswordHash = await bcrypt.hash('doctor123', 10);
    const patientPasswordHash = await bcrypt.hash('patient123', 10);

    const adminUser = {
      id: 'usr-admin-1',
      email: 'admin@hospital.com',
      password: adminPasswordHash,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '555-0100',
      createdAt: new Date().toISOString(),
    };
    await db.collection(COLLECTIONS.USERS).doc(adminUser.id).set(adminUser);

    const receptionUser = {
      id: 'usr-reception-1',
      email: 'reception@hospital.com',
      password: receptionPasswordHash,
      role: 'receptionist',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0101',
      createdAt: new Date().toISOString(),
    };
    await db.collection(COLLECTIONS.USERS).doc(receptionUser.id).set(receptionUser);

    // 3. Doctors & Users
    const doctorSeeds = [
      { id: 'doc-1', userId: 'usr-doc-1', email: 'dr.smith@hospital.com', firstName: 'Robert', lastName: 'Smith', deptId: 'dept-cardio', specialization: 'Interventional Cardiology', qualification: 'MD, DM Cardiology', experience: 15, consultationFee: 200, bio: 'Expert in cardiac catheterization and stent placement.' },
      { id: 'doc-2', userId: 'usr-doc-2', email: 'dr.patel@hospital.com', firstName: 'Priya', lastName: 'Patel', deptId: 'dept-neuro', specialization: 'Neurophysiology', qualification: 'MD, DM Neurology', experience: 12, consultationFee: 250, bio: 'Specialist in epilepsy and movement disorders.' },
      { id: 'doc-3', userId: 'usr-doc-3', email: 'dr.chen@hospital.com', firstName: 'Wei', lastName: 'Chen', deptId: 'dept-ortho', specialization: 'Joint Replacement', qualification: 'MS Orthopedics, Fellowship', experience: 18, consultationFee: 180, bio: 'Pioneer in minimally invasive joint replacement surgery.' },
      { id: 'doc-4', userId: 'usr-doc-4', email: 'dr.garcia@hospital.com', firstName: 'Maria', lastName: 'Garcia', deptId: 'dept-peds', specialization: 'Pediatric Immunology', qualification: 'MD Pediatrics, Fellowship', experience: 10, consultationFee: 150, bio: 'Focused on childhood allergies and immune disorders.' },
      { id: 'doc-5', userId: 'usr-doc-5', email: 'dr.wilson@hospital.com', firstName: 'James', lastName: 'Wilson', deptId: 'dept-genmed', specialization: 'Internal Medicine', qualification: 'MD Internal Medicine', experience: 20, consultationFee: 120, bio: 'Comprehensive primary care with a focus on preventive medicine.' },
    ];

    for (const doc of doctorSeeds) {
      await db.collection(COLLECTIONS.USERS).doc(doc.userId).set({
        id: doc.userId,
        email: doc.email,
        password: doctorPasswordHash,
        role: 'doctor',
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: '555-020' + doc.id.slice(-1),
        createdAt: new Date().toISOString(),
      });

      await db.collection(COLLECTIONS.DOCTORS).doc(doc.id).set({
        id: doc.id,
        userId: doc.userId,
        departmentId: doc.deptId,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        createdAt: new Date().toISOString(),
      });
    }
    console.log('✅ Doctor users and profiles seeded in Firestore.');

    // 4. Patients & Users
    const patientSeeds = [
      { id: 'pat-1', userId: 'usr-pat-1', email: 'john.doe@hospital.com', firstName: 'John', lastName: 'Doe', dateOfBirth: '1985-03-15', gender: 'male', bloodGroup: 'A+', address: '123 Oak Street, Anytown', emergencyContact: 'Jane Doe', emergencyPhone: '555-1002', allergies: 'Penicillin', insuranceProvider: 'Blue Cross', insuranceNumber: 'BC-12345' },
      { id: 'pat-2', userId: 'usr-pat-2', email: 'jane.doe@hospital.com', firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1990-07-22', gender: 'female', bloodGroup: 'B+', address: '456 Elm Avenue, Anytown', emergencyContact: 'John Doe', emergencyPhone: '555-1001', allergies: 'None', insuranceProvider: 'Aetna', insuranceNumber: 'AE-67890' },
      { id: 'pat-3', userId: 'usr-pat-3', email: 'mike.brown@hospital.com', firstName: 'Michael', lastName: 'Brown', dateOfBirth: '1978-11-08', gender: 'male', bloodGroup: 'O+', address: '789 Pine Road, Anytown', emergencyContact: 'Lisa Brown', emergencyPhone: '555-2003', allergies: 'Sulfa drugs', insuranceProvider: 'United Health', insuranceNumber: 'UH-11111' },
      { id: 'pat-4', userId: 'usr-pat-4', email: 'emily.davis@hospital.com', firstName: 'Emily', lastName: 'Davis', dateOfBirth: '1995-01-30', gender: 'female', bloodGroup: 'AB-', address: '321 Maple Lane, Anytown', emergencyContact: 'Tom Davis', emergencyPhone: '555-2004', allergies: 'Latex', insuranceProvider: 'Cigna', insuranceNumber: 'CG-22222' },
    ];

    for (const pat of patientSeeds) {
      await db.collection(COLLECTIONS.USERS).doc(pat.userId).set({
        id: pat.userId,
        email: pat.email,
        password: patientPasswordHash,
        role: 'patient',
        firstName: pat.firstName,
        lastName: pat.lastName,
        phone: '555-100' + pat.id.slice(-1),
        createdAt: new Date().toISOString(),
      });

      await db.collection(COLLECTIONS.PATIENTS).doc(pat.id).set({
        id: pat.id,
        userId: pat.userId,
        dateOfBirth: pat.dateOfBirth,
        gender: pat.gender,
        bloodGroup: pat.bloodGroup,
        address: pat.address,
        emergencyContact: pat.emergencyContact,
        emergencyPhone: pat.emergencyPhone,
        allergies: pat.allergies,
        insuranceProvider: pat.insuranceProvider,
        insuranceNumber: pat.insuranceNumber,
        createdAt: new Date().toISOString(),
      });
    }
    console.log('✅ Patient users and profiles seeded in Firestore.');

    // 5. Appointments
    const sampleAppointments = [
      { id: 'appt-101', patientId: 'pat-1', doctorId: 'doc-1', appointmentDate: '2026-07-25', appointmentTime: '10:00:00', duration: 30, status: 'confirmed', type: 'consultation', reason: 'Routine Heart Checkup' },
      { id: 'appt-102', patientId: 'pat-2', doctorId: 'doc-2', appointmentDate: '2026-07-26', appointmentTime: '11:30:00', duration: 30, status: 'scheduled', type: 'follow-up', reason: 'Migraine Follow-up' },
      { id: 'appt-103', patientId: 'pat-3', doctorId: 'doc-3', appointmentDate: '2026-07-20', appointmentTime: '14:00:00', duration: 45, status: 'completed', type: 'consultation', reason: 'Knee Pain Consultation' },
    ];

    for (const appt of sampleAppointments) {
      await db.collection(COLLECTIONS.APPOINTMENTS).doc(appt.id).set({
        ...appt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Appointments seeded in Firestore.');

    // 6. Bills & Payments
    const sampleBill = {
      id: 'bill-501',
      patientId: 'pat-3',
      appointmentId: 'appt-103',
      invoiceNumber: 'INV-FST-001',
      items: [
        { name: 'Consultation Fee', rate: 180, quantity: 1, amount: 180 },
        { name: 'X-Ray Knee', rate: 120, quantity: 1, amount: 120 },
      ],
      subtotal: 300,
      tax: 15,
      discount: 0,
      totalAmount: 315,
      status: 'paid',
      dueDate: '2026-08-20',
      createdAt: new Date().toISOString(),
    };
    await db.collection(COLLECTIONS.BILLS).doc(sampleBill.id).set(sampleBill);

    const samplePayment = {
      id: 'pay-701',
      billId: 'bill-501',
      amount: 315,
      method: 'card',
      transactionId: 'TXN-FST-8899',
      paidAt: new Date().toISOString(),
    };
    await db.collection(COLLECTIONS.PAYMENTS).doc(samplePayment.id).set(samplePayment);
    console.log('✅ Bills & Payments seeded in Firestore.');

    console.log('\n🎉 Firestore Seeding Complete!');
    console.log('📋 Test Credentials:');
    console.log('   Admin:        admin@hospital.com / admin123');
    console.log('   Receptionist: reception@hospital.com / reception123');
    console.log('   Doctor:       dr.smith@hospital.com / doctor123');
    console.log('   Patient:      john.doe@hospital.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore seeding error:', error);
    process.exit(1);
  }
};

seedFirestore();
