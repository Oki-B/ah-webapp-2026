const BaseRepository = require("./base.repository");
const { User, Role } = require("../models");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, options = {}) {
    return this.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
      ...options,
    });
  }

  async findByRole(roleId, options = {}) {
    return this.findAll({
      include: [{ model: Role, as: "role", where: { id: roleId } }],
      ...options,
    });
  }

  async updateLastLogin(id, options = {}) {
    return this.update(id, { lastLogin: new Date() }, options);
  }
}

module.exports = new UserRepository();
