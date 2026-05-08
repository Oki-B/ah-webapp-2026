const jwt = require("jsonwebtoken");
const { AppError, verifyGoogleToken } = require("../utils");
const { userRepository, userSessionRepository } = require("../repositories");

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Authentication token missing", 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const activeSession = await userSessionRepository.findById(
      decoded.sessionId,
    );

    if (activeSession.revokedAt || activeSession.expiresAt < new Date()) {
      throw new AppError("Session not found or expired", 401);
    }

    const user = await userRepository.findByIdWithRole(decoded.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive. Please contact support.", 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.dataValues.name, // Pastikan role ada di dataValues
      sessionId: decoded.sessionId, // Attach sessionId dari token ke req.user
    }; // Attach user to request object

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    } else if (err.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }
    next(err);
  }
};

const validateGoogleToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError("Google token missing", 400);
    }
    const payload = await verifyGoogleToken(token);
    req.googleUser = payload;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  validateGoogleToken,
};
