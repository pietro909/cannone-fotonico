import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errors: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        errors = [res];
      } else if (
        typeof res === 'object' && res && 'message' in res && Array.isArray((res as any).message)
      ) {
        errors = (res as any).message as string[];
      } else if (typeof res === 'object' && res && 'message' in res) {
        errors = [(res as any).message as string];
      }
    } else if ((exception as any)?.status && (exception as any)?.message) {
      status = (exception as any).status;
      errors = [(exception as any).message];
    } else if (exception instanceof Error) {
      errors = [exception.message];
    }

    response.status(status).json({ errors });
  }
}