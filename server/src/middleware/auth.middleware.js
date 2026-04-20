const jwt = require("jsonwebtoken");
const { AppError } = require("../utils");
const { userRepository } = require("../repositories");

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
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive. Please contact support.", 403);
    }

    req.user = user; // Attach user to request object
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

module.exports = {
  authenticate,
};
