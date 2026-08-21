const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  // Prisma Known Request Errors
  if (err.code) {
    if (err.code === 'P2002') {
      const field = err.meta?.target ? err.meta.target.join(', ') : 'field';
      return res.status(400).json({
        success: false,
        message: `A record with this ${field} already exists.`
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'The requested record was not found.'
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Related database record not found or constraint failed.'
      });
    }
  }

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
