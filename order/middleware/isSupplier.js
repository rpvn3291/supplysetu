const isSupplier = (req, res, next) => {
  if (req.user && req.user.role === 'SUPPLIER') {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Access denied. Only suppliers can perform this action.');
  }
};

module.exports = { isSupplier };
