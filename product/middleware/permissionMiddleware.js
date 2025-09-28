// filename: middleware/permissionMiddleware.js

const isSupplier = (req, res, next) => {
  // This middleware should run AFTER authMiddleware
  if (req.user && req.user.role === 'SUPPLIER') {
    next(); // User has the 'SUPPLIER' role, proceed
  } else {
    res.status(403); // 403 Forbidden
    throw new Error('Access denied. Not a supplier.');
  }
};

module.exports = { isSupplier };
