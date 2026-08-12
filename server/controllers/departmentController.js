const { Department, Doctor, User } = require('../models');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, deleteDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const departments = await listAll(COLLECTIONS.DEPARTMENTS);
      const doctors = await listAll(COLLECTIONS.DOCTORS);

      const result = departments.map(dept => ({
        ...dept,
        doctors: doctors.filter(d => d.departmentId === dept.id),
      }));

      return res.json({ success: true, data: result });
    }

    const departments = await Department.findAll({
      include: [
        {
          model: Doctor,
          as: 'doctors',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
        },
        {
          model: Doctor,
          as: 'headDoctor',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const dept = await findById(COLLECTIONS.DEPARTMENTS, req.params.id);
      if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
      const doctors = await findWhere(COLLECTIONS.DOCTORS, [{ field: 'departmentId', op: '==', value: req.params.id }]);
      return res.json({ success: true, data: { ...dept, doctors } });
    }

    const dept = await Department.findByPk(req.params.id, {
      include: [
        {
          model: Doctor,
          as: 'doctors',
          include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
        },
      ],
    });

    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const dept = await addDoc(COLLECTIONS.DEPARTMENTS, req.body);
      return res.status(201).json({ success: true, message: 'Department created.', data: dept });
    }

    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, message: 'Department created.', data: dept });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const existing = await findById(COLLECTIONS.DEPARTMENTS, req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Department not found.' });
      const updated = await updateDoc(COLLECTIONS.DEPARTMENTS, req.params.id, req.body);
      return res.json({ success: true, message: 'Department updated.', data: updated });
    }

    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    await dept.update(req.body);
    res.json({ success: true, message: 'Department updated.', data: dept });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const existing = await findById(COLLECTIONS.DEPARTMENTS, req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Department not found.' });
      await deleteDoc(COLLECTIONS.DEPARTMENTS, req.params.id);
      return res.json({ success: true, message: 'Department deleted.' });
    }

    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    await dept.destroy();
    res.json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    next(error);
  }
};
