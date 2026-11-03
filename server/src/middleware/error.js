exports.notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

exports.errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.code === 11000) { status = 409; message = 'That record already exists'; }
  else if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 3 MB or smaller' : err.message; }

  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong' : message });
};
