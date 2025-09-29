// filename: middleware/errorHandler.js
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Invalid input data',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  if (err.code === 'P2002') {
    const field = err.meta.target[0];
    return res.status(409).json({ message: `A unique constraint failed on the field: ${field}` });
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
module.exports = { errorHandler };
