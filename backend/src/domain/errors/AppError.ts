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
