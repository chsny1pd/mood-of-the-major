import { createBrowserRouter } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { PublicLayout } from "../layouts/PublicLayout";
import { LandingPage } from "../pages/LandingPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: ROUTES.home,
        Component: LandingPage,
      },
    ],
  },
  {
    lazy: () => import("./routes/authRoutes").then((module) => ({ Component: module.Component })),
    children: [
      {
        path: ROUTES.login,
        lazy: () => import("../pages/LoginPage").then((module) => ({ Component: module.LoginPage })),
      },
      {
        path: ROUTES.register,
        lazy: () =>
          import("../pages/RegisterPage").then((module) => ({ Component: module.RegisterPage })),
      },
      {
        path: ROUTES.authCallback,
        lazy: () =>
          import("../pages/AuthCallbackPage").then((module) => ({
            Component: module.AuthCallbackPage,
          })),
      },
    ],
  },
  {
    lazy: () => import("./routes/studentRoutes").then((module) => ({ Component: module.Component })),
    children: [
      {
        path: ROUTES.feed,
        lazy: () => import("../pages/FeedPage").then((module) => ({ Component: module.FeedPage })),
      },
      {
        path: ROUTES.howToUse,
        lazy: () =>
          import("../pages/HowToUsePage").then((module) => ({ Component: module.HowToUsePage })),
      },
      {
        path: ROUTES.moodDetail(":moodId"),
        lazy: () =>
          import("../pages/MoodDetailPage").then((module) => ({ Component: module.MoodDetailPage })),
      },
      {
        path: ROUTES.facultyFeed(":facultyId"),
        lazy: () =>
          import("../pages/FacultyFeedPage").then((module) => ({
            Component: module.FacultyFeedPage,
          })),
      },
      {
        path: ROUTES.majorFeed(":majorId"),
        lazy: () =>
          import("../pages/MajorFeedPage").then((module) => ({ Component: module.MajorFeedPage })),
      },
    ],
  },
  {
    lazy: () =>
      import("./routes/studentPrivateRoutes").then((module) => ({ Component: module.Component })),
    children: [
      {
        path: ROUTES.create,
        lazy: () =>
          import("../pages/CreateMoodPage").then((module) => ({ Component: module.CreateMoodPage })),
      },
      {
        path: ROUTES.bookmarks,
        lazy: () =>
          import("../pages/BookmarksPage").then((module) => ({ Component: module.BookmarksPage })),
      },
      {
        path: ROUTES.search,
        lazy: () => import("../pages/SearchPage").then((module) => ({ Component: module.SearchPage })),
      },
      {
        path: ROUTES.statistics,
        lazy: () =>
          import("../pages/StatisticsPage").then((module) => ({ Component: module.StatisticsPage })),
      },
      {
        path: ROUTES.trending,
        lazy: () =>
          import("../pages/TrendingPage").then((module) => ({ Component: module.TrendingPage })),
      },
      {
        path: ROUTES.notifications,
        lazy: () =>
          import("../pages/NotificationsPage").then((module) => ({
            Component: module.NotificationsPage,
          })),
      },
      {
        path: ROUTES.settings,
        lazy: () =>
          import("../pages/SettingsPage").then((module) => ({ Component: module.SettingsPage })),
      },
    ],
  },
  {
    lazy: () => import("./routes/adminRoutes").then((module) => ({ Component: module.Component })),
    children: [
      {
        path: ROUTES.admin,
        lazy: () =>
          import("../pages/AdminOverviewPage").then((module) => ({
            Component: module.AdminOverviewPage,
          })),
      },
      {
        path: ROUTES.adminReports,
        lazy: () =>
          import("../pages/AdminReportsPage").then((module) => ({
            Component: module.AdminReportsPage,
          })),
      },
      {
        path: ROUTES.adminUsers,
        lazy: () =>
          import("../pages/AdminUsersPage").then((module) => ({ Component: module.AdminUsersPage })),
      },
      {
        path: ROUTES.adminAudit,
        lazy: () =>
          import("../pages/AdminAuditLogPage").then((module) => ({
            Component: module.AdminAuditLogPage,
          })),
      },
      {
        path: ROUTES.adminPosts,
        lazy: () =>
          import("../pages/AdminPostsPage").then((module) => ({ Component: module.AdminPostsPage })),
      },
      {
        path: ROUTES.adminFaculties,
        lazy: () =>
          import("../pages/AdminFacultiesPage").then((module) => ({
            Component: module.AdminFacultiesPage,
          })),
      },
      {
        path: ROUTES.adminMajors,
        lazy: () =>
          import("../pages/AdminMajorsPage").then((module) => ({ Component: module.AdminMajorsPage })),
      },
      {
        path: ROUTES.adminMoods,
        lazy: () =>
          import("../pages/AdminMoodsPage").then((module) => ({ Component: module.AdminMoodsPage })),
      },
      {
        path: ROUTES.adminPending,
        lazy: () =>
          import("../pages/AdminPendingPage").then((module) => ({
            Component: module.AdminPendingPage,
          })),
      },
    ],
  },
]);
