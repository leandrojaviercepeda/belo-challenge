import { HttpStatus } from '@nestjs/common';

export const ERROR_DICTIONARY = {
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Bad request',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
} as const;
