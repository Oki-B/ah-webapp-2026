"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AuditLog.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  AuditLog.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notNull: { msg: "Action is required." } },
      },
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILED"),
        allowNull: false,
        validate: { notNull: { msg: "Status is required." } },
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notNull: { msg: "IP Address is required." } },
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AuditLog",
      tableName: "audit_logs",
      underscored: true,
      timestamps: true,
      updatedAt: false, // Disable updatedAt since we only care about createdAt for logs
    },
  );
  return AuditLog;
};
