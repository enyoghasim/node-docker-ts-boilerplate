import { NextFunction, Request, Response } from 'express';

type ErrorResponse = {
  status?: string;
  statusCode: number;
  message: string;
  details?: any;
  success: boolean;
};

function inferStatusCode(err: any): number {
  if (!err) return 500;

  if (typeof err.statusCode === 'number') return err.statusCode;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.httpStatus === 'number') return err.httpStatus;

  if (typeof err.httpCode === 'number') return err.httpCode;

  if (err.name === 'ValidationError' || err.name === 'ValidatorError')
    return 400;

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError')
    return 401;
  if (err.name === 'TokenExpiredError') return 401;

  if (err.code === '23505') return 409;

  if (err.name === 'QueryFailedError' || err.name === 'BadRequestError')
    return 400;

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

  if (process.env.NODE_ENV !== 'production' && err) {
    if (err.errors) payload.details = err.errors;
    else
      payload.details = {
        name: err.name,
        stack: err.stack,
        ...(err.details || {}),
      };
  }
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
