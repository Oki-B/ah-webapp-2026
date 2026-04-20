const BaseRepository = require("./base.repository");
const { User, Role } = require("../models");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, options = {}) {
    // Gunakan this.model.findOne agar langsung akses ke Sequelize model
    return await this.model.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
      ...options, // transaction, lock, dll masuk ke sini
    });
  }

  async findByRole(roleId, options = {}) {
    return await this.model.findAll({
      where: {
        // Jika di model Role ada relasi, lebih clean filter di level include atau where
      },
      include: [{ 
        model: Role, 
        as: "role", 
        where: { id: roleId } 
      }],
      ...options,
    });
  }

  async updateLastLogin(userId, transactionOrOptions = {}) {
    /**
     * Tips: Agar service bisa kirim 't' langsung atau '{ transaction: t }'
     */
    const config = transactionOrOptions.transaction 
      ? transactionOrOptions 
      : { transaction: transactionOrOptions };

    return await this.update(
      { lastLogin: new Date() },
      { 
        where: { id: userId }, 
        ...config 
      }
    );
  }
}

module.exports = new UserRepository();