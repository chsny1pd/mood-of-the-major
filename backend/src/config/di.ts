import type { Env } from "./env.js";
import { ImageService } from "../application/services/ImageService.js";
import { AuthService } from "../application/services/AuthService.js";
import { BookmarkService } from "../application/services/BookmarkService.js";
import { CommentService } from "../application/services/CommentService.js";
import { FacultyService } from "../application/services/FacultyService.js";
import { GroupService } from "../application/services/GroupService.js";
import { MoodService } from "../application/services/MoodService.js";
import { ReactionService } from "../application/services/ReactionService.js";
import { ReportService } from "../application/services/ReportService.js";
import { AdminService } from "../application/services/AdminService.js";
import { SubmissionService } from "../application/services/SubmissionService.js";
import { NotificationService } from "../application/services/NotificationService.js";
import { StatisticsAggregationJob } from "../application/services/StatisticsAggregationJob.js";
import { ImageCleanupJob } from "../application/services/ImageCleanupJob.js";
import { StatisticsService } from "../application/services/StatisticsService.js";
import { TrendingService } from "../application/services/TrendingService.js";
import { createAuthController } from "../controllers/authController.js";
import { createBookmarkController } from "../controllers/bookmarkController.js";
import { createCommentController } from "../controllers/commentController.js";
import { createFacultyController } from "../controllers/facultyController.js";
import { createGroupController } from "../controllers/groupController.js";
import { createImageController } from "../controllers/imageController.js";
import { createMoodController } from "../controllers/moodController.js";
import { createReactionController } from "../controllers/reactionController.js";
import { createReportController } from "../controllers/reportController.js";
import { createAdminController } from "../controllers/adminController.js";
import { createNotificationController } from "../controllers/notificationController.js";
import { createStatisticsController } from "../controllers/statisticsController.js";
import { createJobController } from "../controllers/jobController.js";
import { createSubmissionController } from "../controllers/submissionController.js";
import { AggregationThresholdPolicy } from "../domain/services/AggregationThresholdPolicy.js";
import { BcryptPasswordHasher } from "../infrastructure/auth/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infrastructure/auth/JwtTokenService.js";
import { configurePassport } from "../infrastructure/auth/configurePassport.js";
import { createOAuthController } from "../controllers/oauthController.js";
import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
} from "../infrastructure/database/connection.js";
import { MongooseDailyStatisticsRepository } from "../infrastructure/database/repositories/MongooseDailyStatisticsRepository.js";
import { MongooseEmotionStatisticsRepository } from "../infrastructure/database/repositories/MongooseEmotionStatisticsRepository.js";
import { MongooseStatisticsSourceRepository } from "../infrastructure/database/repositories/MongooseStatisticsSourceRepository.js";
import { MongooseAuditLogRepository } from "../infrastructure/database/repositories/MongooseAuditLogRepository.js";
import { MongooseNotificationRepository } from "../infrastructure/database/repositories/MongooseNotificationRepository.js";
import { MongooseBookmarkRepository } from "../infrastructure/database/repositories/MongooseBookmarkRepository.js";
import { MongooseCommentRepository } from "../infrastructure/database/repositories/MongooseCommentRepository.js";
import { MongooseFacultyRepository } from "../infrastructure/database/repositories/MongooseFacultyRepository.js";
import { MongooseGroupMemberRepository } from "../infrastructure/database/repositories/MongooseGroupMemberRepository.js";
import { MongooseGroupRepository } from "../infrastructure/database/repositories/MongooseGroupRepository.js";
import { MongooseMoodImageRepository } from "../infrastructure/database/repositories/MongooseMoodImageRepository.js";
import { MongooseMoodRepository } from "../infrastructure/database/repositories/MongooseMoodRepository.js";
import { MongooseReactionRepository } from "../infrastructure/database/repositories/MongooseReactionRepository.js";
import { MongooseReportRepository } from "../infrastructure/database/repositories/MongooseReportRepository.js";
import { MongooseTagRepository } from "../infrastructure/database/repositories/MongooseTagRepository.js";
import { createTagController } from "../controllers/tagController.js";
import { MongooseSubmissionRepository } from "../infrastructure/database/repositories/MongooseSubmissionRepository.js";
import { MongooseUserRepository } from "../infrastructure/database/repositories/MongooseUserRepository.js";
import { createImageStorage } from "../infrastructure/storage/R2ImageStorage.js";
import { createLogger } from "../infrastructure/logging/logger.js";
import {
  createAuthenticateMiddleware,
  createOptionalAuthenticateMiddleware,
} from "../middlewares/authenticate.js";
import { createRateLimiters, type AppRateLimiters } from "../middlewares/rateLimitFactory.js";

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
  groupService: GroupService;
  moodService: MoodService;
  imageService: ImageService;
  commentService: CommentService;
  reactionService: ReactionService;
  bookmarkService: BookmarkService;
  reportService: ReportService;
  statisticsService: StatisticsService;
  trendingService: TrendingService;
  submissionService: SubmissionService;
  adminService: AdminService;
  notificationService: NotificationService;
  statisticsController: ReturnType<typeof createStatisticsController>;
  adminController: ReturnType<typeof createAdminController>;
  notificationController: ReturnType<typeof createNotificationController>;
  authController: ReturnType<typeof createAuthController>;
  oauthController: ReturnType<typeof createOAuthController>;
  facultyController: ReturnType<typeof createFacultyController>;
  groupController: ReturnType<typeof createGroupController>;
  moodController: ReturnType<typeof createMoodController>;
  imageController: ReturnType<typeof createImageController>;
  submissionController: ReturnType<typeof createSubmissionController>;
  tagController: ReturnType<typeof createTagController>;
  commentController: ReturnType<typeof createCommentController>;
  reactionController: ReturnType<typeof createReactionController>;
  bookmarkController: ReturnType<typeof createBookmarkController>;
  reportController: ReturnType<typeof createReportController>;
  jobController: ReturnType<typeof createJobController>;
  rateLimiters: AppRateLimiters;
  authenticate: ReturnType<typeof createAuthenticateMiddleware>;
  optionalAuthenticate: ReturnType<typeof createOptionalAuthenticateMiddleware>;
  database: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getStatus: () => ReturnType<typeof getDatabaseStatus>;
  };
}

