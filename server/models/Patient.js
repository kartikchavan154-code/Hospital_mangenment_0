const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
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
    dateOfBirth: {
      type: DataTypes.DATEONLY,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
    },
    bloodGroup: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    },
    address: {
      type: DataTypes.TEXT,
    },
    emergencyContact: {
      type: DataTypes.STRING(100),
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
    },
    allergies: {
      type: DataTypes.TEXT,
    },
    insuranceProvider: {
      type: DataTypes.STRING(200),
    },
    insuranceNumber: {
      type: DataTypes.STRING(100),
    },
  });

  return Patient;
};
