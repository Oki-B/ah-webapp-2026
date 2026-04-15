// const { sequelize } = require("../models");

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
    throw new Error("Sequelize instance not found. Check your models/index.js");
  }
  // Jika belum ada, buat transaksi baru (Managed/Unmanaged hybrid)
  const t = await sequelize.transaction();

  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    // Pastikan rollback hanya dilakukan jika transaksi baru saja dibuat di sini
    if (t) await t.rollback();
    throw error;
  }
};

module.exports = { withTransaction };
