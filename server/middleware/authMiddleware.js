import jwt from "jsonwebtoken";
import User from "../model/userModel.js";
import AppError from "../utils/AppError.js";
import { asyncController } from "../utils/asyncController.js";

export const protect = asyncController(async (req, res, next) => {
  // 1) Retrieve the token from Authorization header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in! Please log in to get access.",
        401
      )
    );
  }

  // 2) Verify token
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || "fallback_secret";
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Your token has expired! Please log in again.", 401));
    }
    return next(new AppError("Invalid token. Please log in again.", 401));
  }

  // 3) Check if user still exists in database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token no longer exists.",
        401
      )
    );
  }

  // 4) Grant access to protected route by attaching user to request object
  req.user = currentUser;
  next();
});
