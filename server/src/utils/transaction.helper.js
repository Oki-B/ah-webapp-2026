const { sequelize } = require("../models");

const withTransaction = async (callback, existingTransaction = null) => {
  // Jika sudah ada transaksi dari pemanggil sebelumnya, langsung pakai
  if (existingTransaction) {
    return callback(existingTransaction);
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