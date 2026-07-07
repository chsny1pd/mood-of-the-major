import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "../components/RequireAuth";
import { RequireAdmin } from "../components/RequireAdmin";
import { ROUTES } from "../constants/routes";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { LandingPage } from "../pages/LandingPage";
import { QueryProvider } from "./QueryProvider";
import { lazyRoute } from "./lazyRoute";

const LoginPage = lazyRoute(() => import("../pages/LoginPage"), "LoginPage");
const RegisterPage = lazyRoute(() => import("../pages/RegisterPage"), "RegisterPage");
const AuthCallbackPage = lazyRoute(() => import("../pages/AuthCallbackPage"), "AuthCallbackPage");
const FeedPage = lazyRoute(() => import("../pages/FeedPage"), "FeedPage");
const MoodDetailPage = lazyRoute(() => import("../pages/MoodDetailPage"), "MoodDetailPage");
const FacultyFeedPage = lazyRoute(() => import("../pages/FacultyFeedPage"), "FacultyFeedPage");
const MajorFeedPage = lazyRoute(() => import("../pages/MajorFeedPage"), "MajorFeedPage");
const CreateMoodPage = lazyRoute(() => import("../pages/CreateMoodPage"), "CreateMoodPage");
const BookmarksPage = lazyRoute(() => import("../pages/BookmarksPage"), "BookmarksPage");
const SearchPage = lazyRoute(() => import("../pages/SearchPage"), "SearchPage");
const StatisticsPage = lazyRoute(() => import("../pages/StatisticsPage"), "StatisticsPage");
const TrendingPage = lazyRoute(() => import("../pages/TrendingPage"), "TrendingPage");
const NotificationsPage = lazyRoute(
  () => import("../pages/NotificationsPage"),
  "NotificationsPage",
);
const SettingsPage = lazyRoute(() => import("../pages/SettingsPage"), "SettingsPage");
const HowToUsePage = lazyRoute(() => import("../pages/HowToUsePage"), "HowToUsePage");
const AdminOverviewPage = lazyRoute(
  () => import("../pages/AdminOverviewPage"),
  "AdminOverviewPage",
);
const AdminReportsPage = lazyRoute(() => import("../pages/AdminReportsPage"), "AdminReportsPage");
const AdminUsersPage = lazyRoute(() => import("../pages/AdminUsersPage"), "AdminUsersPage");
const AdminAuditLogPage = lazyRoute(
  () => import("../pages/AdminAuditLogPage"),
  "AdminAuditLogPage",
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: ROUTES.home,
        element: <LandingPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.login,
        element: <LoginPage />,
      },
      {
        path: ROUTES.register,
        element: <RegisterPage />,
      },
      {
        path: ROUTES.authCallback,
        element: <AuthCallbackPage />,
      },
    ],
  },
  {
    element: (
      <QueryProvider>
        <StudentLayout />
      </QueryProvider>
    ),
    children: [
      {
        path: ROUTES.feed,
        element: <FeedPage />,
      },
      {
        path: ROUTES.howToUse,
        element: <HowToUsePage />,
      },
      {
        path: ROUTES.moodDetail(":moodId"),
        element: <MoodDetailPage />,
      },
      {
        path: ROUTES.facultyFeed(":facultyId"),
        element: <FacultyFeedPage />,
      },
      {
        path: ROUTES.majorFeed(":majorId"),
        element: <MajorFeedPage />,
      },
    ],
  },
  {
    element: (
      <RequireAuth>
        <QueryProvider>
          <StudentLayout />
        </QueryProvider>
      </RequireAuth>
    ),
    children: [
      {
        path: ROUTES.create,
        element: <CreateMoodPage />,
      },
      {
        path: ROUTES.bookmarks,
        element: <BookmarksPage />,
      },
      {
        path: ROUTES.search,
        element: <SearchPage />,
      },
      {
        path: ROUTES.statistics,
        element: <StatisticsPage />,
      },
      {
        path: ROUTES.trending,
        element: <TrendingPage />,
      },
      {
        path: ROUTES.notifications,
        element: <NotificationsPage />,
      },
      {
        path: ROUTES.settings,
        element: <SettingsPage />,
      },
    ],
  },
  {
    element: (
      <RequireAdmin>
        <QueryProvider>
          <AdminLayout />
        </QueryProvider>
      </RequireAdmin>
    ),
    children: [
      {
        path: ROUTES.admin,
        element: <AdminOverviewPage />,
      },
      {
        path: ROUTES.adminReports,
        element: <AdminReportsPage />,
      },
      {
        path: ROUTES.adminUsers,
        element: <AdminUsersPage />,
      },
      {
        path: ROUTES.adminAudit,
        element: <AdminAuditLogPage />,
      },
    ],
  },
]);
