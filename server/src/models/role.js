"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Role.hasMany(models.User, { foreignKey: "roleId", as: "users" });
    }
  }
  Role.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Role name must be unique.",
        },
        validate: {
          notNull: {
            msg: "Role name is required.",
          },
          notEmpty: {
            msg: "Role name cannot be empty.",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "Roles",
    },
  );
  return Role;
};
