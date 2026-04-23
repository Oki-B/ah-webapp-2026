"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_sessions", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ua: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      device_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_activity_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("user_sessions", ["user_id"]);
    await queryInterface.addIndex("user_sessions", ["refresh_token"], {
      unique: true,
      where: {
        revoked_at: null,
      },
      name: "idx_user_sessions_refresh_token_active",
    });
    await queryInterface.addIndex("user_sessions", ["expires_at"]);

    //composite index
    await queryInterface.addIndex("user_sessions", ["user_id", "revoked_at"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_sessions");
  },
};
