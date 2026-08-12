const { Op } = require('sequelize');
const { Doctor, User, Department, Appointment } = require('../models');
const { formatPaginationResponse } = require('../utils/helpers');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, deleteDoc, findWhere } = require('../db/firestoreAdapter');
const bcrypt = require('bcryptjs');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { search, departmentId } = req.query;
      let doctors = await listAll(COLLECTIONS.DOCTORS);
      const users = await listAll(COLLECTIONS.USERS);
      const departments = await listAll(COLLECTIONS.DEPARTMENTS);

      if (departmentId) doctors = doctors.filter(d => d.departmentId === departmentId);

      const result = doctors.map(doc => {
        const user = users.find(u => u.id === doc.userId) || {};
        const dept = departments.find(d => d.id === doc.departmentId) || {};
        const safeUser = { ...user };
        delete safeUser.password;

        if (search) {
          const q = search.toLowerCase();
          if (!`${safeUser.firstName} ${safeUser.lastName}`.toLowerCase().includes(q)) return null;
        }
        return { ...doc, user: safeUser, department: dept };
      }).filter(Boolean);

      return res.json({ success: true, data: result, pagination: { total: result.length } });
    }

    const { page = 1, limit = 10, search, departmentId, specialization } = req.query;
    const where = {};
    const userWhere = {};

    if (departmentId) where.departmentId = departmentId;
    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Doctor.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] },
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        },
        { model: Department, as: 'department' },
      ],
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
      const doc = await findById(COLLECTIONS.DOCTORS, req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      const user = await findById(COLLECTIONS.USERS, doc.userId);
      const dept = await findById(COLLECTIONS.DEPARTMENTS, doc.departmentId);
      const safeUser = { ...(user || {}) };
      delete safeUser.password;
      return res.json({ success: true, data: { ...doc, user: safeUser, department: dept } });
    }

    const doctor = await Doctor.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Department, as: 'department' },
      ],
    });

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { email, password, firstName, lastName, phone, ...doctorData } = req.body;
      const existing = await findWhere(COLLECTIONS.USERS, [{ field: 'email', op: '==', value: email }]);
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already exists.' });

      const hashedPassword = await bcrypt.hash(password || 'doctor123', 10);
      const newUser = await addDoc(COLLECTIONS.USERS, { email, password: hashedPassword, firstName, lastName, phone, role: 'doctor', isActive: true });
      const newDoctor = await addDoc(COLLECTIONS.DOCTORS, { userId: newUser.id, ...doctorData });

      const safeUser = { ...newUser };
      delete safeUser.password;
      return res.status(201).json({ success: true, message: 'Doctor created.', data: { ...newDoctor, user: safeUser } });
    }

    const { email, password, firstName, lastName, phone, ...doctorData } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const user = await User.create({ email, password: password || 'doctor123', firstName, lastName, phone, role: 'doctor' });
    const doctor = await Doctor.create({ userId: user.id, ...doctorData });
    const result = await Doctor.findByPk(doctor.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Department, as: 'department' },
      ],
    });

    res.status(201).json({ success: true, message: 'Doctor created.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const doc = await findById(COLLECTIONS.DOCTORS, req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      const { firstName, lastName, phone, email, ...doctorData } = req.body;
      if (firstName || lastName || phone || email) {
        await updateDoc(COLLECTIONS.USERS, doc.userId, { firstName, lastName, phone, email });
      }
      const updated = await updateDoc(COLLECTIONS.DOCTORS, req.params.id, doctorData);
      return res.json({ success: true, message: 'Doctor updated.', data: updated });
    }

    const doctor = await Doctor.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    const { firstName, lastName, phone, email, ...doctorData } = req.body;
    if (firstName || lastName || phone || email) await doctor.user.update({ firstName, lastName, phone, email });
    await doctor.update(doctorData);
    const result = await Doctor.findByPk(doctor.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Department, as: 'department' },
      ],
    });
    res.json({ success: true, message: 'Doctor updated.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const doc = await findById(COLLECTIONS.DOCTORS, req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      await deleteDoc(COLLECTIONS.DOCTORS, req.params.id);
      await deleteDoc(COLLECTIONS.USERS, doc.userId);
      return res.json({ success: true, message: 'Doctor deleted.' });
    }

    const doctor = await Doctor.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    await doctor.user.destroy();
    res.json({ success: true, message: 'Doctor deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getSchedule = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { date } = req.query;
      const doctorId = req.params.id;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const appointments = await findWhere(COLLECTIONS.APPOINTMENTS, [{ field: 'doctorId', op: '==', value: doctorId }]);
      const filtered = appointments.filter(a => a.appointmentDate === targetDate && a.status !== 'cancelled');
      return res.json({ success: true, data: { date: targetDate, appointments: filtered } });
    }

    const { date } = req.query;
    const doctorId = req.params.id;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const appointments = await Appointment.findAll({
      where: { doctorId, appointmentDate: targetDate, status: { [Op.notIn]: ['cancelled'] } },
      include: [{ model: require('../models').Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }] }],
      order: [['appointmentTime', 'ASC']],
    });
    const doctor = await Doctor.findByPk(doctorId);
    res.json({ success: true, data: { date: targetDate, appointments, availability: doctor?.availability || {} } });
  } catch (error) {
    next(error);
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const doc = await findById(COLLECTIONS.DOCTORS, req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found.' });
      const updated = await updateDoc(COLLECTIONS.DOCTORS, req.params.id, { availability: req.body.availability });
      return res.json({ success: true, message: 'Availability updated.', data: updated });
    }

    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    await doctor.update({ availability: req.body.availability });
    res.json({ success: true, message: 'Availability updated.', data: doctor });
  } catch (error) {
    next(error);
  }
};
