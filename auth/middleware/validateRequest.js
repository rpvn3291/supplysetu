// filename: middleware/validateRequest.js
const validateRequest = (schema) => async (req, res, next) => {
  try {
    // We validate the entire request object (body, params, query)
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    // If validation fails, the error is passed to our centralized error handler
    return next(error);
  }
};

module.exports = { validateRequest };
