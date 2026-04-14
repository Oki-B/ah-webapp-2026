"use strict";
require("dotenv").config(); // Load .env dulu
const { User } = require("../models");
const { ROLES } = require("../config/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Seed roles from config/constants.js
    await queryInterface.bulkInsert(
      "Roles",
      Object.values(ROLES).map((role) => ({
        ...role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      {},
    );

    // Seed superadmin user generate from .env
    await User.create({
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
      roleId: ROLES.SUPERADMIN.id,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("Roles", null, {});
  },
};
