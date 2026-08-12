const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MedicalRecord = sequelize.define('MedicalRecord', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    symptoms: {
      type: DataTypes.TEXT,
    },
    vitals: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    notes: {
      type: DataTypes.TEXT,
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
    },
  }, {
    indexes: [
      { fields: ['patientId'] },
    ],
  });

  return MedicalRecord;
};
