import { Request, Response, NextFunction, RequestHandler } from 'express';

// Small helper to wrap async route handlers and forward errors to next()
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
     
    fn(req, res, next).catch(next);
  };
};
