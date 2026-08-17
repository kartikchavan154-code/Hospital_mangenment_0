const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { formatPaginationResponse } = require('../utils/helpers');
const { COLLECTIONS, listAll, findById } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, action, userId, dateFrom, dateTo } = req.query;

    if (dbType() === 'firestore') {
      let logs = await listAll(COLLECTIONS.AUDIT_LOGS);

      if (entity) logs = logs.filter(l => l.entity === entity);
      if (action) logs = logs.filter(l => l.action === action);
      if (userId) logs = logs.filter(l => l.userId === userId);
      if (dateFrom && dateTo) {
        logs = logs.filter(l => l.createdAt >= dateFrom && l.createdAt <= dateTo);
      }

      logs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      const users = await listAll(COLLECTIONS.USERS);
      const enriched = logs.map(log => {
        const userObj = users.find(u => u.id === log.userId);
        let user = null;
        if (userObj) {
          user = {
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            email: userObj.email,
            role: userObj.role,
          };
        }
        return { ...log, user };
      });

      const total = enriched.length;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      });
    }

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (dateFrom && dateTo) {
      where.createdAt = { [Op.between]: [dateFrom, dateTo] };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'role'] }],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...formatPaginationResponse(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

