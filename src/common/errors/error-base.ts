import { HttpStatus } from '@nestjs/common';

export class ErrorBase extends Error {
  public readonly code: string;
  public readonly message: string;
  public readonly httpStatus: HttpStatus;
  public readonly metadata?: Record<string, unknown>;

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
