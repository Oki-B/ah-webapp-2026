"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../utils/");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });
      User.hasMany(models.AuditLog, { foreignKey: "userId", as: "auditLogs" });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Email must be unique.",
        },
        validate: {
          notNull: {
            msg: "Email is required.",
          },
          notEmpty: {
            msg: "Email is required.",
          },
          isEmail: {
            msg: "Email must be a valid email address.",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isStrongPassword(value) {
            if (!value) return; // Skip validation if password is not provided (e.g., for OAuth users)
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;

            if (!regex.test(value)) {
              throw new Error(
                "Password must be at least 12 characters long and include uppercase letters, lowercase letters, and numbers.",
              );
            }
          },
        },
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Role is required.",
          },
          notEmpty: {
            msg: "Role cannot be empty.",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trialUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await hashPassword(user.password);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await hashPassword(user.password);
          }
        },
      },
    },
  );
  return User;
};
