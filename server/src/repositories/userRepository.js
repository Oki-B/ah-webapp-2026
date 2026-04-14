const BaseRepository = require("./baseRepository");
const { User, Role } = require("../models");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });
  }

  async findByRole(roleId) {
    return this.findAll({
      include: [{ model: Role, as: "role", where: { id: roleId } }],
    });
  }
}

module.exports = new UserRepository();
