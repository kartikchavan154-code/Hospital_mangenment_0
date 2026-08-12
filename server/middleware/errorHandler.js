const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation error.', errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(err.fields || {});
    return res.status(409).json({
      success: false,
      message: `Duplicate entry for: ${fields.join(', ')}`,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
};

module.exports = { errorHandler };
