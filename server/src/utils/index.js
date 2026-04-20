const AppError = require("./app-error.helper");
const normalizePort = require("./normalize-port.helper");
const { onServerError } = require("./server-handlers.helper");
const { hashPassword, comparePassword } = require("./bcrypt.helper");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("./jwt.helper");
const { withTransaction } = require("./transaction.helper");
const delay = require("./delay.helper");
const { verifyGoogleToken } = require("./google-auth.helper");
const { getSimpleDeviceName } = require("./device.helper");

module.exports = {
  AppError,
  normalizePort,
  onServerError,
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  withTransaction,
  delay,
  verifyGoogleToken,
  getSimpleDeviceName,
};
