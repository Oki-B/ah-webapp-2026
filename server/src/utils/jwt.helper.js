const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  const secretKey = process.env.JWT_SECRET;

  return jwt.sign(payload, secretKey, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

const verifyToken = (token) => {
  const secretKey = process.env.JWT_SECRET;
  return jwt.verify(token, secretKey);
};

module.exports = {
  generateToken,
  verifyToken,
};
