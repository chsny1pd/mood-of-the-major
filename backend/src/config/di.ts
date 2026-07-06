import type { Env } from "./env.js";
import { ImageService } from "../application/services/ImageService.js";
import { AuthService } from "../application/services/AuthService.js";
import { FacultyService } from "../application/services/FacultyService.js";
import { MoodService } from "../application/services/MoodService.js";
import { createAuthController } from "../controllers/authController.js";
import { createFacultyController } from "../controllers/facultyController.js";
import { createImageController } from "../controllers/imageController.js";
import { createMoodController } from "../controllers/moodController.js";
import { createTagController } from "../controllers/tagController.js";
import { BcryptPasswordHasher } from "../infrastructure/auth/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infrastructure/auth/JwtTokenService.js";
import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
} from "../infrastructure/database/connection.js";
import { MongooseFacultyRepository } from "../infrastructure/database/repositories/MongooseFacultyRepository.js";
import { MongooseMoodImageRepository } from "../infrastructure/database/repositories/MongooseMoodImageRepository.js";
import { MongooseMoodRepository } from "../infrastructure/database/repositories/MongooseMoodRepository.js";
import { MongooseTagRepository } from "../infrastructure/database/repositories/MongooseTagRepository.js";
import { MongooseUserRepository } from "../infrastructure/database/repositories/MongooseUserRepository.js";
import { createImageStorage } from "../infrastructure/storage/R2ImageStorage.js";
import { createLogger } from "../infrastructure/logging/logger.js";
import {
  createAuthenticateMiddleware,
  createOptionalAuthenticateMiddleware,
} from "../middlewares/authenticate.js";

function resolveJwtSecret(env: Env): string {
  if (env.JWT_SECRET) {
    return env.JWT_SECRET;
  }

  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return "dev-jwt-secret-change-before-production";
  }

  throw new Error("JWT_SECRET is required");
}

export interface AppDependencies {
  env: Env;
  logger: ReturnType<typeof createLogger>;
  authService: AuthService;
  facultyService: FacultyService;
  moodService: MoodService;
  imageService: ImageService;
  authController: ReturnType<typeof createAuthController>;
  facultyController: ReturnType<typeof createFacultyController>;
  moodController: ReturnType<typeof createMoodController>;
  imageController: ReturnType<typeof createImageController>;
  tagController: ReturnType<typeof createTagController>;
  authenticate: ReturnType<typeof createAuthenticateMiddleware>;
  optionalAuthenticate: ReturnType<typeof createOptionalAuthenticateMiddleware>;
  database: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getStatus: () => ReturnType<typeof getDatabaseStatus>;
  };
}

export function createDependencies(env: Env): AppDependencies {
  const logger = createLogger(env.LOG_LEVEL);
  const userRepository = new MongooseUserRepository();
  const facultyRepository = new MongooseFacultyRepository();
  const moodRepository = new MongooseMoodRepository();
  const moodImageRepository = new MongooseMoodImageRepository();
  const tagRepository = new MongooseTagRepository();
  const imageStorage = createImageStorage(env);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const tokenService = new JwtTokenService(resolveJwtSecret(env));

  const authService = new AuthService(
    userRepository,
    facultyRepository,
    passwordHasher,
    tokenService,
    env,
  );
  const facultyService = new FacultyService(facultyRepository);
  const moodService = new MoodService(
    moodRepository,
    moodImageRepository,
    tagRepository,
    facultyRepository,
    userRepository,
  );
  const imageService = new ImageService(moodImageRepository, imageStorage, env);

  return {
    env,
    logger,
    authService,
    facultyService,
    moodService,
    imageService,
    authController: createAuthController(authService, env),
    facultyController: createFacultyController(facultyService),
    moodController: createMoodController(moodService),
    imageController: createImageController(imageService),
    tagController: createTagController(tagRepository),
    authenticate: createAuthenticateMiddleware(tokenService, userRepository),
    optionalAuthenticate: createOptionalAuthenticateMiddleware(tokenService, userRepository),
    database: {
      connect: () => connectDatabase(env.MONGODB_URI, logger),
      disconnect: disconnectDatabase,
      getStatus: getDatabaseStatus,
    },
  };
}

export type Dependencies = AppDependencies;
