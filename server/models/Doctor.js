const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
    },
    specialization: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING(300),
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    availability: {
      type: DataTypes.JSON,
      defaultValue: {
        monday: { start: '09:00', end: '17:00', slots: 16 },
        tuesday: { start: '09:00', end: '17:00', slots: 16 },
        wednesday: { start: '09:00', end: '17:00', slots: 16 },
        thursday: { start: '09:00', end: '17:00', slots: 16 },
        friday: { start: '09:00', end: '17:00', slots: 16 },
      },
    },
    bio: {
      type: DataTypes.TEXT,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    indexes: [
      { fields: ['specialization'] },
    ],
  });

  return Doctor;
};
