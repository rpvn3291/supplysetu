// filename: middleware/errorHandler.js
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error(err); // Log the error for debugging

  if (err instanceof ZodError) {
    // If the error is from Zod validation
    return res.status(400).json({
      message: 'Invalid input data',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  // Handle Prisma-specific errors
  if (err.code === 'P2002') { // Unique constraint violation
    const field = err.meta.target[0];
    return res.status(409).json({ message: `A user with this ${field} already exists.` });
  }

  // General fallback for other errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
};

module.exports = { errorHandler };
