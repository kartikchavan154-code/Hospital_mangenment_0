const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    headDoctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return Department;
};
