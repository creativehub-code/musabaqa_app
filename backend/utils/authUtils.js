const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for a given user ID and role
 * @param {string} userId - The user's database ID
 * @param {string} role - The user's role (admin or judge)
 * @returns {string} The signed JWT
 */
const signToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = { signToken };
