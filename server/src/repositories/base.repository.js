const { Op } = require("sequelize");

class BaseRepository {
  constructor(model) {
    this.model = model;
    this.Op = Op; // Menyimpan Op di instance untuk digunakan di repository turunan
  }

  async findOne(options = {}) {
    return await this.model.findOne(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(data, options = {}) {
    // Memastikan options.where ada agar tidak update seluruh tabel secara tidak sengaja
    if (!options.where) {
      throw new Error("Update operation requires a where clause.");
    }
    return await this.model.update(data, options);
  }

  async delete(options = {}) {
    if (!options.where) {
      throw new Error("Delete operation requires a where clause.");
    }
    return await this.model.destroy(options);
  }
}

module.exports = BaseRepository;
