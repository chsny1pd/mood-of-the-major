declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: string;
      userRole?: import("../domain/entities/User.js").UserRole;
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
