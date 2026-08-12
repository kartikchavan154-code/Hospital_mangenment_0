const { Op } = require('sequelize');
const { Appointment, Patient, Doctor, User } = require('../models');
const { formatPaginationResponse } = require('../utils/helpers');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../services/emailService');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { status, doctorId, patientId, date } = req.query;
      let appointments = await listAll(COLLECTIONS.APPOINTMENTS);

      // Role-based filtering
      if (req.user.role === 'patient') {
        const pats = await findWhere(COLLECTIONS.PATIENTS, [{ field: 'userId', op: '==', value: req.user.id }]);
        if (pats.length > 0) appointments = appointments.filter(a => a.patientId === pats[0].id);
      }
      if (req.user.role === 'doctor') {
        const docs = await findWhere(COLLECTIONS.DOCTORS, [{ field: 'userId', op: '==', value: req.user.id }]);
        if (docs.length > 0) appointments = appointments.filter(a => a.doctorId === docs[0].id);
      }

      if (status) appointments = appointments.filter(a => a.status === status);
      if (doctorId) appointments = appointments.filter(a => a.doctorId === doctorId);
      if (patientId) appointments = appointments.filter(a => a.patientId === patientId);
      if (date) appointments = appointments.filter(a => a.appointmentDate === date);

      appointments.sort((a, b) => (b.appointmentDate > a.appointmentDate ? 1 : -1));

      return res.json({ success: true, data: appointments, pagination: { total: appointments.length } });
    }

    const { page = 1, limit = 10, status, doctorId, patientId, date, dateFrom, dateTo } = req.query;
    const where = {};

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (date) where.appointmentDate = date;
    if (dateFrom && dateTo) where.appointmentDate = { [Op.between]: [dateFrom, dateTo] };

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (patient) where.patientId = patient.id;
    }
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (doctor) where.doctorId = doctor.id;
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }],
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
            { model: require('../models').Department, as: 'department', attributes: ['name'] },
          ],
        },
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'ASC']],
    });

    res.json({ success: true, ...formatPaginationResponse(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const appt = await findById(COLLECTIONS.APPOINTMENTS, req.params.id);
      if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      return res.json({ success: true, data: appt });
    }

    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }, { model: require('../models').Department, as: 'department' }] },
      ],
    });

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { patientId, doctorId, appointmentDate, appointmentTime, duration = 30, type, reason } = req.body;
      const existing = await findWhere(COLLECTIONS.APPOINTMENTS, [{ field: 'doctorId', op: '==', value: doctorId }]);
      const conflict = existing.find(a => a.appointmentDate === appointmentDate && a.appointmentTime === appointmentTime && !['cancelled', 'no-show'].includes(a.status));
      if (conflict) return res.status(409).json({ success: false, message: 'Time slot already booked.' });

      const appt = await addDoc(COLLECTIONS.APPOINTMENTS, { patientId, doctorId, appointmentDate, appointmentTime, duration, type, reason, status: 'scheduled' });
      return res.status(201).json({ success: true, message: 'Appointment booked.', data: appt });
    }

    const { patientId, doctorId, appointmentDate, appointmentTime, duration = 30, type, reason } = req.body;
    const conflict = await Appointment.findOne({
      where: { doctorId, appointmentDate, appointmentTime, status: { [Op.notIn]: ['cancelled', 'no-show'] } },
    });
    if (conflict) return res.status(409).json({ success: false, message: 'Time slot already booked.' });

    const appointment = await Appointment.create({ patientId, doctorId, appointmentDate, appointmentTime, duration, type, reason });
    const result = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
      ],
    });

    try {
      await sendAppointmentConfirmation(result, result.patient.user, result.doctor.user);
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    res.status(201).json({ success: true, message: 'Appointment booked.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const appt = await findById(COLLECTIONS.APPOINTMENTS, req.params.id);
      if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      const updated = await updateDoc(COLLECTIONS.APPOINTMENTS, req.params.id, req.body);
      return res.json({ success: true, message: 'Appointment updated.', data: updated });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    if (req.body.appointmentDate || req.body.appointmentTime) {
      const newDate = req.body.appointmentDate || appointment.appointmentDate;
      const newTime = req.body.appointmentTime || appointment.appointmentTime;
      const newDoctorId = req.body.doctorId || appointment.doctorId;
      const conflict = await Appointment.findOne({
        where: { id: { [Op.ne]: appointment.id }, doctorId: newDoctorId, appointmentDate: newDate, appointmentTime: newTime, status: { [Op.notIn]: ['cancelled', 'no-show'] } },
      });
      if (conflict) return res.status(409).json({ success: false, message: 'Time slot already booked.' });
    }

    req._previousData = appointment.toJSON();
    await appointment.update(req.body);
    res.json({ success: true, message: 'Appointment updated.', data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const appt = await findById(COLLECTIONS.APPOINTMENTS, req.params.id);
      if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      if (appt.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled.' });
      const updated = await updateDoc(COLLECTIONS.APPOINTMENTS, req.params.id, { status: 'cancelled', notes: req.body.reason || appt.notes });
      return res.json({ success: true, message: 'Appointment cancelled.', data: updated });
    }

    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
      ],
    });

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    if (appointment.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled.' });

    await appointment.update({ status: 'cancelled', notes: req.body.reason || appointment.notes });

    try {
      await sendAppointmentCancellation(appointment, appointment.patient.user, appointment.doctor.user);
    } catch (emailErr) {
      console.error('Cancellation email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Appointment cancelled.', data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date are required.' });

    if (dbType() === 'firestore') {
      const appointments = await findWhere(COLLECTIONS.APPOINTMENTS, [{ field: 'doctorId', op: '==', value: doctorId }]);
      const bookedTimes = appointments.filter(a => a.appointmentDate === date && !['cancelled', 'no-show'].includes(a.status)).map(a => a.appointmentTime);
      const allSlots = [];
      for (let h = 9; h < 17; h++) {
        allSlots.push(`${String(h).padStart(2, '0')}:00:00`);
        allSlots.push(`${String(h).padStart(2, '0')}:30:00`);
      }
      const availableSlots = allSlots.filter(s => !bookedTimes.includes(s));
      return res.json({ success: true, data: { date, doctorId, availableSlots, bookedSlots: bookedTimes } });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const bookedSlots = await Appointment.findAll({
      where: { doctorId, appointmentDate: date, status: { [Op.notIn]: ['cancelled', 'no-show'] } },
      attributes: ['appointmentTime', 'duration'],
    });
    const bookedTimes = bookedSlots.map(a => a.appointmentTime);
    const allSlots = [];
    for (let h = 9; h < 17; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00:00`);
      allSlots.push(`${String(h).padStart(2, '0')}:30:00`);
    }
    const availableSlots = allSlots.filter(s => !bookedTimes.includes(s));
    res.json({ success: true, data: { date, doctorId, availableSlots, bookedSlots: bookedTimes } });
  } catch (error) {
    next(error);
  }
};
