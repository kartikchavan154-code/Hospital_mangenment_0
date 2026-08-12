const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
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
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    appointmentTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
      defaultValue: 'scheduled',
    },
    type: {
      type: DataTypes.ENUM('consultation', 'follow-up', 'emergency', 'routine-checkup'),
      defaultValue: 'consultation',
    },
    reason: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  }, {
    indexes: [
      { fields: ['appointmentDate'] },
      { fields: ['doctorId', 'appointmentDate'] },
      { fields: ['status'] },
    ],
  });

  return Appointment;
};
