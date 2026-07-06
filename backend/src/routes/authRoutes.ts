import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../validators/authSchemas.js";

export function createAuthRoutes(deps: Dependencies): Router {
  const router = Router();
  const { authController, authenticate, rateLimiters } = deps;

  router.post(
    "/register",
    rateLimiters.auth,
    validate(registerSchema),
    authController.register,
  );
  router.post("/login", rateLimiters.auth, validate(loginSchema), authController.login);
  router.post("/logout", authenticate, authController.logout);
  router.post("/refresh", validate(refreshSchema), authController.refresh);
  router.get("/me", authenticate, authController.me);

  return router;
}
