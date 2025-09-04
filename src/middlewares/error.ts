import { NextFunction, Request, Response } from 'express';

type ErrorResponse = {
  status?: string;
  statusCode: number;
  message: string;
  details?: any;
  success: boolean;
};

// Map common error shapes (from libraries or runtime) to HTTP status codes.
function inferStatusCode(err: any): number {
  if (!err) return 500;

  // http-errors (createError) and similar libs
  if (typeof err.statusCode === 'number') return err.statusCode;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.httpStatus === 'number') return err.httpStatus;

  // routing-controllers HttpError uses `httpCode` in older versions
  if (typeof err.httpCode === 'number') return err.httpCode;

  // class-validator / validation errors
  if (err.name === 'ValidationError' || err.name === 'ValidatorError')
    return 400;

  // Authentication / JWT errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError')
    return 401;
  if (err.name === 'TokenExpiredError') return 401;

  // Typical DB unique constraint from Postgres (via pg/error or orm wrappers)
  // Postgres uses code '23505' for unique_violation
  if (err.code === '23505') return 409;

  // Query or syntax problems often indicate bad request input
  if (err.name === 'QueryFailedError' || err.name === 'BadRequestError')
    return 400;

  // Default to 500 for everything else
  return 500;
}

// Central error handler for express. Sends JSON with a consistent shape.
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const inferred = inferStatusCode(err);
  const statusCode = Number(inferred) || 500;
  const message =
    err?.message || (statusCode === 500 ? 'Internal Server Error' : 'Error');

  const payload: ErrorResponse = {
    statusCode,
    message,
    success: false,
  };

  // Include some helpful details during development only
  if (process.env.NODE_ENV !== 'production' && err) {
    // Prefer structured validation details when available
    if (err.errors) payload.details = err.errors;
    else
      payload.details = {
        name: err.name,
        stack: err.stack,
        // attach any known detail bag that some libs provide
        ...(err.details || {}),
      };
  }

  // Logging - swap to a proper logger if available
  // keep logs minimal in production
  if (process.env.NODE_ENV === 'production') {
    console.error(
      `Error ${statusCode} ${req.method} ${req.originalUrl}: ${message}`
    );
  } else {
    console.error(
      `Error handling request ${req.method} ${req.originalUrl}:`,
      err
    );
  }

  res.status(statusCode).json(payload);
}
