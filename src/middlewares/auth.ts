import {
  ExpressMiddlewareInterface,
  UnauthorizedError,
} from 'routing-controllers';
import { NextFunction, Request, Response } from 'express';
import { Service } from 'typedi';

@Service()
export class AuthMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.session && req.session.user) {
      next();
    } else {
      throw new UnauthorizedError('Unauthorized');
    }
  }
}
