const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prescription = sequelize.define('Prescription', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    medicalRecordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medication: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(100),
    },
    instructions: {
      type: DataTypes.TEXT,
    },
  });

  return Prescription;
};
