// filename: middleware/errorHandler.js
import { ZodError } from 'zod';

const errorHandler = (err, req, res, next) => {
  console.error(err); // Good for debugging

  if (err instanceof ZodError) {
    // FIX: The detailed validation errors are in err.issues, not err.errors
    return res.status(400).json({
      message: 'Invalid input data',
      errors: err.issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err.code === 'P2002') { // Prisma unique constraint violation
    const field = err.meta.target[0];
    return res.status(409).json({ message: `A unique constraint failed on the field: ${field}` });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { errorHandler };

