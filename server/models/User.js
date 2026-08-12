const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'doctor', 'receptionist', 'patient'),
      allowNull: false,
      defaultValue: 'patient',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    avatar: {
      type: DataTypes.STRING(500),
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
    },
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
    ],
  });

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
