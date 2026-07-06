import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authRateLimiter } from "../middlewares/authRateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../validators/authSchemas.js";

export function createAuthRoutes(deps: Dependencies): Router {
  const router = Router();
  const { authController, authenticate } = deps;

  router.post(
    "/register",
    authRateLimiter,
    validate(registerSchema),
    authController.register,
  );
  router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
  router.post("/logout", authenticate, authController.logout);
  router.post("/refresh", validate(refreshSchema), authController.refresh);
  router.get("/me", authenticate, authController.me);

  return router;
}
