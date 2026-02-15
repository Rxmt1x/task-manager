const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    return next();
  } catch (err) {
    if (err.errors && Array.isArray(err.errors)) {
      const errors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));

      return res.status(400).json({
        error: 'Invalid input data',
        details: errors
      });
    }

    console.error('Validation middleware error:', err);

    return res.status(400).json({
      error: 'Invalid request payload'
    });
  }
};

module.exports = validate;
