import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return jwt.sign({ id: userId }, secret, {
    expiresIn: "30d",
  });
};
