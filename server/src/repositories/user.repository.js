const BaseRepository = require("./base.repository");
const { User, Role } = require("../models");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // Pola: (data, options = {})
  async findByEmail(email, options = {}) {
    return await this.model.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
      ...options,
    });
  }

  async findByRole(roleId, options = {}) {
    return await this.model.findAll({
      include: [{ 
        model: Role, 
        as: "role", 
        where: { id: roleId } 
      }],
      ...options,
    });
  }

  // SEBELUMNYA: updateLastLogin(userId, transactionOrOptions) -> Ganti!
  async updateLastLogin(userId, options = {}) {
    // Gak perlu lagi logic 'config' yang ribet di sini
    return await this.model.update(
      { lastLogin: new Date() },
      { 
        where: { id: userId }, 
        ...options // transaction harus dibungkus dalam objek: { transaction: t }
      }
    );
  }
}

module.exports = new UserRepository();