export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode =
    err.statusCode ||
    (err.name === "ZodError" ? 400 : null) ||
    (err.name === "ValidationError" ? 400 : null) ||
    (err.code === 11000 ? 409 : null) ||
    500;

  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};