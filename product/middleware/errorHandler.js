// filename: middleware/errorHandler.js
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error(err); // Good for debugging

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Invalid input data',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  
  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
