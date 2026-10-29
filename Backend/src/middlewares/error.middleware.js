function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.statusCode ||
    (["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message: error.message || "Internal server error." });
}

module.exports = errorMiddleware;