export function createDependencies(env: Env): AppDependencies {
  const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV);
  const rateLimiters = createRateLimiters(env, logger);
  const userRepository = new MongooseUserRepository();
  const facultyRepository = new MongooseFacultyRepository();
  const groupRepository = new MongooseGroupRepository();
  const groupMemberRepository = new MongooseGroupMemberRepository();
  const moodRepository = new MongooseMoodRepository();
  const moodImageRepository = new MongooseMoodImageRepository();
  const tagRepository = new MongooseTagRepository();
  const commentRepository = new MongooseCommentRepository();
  const reactionRepository = new MongooseReactionRepository();
  const bookmarkRepository = new MongooseBookmarkRepository();
  const reportRepository = new MongooseReportRepository();
  const emotionStatisticsRepository = new MongooseEmotionStatisticsRepository();
  const dailyStatisticsRepository = new MongooseDailyStatisticsRepository();
  const statisticsSourceRepository = new MongooseStatisticsSourceRepository();
  const auditLogRepository = new MongooseAuditLogRepository();
  const notificationRepository = new MongooseNotificationRepository();
  const submissionRepository = new MongooseSubmissionRepository();
  const thresholdPolicy = new AggregationThresholdPolicy(env.AGGREGATION_THRESHOLD_MIN);
  const imageStorage = createImageStorage(env);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const tokenService = new JwtTokenService(resolveJwtSecret(env));
  configurePassport(env);

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
    groupMemberRepository,
  );
  const groupService = new GroupService(
    groupRepository,
    groupMemberRepository,
    userRepository,
    moodService,
  );
  const imageService = new ImageService(moodImageRepository, imageStorage, env);
  const commentService = new CommentService(commentRepository, moodRepository);
  const reactionService = new ReactionService(reactionRepository, moodRepository, commentRepository);
  const bookmarkService = new BookmarkService(bookmarkRepository, moodRepository);
  const reportService = new ReportService(reportRepository, moodRepository, commentRepository);
  const statisticsService = new StatisticsService(
    emotionStatisticsRepository,
    dailyStatisticsRepository,
    tagRepository,
    thresholdPolicy,
  );
  const trendingService = new TrendingService(
    dailyStatisticsRepository,
    tagRepository,
    thresholdPolicy,
  );
  const notificationService = new NotificationService(notificationRepository);
  const submissionService = new SubmissionService(submissionRepository);
  const adminService = new AdminService(
    userRepository,
    moodRepository,
    commentRepository,
    reportRepository,
    tagRepository,
    facultyRepository,
    auditLogRepository,
    notificationService,
    submissionService,
  );
  const aggregationJob = new StatisticsAggregationJob(
    statisticsSourceRepository,
    dailyStatisticsRepository,
    emotionStatisticsRepository,
    thresholdPolicy,
  );
  const imageCleanupJob = new ImageCleanupJob(
    moodImageRepository,
    imageStorage,
    env.ORPHAN_IMAGE_TTL_HOURS,
    env.IMAGE_CLEANUP_BATCH_SIZE,
    logger,
  );
  const statisticsController = createStatisticsController(statisticsService, trendingService);
  const jobController = createJobController(aggregationJob, imageCleanupJob);

  return {
    env,
    logger,
    rateLimiters,
    authService,
    facultyService,
    groupService,
    moodService,
    imageService,
    commentService,
    reactionService,
    bookmarkService,
    reportService,
    statisticsService,
    trendingService,
    adminService,
    notificationService,
    submissionService,
    statisticsController,
    adminController: createAdminController(adminService),
    notificationController: createNotificationController(notificationService),
    authController: createAuthController(authService, env),
    oauthController: createOAuthController(authService, env),
    facultyController: createFacultyController(facultyService),
    groupController: createGroupController(groupService),
    moodController: createMoodController(moodService),
    imageController: createImageController(imageService),
    tagController: createTagController(tagRepository),
    submissionController: createSubmissionController(submissionService),
    commentController: createCommentController(commentService),
    reactionController: createReactionController(reactionService),
    bookmarkController: createBookmarkController(bookmarkService),
    reportController: createReportController(reportService),
    jobController,
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

