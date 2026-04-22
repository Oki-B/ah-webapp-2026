const AppError = require("./app-error.helper");
const normalizePort = require("./normalize-port.helper");
const { onServerError } = require("./server-handlers.helper");
const { hashPassword, comparePassword } = require("./bcrypt.helper");
const { generateAccessToken, verifyAccessToken } = require("./jwt.helper");
const { withTransaction } = require("./transaction.helper");
const delay = require("./delay.helper");
const { verifyGoogleToken } = require("./google-auth.helper");
const { getSimpleDeviceName, extractClientInfo } = require("./device.helper");
const {
  generateRandomToken,
  hashToken,
  generateTokenPair,
  isExpired,
} = require("./token.helper");

module.exports = {
  AppError,
  normalizePort,
  onServerError,
  hashPassword,
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
  withTransaction,
  delay,
  verifyGoogleToken,
  getSimpleDeviceName,
  extractClientInfo,
  generateRandomToken,
  hashToken,
  generateTokenPair,
  isExpired,
};
