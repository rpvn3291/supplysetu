// filename: middleware/permissionMiddleware.js
// This middleware ensures that only users with the 'VENDOR' role can access a route.
const isVendor = (req, res, next) => {
  if (req.user && req.user.role === 'VENDOR') {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Access denied. Only vendors can perform this action.');
  }
};

module.exports = { isVendor };
