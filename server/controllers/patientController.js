const { Op } = require('sequelize');
const { Patient, User, MedicalRecord, Appointment, Bill } = require('../models');
const { formatPaginationResponse } = require('../utils/helpers');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, deleteDoc, findWhere } = require('../db/firestoreAdapter');
const bcrypt = require('bcryptjs');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { search, bloodGroup, gender } = req.query;
      let patients = await listAll(COLLECTIONS.PATIENTS);
      const users = await listAll(COLLECTIONS.USERS);

      if (bloodGroup) patients = patients.filter(p => p.bloodGroup === bloodGroup);
      if (gender) patients = patients.filter(p => p.gender === gender);

      const result = patients.map(pat => {
        const user = users.find(u => u.id === pat.userId) || {};
        const safeUser = { ...user };
        delete safeUser.password;

        if (search) {
          const q = search.toLowerCase();
          if (!`${safeUser.firstName} ${safeUser.lastName} ${safeUser.email}`.toLowerCase().includes(q)) return null;
        }
        return { ...pat, user: safeUser };
      }).filter(Boolean);

      return res.json({ success: true, data: result, pagination: { total: result.length } });
    }

    const { page = 1, limit = 10, search, bloodGroup, gender } = req.query;
    const where = {};
    const userWhere = {};

    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (gender) where.gender = gender;
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: { exclude: ['password'] },
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
      }],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...formatPaginationResponse(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const pat = await findById(COLLECTIONS.PATIENTS, req.params.id);
      if (!pat) return res.status(404).json({ success: false, message: 'Patient not found.' });
      const user = await findById(COLLECTIONS.USERS, pat.userId);
      const safeUser = { ...(user || {}) };
      delete safeUser.password;
      const medicalRecords = await findWhere(COLLECTIONS.MEDICAL_RECORDS, [{ field: 'patientId', op: '==', value: req.params.id }]);
      const appointments = await findWhere(COLLECTIONS.APPOINTMENTS, [{ field: 'patientId', op: '==', value: req.params.id }]);
      const bills = await findWhere(COLLECTIONS.BILLS, [{ field: 'patientId', op: '==', value: req.params.id }]);
      return res.json({ success: true, data: { ...pat, user: safeUser, medicalRecords, appointments, bills } });
    }

    const patient = await Patient.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: MedicalRecord, as: 'medicalRecords', limit: 10, order: [['createdAt', 'DESC']] },
        { model: Appointment, as: 'appointments', limit: 10, order: [['appointmentDate', 'DESC']] },
        { model: Bill, as: 'bills', limit: 10, order: [['createdAt', 'DESC']] },
      ],
    });

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { email, password, firstName, lastName, phone, ...patientData } = req.body;
      const existing = await findWhere(COLLECTIONS.USERS, [{ field: 'email', op: '==', value: email }]);
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already exists.' });

      const hashedPassword = await bcrypt.hash(password || 'patient123', 10);
      const newUser = await addDoc(COLLECTIONS.USERS, { email, password: hashedPassword, firstName, lastName, phone, role: 'patient', isActive: true });
      const newPatient = await addDoc(COLLECTIONS.PATIENTS, { userId: newUser.id, ...patientData });

      const safeUser = { ...newUser };
      delete safeUser.password;
      return res.status(201).json({ success: true, message: 'Patient created.', data: { ...newPatient, user: safeUser } });
    }

    const { email, password, firstName, lastName, phone, ...patientData } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const user = await User.create({ email, password: password || 'patient123', firstName, lastName, phone, role: 'patient' });
    const patient = await Patient.create({ userId: user.id, ...patientData });
    const result = await Patient.findByPk(patient.id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });

    res.status(201).json({ success: true, message: 'Patient created.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const pat = await findById(COLLECTIONS.PATIENTS, req.params.id);
      if (!pat) return res.status(404).json({ success: false, message: 'Patient not found.' });
      const { firstName, lastName, phone, email, ...patientData } = req.body;
      if (firstName || lastName || phone || email) {
        await updateDoc(COLLECTIONS.USERS, pat.userId, { firstName, lastName, phone, email });
      }
      const updated = await updateDoc(COLLECTIONS.PATIENTS, req.params.id, patientData);
      return res.json({ success: true, message: 'Patient updated.', data: updated });
    }

    const patient = await Patient.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    req._previousData = patient.toJSON();
    const { firstName, lastName, phone, email, ...patientData } = req.body;
    if (firstName || lastName || phone || email) await patient.user.update({ firstName, lastName, phone, email });
    await patient.update(patientData);
    const result = await Patient.findByPk(patient.id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });
    res.json({ success: true, message: 'Patient updated.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const pat = await findById(COLLECTIONS.PATIENTS, req.params.id);
      if (!pat) return res.status(404).json({ success: false, message: 'Patient not found.' });
      await deleteDoc(COLLECTIONS.PATIENTS, req.params.id);
      await deleteDoc(COLLECTIONS.USERS, pat.userId);
      return res.json({ success: true, message: 'Patient deleted.' });
    }

    const patient = await Patient.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    await patient.user.destroy();
    res.json({ success: true, message: 'Patient deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getMedicalHistory = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const records = await findWhere(COLLECTIONS.MEDICAL_RECORDS, [{ field: 'patientId', op: '==', value: req.params.id }]);
      return res.json({ success: true, data: records });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId: req.params.id },
      include: [
        {
          model: require('../models').Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
        },
        { model: require('../models').Prescription, as: 'prescriptions' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};
