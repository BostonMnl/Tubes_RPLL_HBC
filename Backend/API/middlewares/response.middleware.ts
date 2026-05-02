import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';

export type ApiResponse<T = unknown> = {
  code: number;
  message: string;
  data?: T;
};

type WrappedHandler<T> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<ApiResponse<T> | void> | ApiResponse<T> | void;

export const apiResponse = <T>(handler: WrappedHandler<T>): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await handler(req, res, next);

      if (res.headersSent || result === undefined) {
        return;
      }

      const { code, message, data } = result;
      res.status(code).json({
        code,
        message,
        ...(data !== undefined ? { data } : {}),
      });
    } catch (error) {
      next(error);
    }
  };
};

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode =
    typeof (error as { code?: number })?.code === 'number'
      ? (error as { code: number }).code
      : 404;
  const message =
    typeof (error as { message?: string })?.message === 'string'
      ? (error as { message: string }).message
      : 'Not found';
  const details = (error as { details?: unknown })?.details;

  const payload: { code: number; message: string; details?: unknown } = {
    code: statusCode,
    message,
  };

  console.error('Error:', {
    message,
    details,
    stack: (error as Error).stack,
  });

  if (details !== undefined) {
    payload.details = details;
  }

  res.status(statusCode).json(payload);
};
