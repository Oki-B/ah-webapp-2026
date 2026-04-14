class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    return record.update(data, options);
  }

  async delete(id) {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    return record.destroy();
  }
}

module.exports = BaseRepository;