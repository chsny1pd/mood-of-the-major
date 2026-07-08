import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "../components/RequireAuth";
import { RequireAdmin } from "../components/RequireAdmin";
import { ROUTES } from "../constants/routes";
import { PublicLayout } from "../layouts/PublicLayout";
import { LandingPage } from "../pages/LandingPage";
import { LazyQueryProvider } from "./LazyQueryProvider";
import { lazyRoute } from "./lazyRoute";

const AuthLayout = lazyRoute(() => import("../layouts/AuthLayout"), "AuthLayout");
const StudentLayout = lazyRoute(() => import("../layouts/StudentLayout"), "StudentLayout");
const AdminLayout = lazyRoute(() => import("../layouts/AdminLayout"), "AdminLayout");

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
const AdminPostsPage = lazyRoute(() => import("../pages/AdminPostsPage"), "AdminPostsPage");
const AdminFacultiesPage = lazyRoute(
  () => import("../pages/AdminFacultiesPage"),
  "AdminFacultiesPage",
);
const AdminMajorsPage = lazyRoute(() => import("../pages/AdminMajorsPage"), "AdminMajorsPage");
const AdminMoodsPage = lazyRoute(() => import("../pages/AdminMoodsPage"), "AdminMoodsPage");
const AdminPendingPage = lazyRoute(() => import("../pages/AdminPendingPage"), "AdminPendingPage");

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
      <LazyQueryProvider>
        <StudentLayout />
      </LazyQueryProvider>
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
        <LazyQueryProvider>
          <StudentLayout />
        </LazyQueryProvider>
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
        <LazyQueryProvider>
          <AdminLayout />
        </LazyQueryProvider>
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
      {
        path: ROUTES.adminPosts,
        element: <AdminPostsPage />,
      },
      {
        path: ROUTES.adminFaculties,
        element: <AdminFacultiesPage />,
      },
      {
        path: ROUTES.adminMajors,
        element: <AdminMajorsPage />,
      },
      {
        path: ROUTES.adminMoods,
        element: <AdminMoodsPage />,
      },
      {
        path: ROUTES.adminPending,
        element: <AdminPendingPage />,
      },
    ],
  },
]);
