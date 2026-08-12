const { AuditLog } = require('../models');

const createAuditLog = async (userId, action, entity, entityId, previousData, newData, ipAddress) => {
  try {
    const dbType = process.env.DB_TYPE || 'firestore';
    if (dbType === 'firestore') {
      const { addDoc, COLLECTIONS } = require('../db/firestoreAdapter');
      await addDoc(COLLECTIONS.AUDIT_LOGS, {
        userId,
        action,
        entity,
        entityId: String(entityId || ''),
        previousData,
        newData,
        ipAddress,
        createdAt: new Date().toISOString(),
      });
    } else {
      await AuditLog.create({ userId, action, entity, entityId, previousData, newData, ipAddress });
    }
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

const auditMiddleware = (entity, action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data?.success !== false) {
        const userId = req.user?.id;
        const entityId = req.params.id || data?.data?.id;
        const ip = req.ip || req.connection?.remoteAddress;
        createAuditLog(userId, action, entity, entityId, req._previousData || null, req.body || null, ip);
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { auditMiddleware, createAuditLog };
