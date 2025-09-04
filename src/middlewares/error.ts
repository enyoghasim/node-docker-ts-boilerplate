import { NextFunction, Request, Response } from 'express';

type ErrorResponse = {
  status?: string;
  statusCode: number;
  message: string;
  details?: any;
};

// Central error handler for express. Sends JSON with a consistent shape.
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || 'Internal Server Error';

  const payload: ErrorResponse = {
    statusCode,
    message,
  };

  // Include details in non-production environments for easier debugging
  if (process.env.NODE_ENV !== 'production' && err) {
    payload.details = {
      name: err.name,
      stack: err.stack,
      ...err.details,
    };
  }

  // Minimal logging; real projects may use a logger instead of console
  console.error(
    `Error handling request ${req.method} ${req.originalUrl}:`,
    err
  );

  res.status(Number(statusCode) || 500).json(payload);
}
