const { sequelize } = require("../../src/models");

describe("Database Connection", () => {
  // 1. Pastikan koneksi ditutup setelah test selesai agar Jest tidak nyangkut
  afterAll(async () => {
    await sequelize.close();
  });

  it("must succeed in connecting to the database (Authenticate)", async () => {
    // Fungsi authenticate() akan throw error jika gagal konek
    // Kita ekspektasikan dia berhasil tanpa error
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  it("must be able to execute basic queries", async () => {
    // Mengetes apakah kita bisa kirim perintah SQL
    const [results] = await sequelize.query("SELECT 1 + 1 AS result");
    expect(results[0].result).toBe(2);
  });
});
