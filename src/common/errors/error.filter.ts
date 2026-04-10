import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorBase } from './error-base';

/**
 * Filtro de excepciones para ErrorBase.
 * Convierte errores personalizados a respuestas HTTP JSON.
 */
@Catch(ErrorBase)
export class ErrorFilter implements ExceptionFilter {
  /**
   * Maneja errores de tipo ErrorBase.
   * @param exception - Error capturado
   * @param host - Contexto del host
   * @returns Respuesta JSON con el error formateado
   */
  catch(exception: ErrorBase, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.httpStatus).json(exception.toJSON());
  }

  static handleHttpException(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      error:
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? exceptionResponse['message']
          : 'Internal server error',
      message:
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? exceptionResponse['message']
          : exception.message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
