import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import AppError from '../utils/appError';
import ResponseHelper from '../utils/response';
import AuthService from '../services/auth.service';

export default class MiddlewareService {
  static protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', ResponseHelper.UNAUTHORIZED));
    }

    try {

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY || 'mysecret');

      const currentUser = await AuthService.findUserById(decoded.id);

      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', ResponseHelper.UNAUTHORIZED));
      }

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password, please log in again.', ResponseHelper.UNAUTHORIZED));
      }

      req.user = currentUser;

      if (!req.user) {
        return next(new AppError('You are not authorized to access this route.', ResponseHelper.UNAUTHORIZED));
      }

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new AppError('Your token has expired. Please log in again.', ResponseHelper.UNAUTHORIZED));
      } else {
        console.error(error);
        return next(new AppError('Invalid token. Please log in again.', ResponseHelper.UNAUTHORIZED));
      }
    }
  };
}
