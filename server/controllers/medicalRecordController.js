const { MedicalRecord, Patient, Doctor, Prescription, Appointment, User } = require('../models');
const { formatPaginationResponse } = require('../utils/helpers');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, deleteDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      let records = await listAll(COLLECTIONS.MEDICAL_RECORDS);
      const { patientId, doctorId } = req.query;

      if (req.user.role === 'patient') {
        const pats = await findWhere(COLLECTIONS.PATIENTS, [{ field: 'userId', op: '==', value: req.user.id }]);
        if (pats.length > 0) records = records.filter(r => r.patientId === pats[0].id);
      }
      if (req.user.role === 'doctor') {
        const docs = await findWhere(COLLECTIONS.DOCTORS, [{ field: 'userId', op: '==', value: req.user.id }]);
        if (docs.length > 0) records = records.filter(r => r.doctorId === docs[0].id);
      }

      if (patientId) records = records.filter(r => r.patientId === patientId);
      if (doctorId) records = records.filter(r => r.doctorId === doctorId);

      records.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return res.json({ success: true, data: records, pagination: { total: records.length } });
    }

    const { page = 1, limit = 10, patientId, doctorId } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (patient) where.patientId = patient.id;
    }
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (doctor) where.doctorId = doctor.id;
    }

    const { count, rows } = await MedicalRecord.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }] },
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }] },
        { model: Prescription, as: 'prescriptions' },
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
      const record = await findById(COLLECTIONS.MEDICAL_RECORDS, req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
      const prescriptions = await findWhere(COLLECTIONS.PRESCRIPTIONS, [{ field: 'medicalRecordId', op: '==', value: req.params.id }]);
      return res.json({ success: true, data: { ...record, prescriptions } });
    }

    const record = await MedicalRecord.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Prescription, as: 'prescriptions' },
        { model: Appointment, as: 'appointment' },
      ],
    });

    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { prescriptions: rxList, ...recordData } = req.body;
      const record = await addDoc(COLLECTIONS.MEDICAL_RECORDS, recordData);

      if (rxList?.length) {
        await Promise.all(rxList.map(p => addDoc(COLLECTIONS.PRESCRIPTIONS, { ...p, medicalRecordId: record.id })));
      }

      const prescriptions = await findWhere(COLLECTIONS.PRESCRIPTIONS, [{ field: 'medicalRecordId', op: '==', value: record.id }]);
      return res.status(201).json({ success: true, message: 'Medical record created.', data: { ...record, prescriptions } });
    }

    const record = await MedicalRecord.create(req.body);
    if (req.body.prescriptions?.length) {
      await Promise.all(req.body.prescriptions.map(p => Prescription.create({ ...p, medicalRecordId: record.id })));
    }
    const result = await MedicalRecord.findByPk(record.id, {
      include: [{ model: Prescription, as: 'prescriptions' }],
    });
    res.status(201).json({ success: true, message: 'Medical record created.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const record = await findById(COLLECTIONS.MEDICAL_RECORDS, req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
      const updated = await updateDoc(COLLECTIONS.MEDICAL_RECORDS, req.params.id, req.body);
      return res.json({ success: true, message: 'Record updated.', data: updated });
    }

    const record = await MedicalRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    await record.update(req.body);
    res.json({ success: true, message: 'Record updated.', data: record });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const record = await findById(COLLECTIONS.MEDICAL_RECORDS, req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
      await deleteDoc(COLLECTIONS.MEDICAL_RECORDS, req.params.id);
      return res.json({ success: true, message: 'Record deleted.' });
    }

    const record = await MedicalRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    await record.destroy();
    res.json({ success: true, message: 'Record deleted.' });
  } catch (error) {
    next(error);
  }
};
