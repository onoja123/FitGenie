import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  if (error.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  if (error.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 409);
  }

  return res.status(error.statusCode || 400).json({
    success: false,
    error: error.message || "Server error",
  });
};

export default globalErrorHandler;