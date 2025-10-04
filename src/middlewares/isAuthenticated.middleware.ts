
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../utils/appError';

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  throw new UnauthorizedException('Authentication required');
};
