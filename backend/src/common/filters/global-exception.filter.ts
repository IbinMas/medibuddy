import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { logger } from '../logger/logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    logger.error('Unhandled exception', { exception, status });

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : undefined;

    if (payload && typeof payload === 'object') {
      response.status(status).json({
        ...payload,
        statusCode: status,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(status).json({
      statusCode: status,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
}
