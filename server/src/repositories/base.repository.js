class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async findOne(query = {}, options = {}) {
    return await this.model.findOne({ where: query, ...options });
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.model.findByPk(id, options);
    if (!record) return null;
    return await record.update(data, options);
  }

  async delete(id, options = {}) {
    const record = await this.model.findByPk(id, options);
    if (!record) return null;
    return await record.destroy(options);
  }
}

module.exports = BaseRepository;