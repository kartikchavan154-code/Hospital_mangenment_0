const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    billId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'insurance', 'bank-transfer'),
      allowNull: false,
    },
    transactionId: {
      type: DataTypes.STRING(100),
    },
    notes: {
      type: DataTypes.TEXT,
    },
    paidAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    indexes: [
      { fields: ['billId'] },
    ],
  });

  return Payment;
};
