const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bill = sequelize.define('Bill', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'partial', 'overdue', 'cancelled'),
      defaultValue: 'pending',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  }, {
    indexes: [
      { fields: ['invoiceNumber'] },
      { fields: ['status'] },
    ],
  });

  return Bill;
};
