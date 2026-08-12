const { Prescription, MedicalRecord } = require('../models');
const { COLLECTIONS, findById, addDoc, updateDoc, deleteDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getByRecord = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const prescriptions = await findWhere(COLLECTIONS.PRESCRIPTIONS, [{ field: 'medicalRecordId', op: '==', value: req.params.recordId }]);
      prescriptions.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return res.json({ success: true, data: prescriptions });
    }

    const prescriptions = await Prescription.findAll({
      where: { medicalRecordId: req.params.recordId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const record = await findById(COLLECTIONS.MEDICAL_RECORDS, req.body.medicalRecordId);
      if (!record) return res.status(404).json({ success: false, message: 'Medical record not found.' });
      const prescription = await addDoc(COLLECTIONS.PRESCRIPTIONS, req.body);
      return res.status(201).json({ success: true, message: 'Prescription added.', data: prescription });
    }

    const record = await MedicalRecord.findByPk(req.body.medicalRecordId);
    if (!record) return res.status(404).json({ success: false, message: 'Medical record not found.' });
    const prescription = await Prescription.create(req.body);
    res.status(201).json({ success: true, message: 'Prescription added.', data: prescription });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const prescription = await findById(COLLECTIONS.PRESCRIPTIONS, req.params.id);
      if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
      const updated = await updateDoc(COLLECTIONS.PRESCRIPTIONS, req.params.id, req.body);
      return res.json({ success: true, message: 'Prescription updated.', data: updated });
    }

    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    await prescription.update(req.body);
    res.json({ success: true, message: 'Prescription updated.', data: prescription });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const prescription = await findById(COLLECTIONS.PRESCRIPTIONS, req.params.id);
      if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
      await deleteDoc(COLLECTIONS.PRESCRIPTIONS, req.params.id);
      return res.json({ success: true, message: 'Prescription deleted.' });
    }

    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    await prescription.destroy();
    res.json({ success: true, message: 'Prescription deleted.' });
  } catch (error) {
    next(error);
  }
};
