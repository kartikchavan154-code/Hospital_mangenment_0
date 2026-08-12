const jwt = require('jsonwebtoken');
const { User, Doctor, Patient } = require('../models');
const { createAuditLog } = require('../middleware/auditLog');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const dbType = process.env.DB_TYPE || 'firestore';
    let userObj = null;
    let safeUser = null;
    let profile = null;

    if (dbType === 'firestore') {
      const { findWhere, COLLECTIONS } = require('../db/firestoreAdapter');
      const bcrypt = require('bcryptjs');
      const users = await findWhere(COLLECTIONS.USERS, [{ field: 'email', op: '==', value: email }]);
      
      if (!users || users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const rawUser = users[0];
      if (rawUser.isActive === false) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
      }

      const isMatch = await bcrypt.compare(password, rawUser.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      safeUser = { ...rawUser };
      delete safeUser.password;
      userObj = rawUser;

      if (rawUser.role === 'doctor') {
        const docs = await findWhere(COLLECTIONS.DOCTORS, [{ field: 'userId', op: '==', value: rawUser.id }]);
        profile = docs.length > 0 ? docs[0] : null;
      } else if (rawUser.role === 'patient') {
        const pats = await findWhere(COLLECTIONS.PATIENTS, [{ field: 'userId', op: '==', value: rawUser.id }]);
        profile = pats.length > 0 ? pats[0] : null;
      }
    } else {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
      }

      const isMatch = await user.validatePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      await user.update({ lastLogin: new Date() });
      userObj = user;
      safeUser = user.toSafeJSON();

      if (user.role === 'doctor') {
        profile = await Doctor.findOne({ where: { userId: user.id } });
      } else if (user.role === 'patient') {
        profile = await Patient.findOne({ where: { userId: user.id } });
      }
    }

    const token = generateToken(userObj);

    try {
      await createAuditLog(userObj.id, 'LOGIN', 'User', userObj.id, null, null, req.ip);
    } catch (_) {}

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: safeUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const dbType = process.env.DB_TYPE || 'firestore';

    if (dbType === 'firestore') {
      const { findWhere, addDoc, COLLECTIONS } = require('../db/firestoreAdapter');
      const bcrypt = require('bcryptjs');
      const existing = await findWhere(COLLECTIONS.USERS, [{ field: 'email', op: '==', value: email }]);
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already registered.' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await addDoc(COLLECTIONS.USERS, {
        email, password: hashedPassword, firstName, lastName, phone,
        role: role || 'patient', isActive: true,
      });

      if ((role || 'patient') === 'patient') {
        await addDoc(COLLECTIONS.PATIENTS, { userId: newUser.id, ...(req.body.patientData || {}) });
      }

      const safeUser = { ...newUser };
      delete safeUser.password;
      const token = generateToken(newUser);

      return res.status(201).json({ success: true, message: 'Registration successful.', data: { token, user: safeUser } });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ email, password, firstName, lastName, phone, role: role || 'patient' });

    if (user.role === 'patient') {
      await Patient.create({ userId: user.id, ...req.body.patientData });
    }

    const token = generateToken(user);
    await createAuditLog(null, 'REGISTER', 'User', user.id, null, { email, role: user.role }, req.ip);

    res.status(201).json({ success: true, message: 'Registration successful.', data: { token, user: user.toSafeJSON() } });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const dbType = process.env.DB_TYPE || 'firestore';
    let safeUser = null;
    let profile = null;

    if (dbType === 'firestore') {
      const { findById, findWhere, COLLECTIONS } = require('../db/firestoreAdapter');
      const user = await findById(COLLECTIONS.USERS, req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      safeUser = { ...user };
      delete safeUser.password;

      if (user.role === 'doctor') {
        const docs = await findWhere(COLLECTIONS.DOCTORS, [{ field: 'userId', op: '==', value: user.id }]);
        profile = docs.length > 0 ? docs[0] : null;
      } else if (user.role === 'patient') {
        const pats = await findWhere(COLLECTIONS.PATIENTS, [{ field: 'userId', op: '==', value: user.id }]);
        profile = pats.length > 0 ? pats[0] : null;
      }
    } else {
      const user = await User.findByPk(req.user.id, {
        include: [
          { model: Doctor, as: 'doctorProfile' },
          { model: Patient, as: 'patientProfile' },
        ],
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      safeUser = user.toSafeJSON();
      profile = user.doctorProfile || user.patientProfile;
    }

    res.json({ success: true, data: { user: safeUser, profile } });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const dbType = process.env.DB_TYPE || 'firestore';

    if (dbType === 'firestore') {
      const { findById, updateDoc, COLLECTIONS } = require('../db/firestoreAdapter');
      const bcrypt = require('bcryptjs');
      const user = await findById(COLLECTIONS.USERS, req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updateDoc(COLLECTIONS.USERS, req.user.id, { password: hashedPassword });
      return res.json({ success: true, message: 'Password changed successfully.' });
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await user.validatePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    await user.update({ password: newPassword });
    await createAuditLog(user.id, 'CHANGE_PASSWORD', 'User', user.id, null, null, req.ip);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const dbType = process.env.DB_TYPE || 'firestore';

    if (dbType === 'firestore') {
      const { listAll, COLLECTIONS } = require('../db/firestoreAdapter');
      let users = await listAll(COLLECTIONS.USERS);
      if (role) users = users.filter(u => u.role === role);
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
      }
      const safeUsers = users.map(u => { const s = { ...u }; delete s.password; return s; });
      return res.json({ success: true, data: safeUsers, pagination: { total: safeUsers.length } });
    }

    const { page = 1, limit = 10 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), totalPages: Math.ceil(count / parseInt(limit, 10)) },
    });
  } catch (error) {
    next(error);
  }
};
