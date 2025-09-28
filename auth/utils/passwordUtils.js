const bcrypt = require('bcryptjs');

/**
 * Hashes a plaintext password.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} The hashed password.
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plaintext password with a hash.
 * @param {string} password The plaintext password.
 * @param {string} hashedPassword The hashed password to compare against.
 * @returns {Promise<boolean>} True if the passwords match.
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };

