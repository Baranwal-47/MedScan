const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
};

module.exports = errorHandler;
