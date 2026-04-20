"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserSession.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  UserSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: { notNull: { msg: "User ID is required." } },
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: "Refresh token is required." },
        },
      },
      ua: DataTypes.STRING,
      deviceName: DataTypes.STRING,
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notNull: { msg: "IP Address is required." } },
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notNull: { msg: "Expiration date is required." } },
      },
      revokedAt: DataTypes.DATE,
      lastActivityAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "UserSession",
      underscored: true,
    },
  );
  return UserSession;
};
