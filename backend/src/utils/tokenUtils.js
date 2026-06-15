const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for admin
 * @param {string} id - Admin ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Send token response to client
 */
const sendTokenResponse = (admin, statusCode, res, message = 'Success') => {
  const token = generateToken(admin._id);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
};

module.exports = { generateToken, sendTokenResponse };
