// const { sequelize } = require("../models");
const AppError = require("./app-error.helper");

const withTransaction = async (callback, transaction = null) => {
  // Jika sudah ada transaksi dari pemanggil sebelumnya, langsung pakai
  if (transaction) {
    return callback(transaction);
  }

  // 2. Lazy Load Sequelize instance
  // Kita panggil require di sini supaya models sudah selesai loading sepenuhnya
  const db = require("../models");
  const sequelize = db.sequelize;

  if (!sequelize) {
    throw new AppError(
      "Sequelize instance not found. Check your models/index.js",
      500,
    );
  }

  // Jika belum ada, buat transaksi baru (Managed/Unmanaged hybrid)
  const t = await sequelize.transaction();

  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    if (t) await t.rollback();
    // Bungkus error asli atau teruskan message-nya
    throw new AppError(
      error.message || "Transaction failed",
      error.statusCode || 500,
    );
  }
};

module.exports = { withTransaction };
