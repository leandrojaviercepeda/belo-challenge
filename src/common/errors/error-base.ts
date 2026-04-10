import { HttpStatus } from '@nestjs/common';

/**
 * Clase base para errores personalizados.
 * Define una estructura común para todos los errores de la aplicación.
 */
export class ErrorBase extends Error {
  public readonly code: string;
  public readonly message: string;
  public readonly httpStatus: HttpStatus;
  public readonly metadata?: Record<string, unknown>;

  /**
   * Constructor de ErrorBase.
   * @param errorConfig - Configuración del error (code, message, httpStatus)
   * @param metadata - Metadatos adicionales opcionales
   */
  constructor(
    errorConfig: { code: string; message: string; httpStatus: HttpStatus },
    metadata?: Record<string, unknown>,
  ) {
    super(errorConfig.message);
    this.name = this.constructor.name;
    this.code = errorConfig.code;
    this.message = errorConfig.message;
    this.httpStatus = errorConfig.httpStatus;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.metadata && { metadata: this.metadata }),
      timestamp: new Date().toISOString(),
    };
  }
}
