const bcrypt = require('bcryptjs');

/**
 * Hash password dengan salt round 12 (standar industri)
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

/**
 * Bandingkan password plain dengan yang di database
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};