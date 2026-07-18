import { createBrowserRouter } from "react-router-dom";
import { ROUTES } from "../constants/routes";

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    lazy: () =>
      import("./routes/homeRoute").then((module) => ({ Component: module.Component })),
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
        path: ROUTES.groups,
        lazy: () =>
          import("../pages/GroupsPage").then((module) => ({ Component: module.GroupsPage })),
      },
      {
        path: ROUTES.groupDetail(":groupId"),
        lazy: () =>
          import("../pages/GroupDetailPage").then((module) => ({
            Component: module.GroupDetailPage,
          })),
      },
      {
        path: ROUTES.search,
        lazy: async () => {
          const { Navigate } = await import("react-router-dom");
          const { ROUTES: routes } = await import("../constants/routes");
          return {
            Component: function SearchRedirect() {
              return <Navigate to={routes.feed} replace />;
            },
          };
        },
      },
      {
        path: ROUTES.dashboard,
        lazy: () =>
          import("../pages/DashboardPage").then((module) => ({ Component: module.DashboardPage })),
      },
      {
        path: ROUTES.statistics,
        lazy: async () => {
          const { Navigate } = await import("react-router-dom");
          const { ROUTES: routes } = await import("../constants/routes");
          return {
            Component: function StatisticsRedirect() {
              return <Navigate to={routes.dashboard} replace />;
            },
          };
        },
      },
      {
        path: ROUTES.trending,
        lazy: async () => {
          const { Navigate } = await import("react-router-dom");
          const { ROUTES: routes } = await import("../constants/routes");
          return {
            Component: function TrendingRedirect() {
              return <Navigate to={routes.dashboard} replace />;
            },
          };
        },
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
