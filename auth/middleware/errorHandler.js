// filename: middleware/errorHandler.js
import { ZodError } from 'zod';

const errorHandler = (err, req, res, next) => {
  console.error(err); // It's good to log the actual error for you to see

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Invalid input data',
      // --- THIS IS THE FIX: Use err.issues instead of err.errors ---
      errors: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  // Handle Prisma-specific errors
  if (err.code === 'P2002') { // Unique constraint violation
    const field = err.meta.target[0];
    return res.status(409).json({ message: `A user with this ${field} already exists.` });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
};

export { errorHandler };

