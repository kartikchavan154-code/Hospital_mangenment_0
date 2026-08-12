const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicalRecordId: {
      type: DataTypes.INTEGER,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('lab-report', 'radiology', 'pathology', 'prescription', 'discharge-summary'),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(500),
    },
    notes: {
      type: DataTypes.TEXT,
    },
    generatedBy: {
      type: DataTypes.INTEGER,
    },
  });

  return Report;
};
