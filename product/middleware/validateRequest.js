// filename: middleware/validateRequest.js
const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    return next(error); // Pass the ZodError to the centralized error handler
  }
};

module.exports = { validateRequest };
