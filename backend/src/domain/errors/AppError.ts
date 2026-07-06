export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: string;
      details?: Array<{ field: string; message: string }>;
    } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message, { statusCode: 422, code: "VALIDATION_FAILED", details });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code: string, statusCode = 401) {
    super(message, { statusCode, code });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, { statusCode: 403, code });
    this.name = "AuthorizationError";
  }
}
