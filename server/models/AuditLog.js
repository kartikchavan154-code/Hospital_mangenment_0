const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
    },
    previousData: {
      type: DataTypes.JSON,
    },
    newData: {
      type: DataTypes.JSON,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
    },
  }, {
    updatedAt: false,
    indexes: [
      { fields: ['entity', 'entityId'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] },
    ],
  });

  return AuditLog;
};
