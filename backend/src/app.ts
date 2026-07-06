import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { Dependencies } from "./config/di.js";
import { getCorsOrigins } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { createApiRoutes } from "./routes/index.js";
import { createHealthRoutes } from "./routes/healthRoutes.js";

export function createApp(deps: Dependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: getCorsOrigins(deps.env),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.method === "PUT" && /^\/api\/v1\/images\/[^/]+\/data$/.test(req.path)) {
      next();
      return;
    }

    express.json({ limit: "1mb" })(req, res, next);
  });
  app.use(requestLogger(deps.logger));

  app.use(createHealthRoutes());
  app.use("/api/v1", createApiRoutes(deps));

  app.use(errorHandler(deps.logger));

  return app;
}
