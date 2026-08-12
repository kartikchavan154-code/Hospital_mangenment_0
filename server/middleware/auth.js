const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    const dbType = process.env.DB_TYPE || 'firestore';
    let safeUser = null;

    if (dbType === 'firestore') {
      const { findById, COLLECTIONS } = require('../db/firestoreAdapter');
      const user = await findById(COLLECTIONS.USERS, decoded.id);
      if (!user || user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
      safeUser = { ...user };
      delete safeUser.password;
    } else {
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
      safeUser = user.toSafeJSON();
    }

    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { authenticate };
