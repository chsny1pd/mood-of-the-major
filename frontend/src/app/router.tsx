import { createBrowserRouter } from "react-router-dom";
import { RedirectIfAuthenticated, RequireAuth } from "../components/RequireAuth";
import { RequireAdmin } from "../components/RequireAdmin";
import { ROUTES } from "../constants/routes";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { AdminAuditLogPage } from "../pages/AdminAuditLogPage";
import { AdminOverviewPage } from "../pages/AdminOverviewPage";
import { AdminReportsPage } from "../pages/AdminReportsPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { BookmarksPage } from "../pages/BookmarksPage";
import { CreateMoodPage } from "../pages/CreateMoodPage";
import { FacultyFeedPage } from "../pages/FacultyFeedPage";
import { FeedPage } from "../pages/FeedPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MajorFeedPage } from "../pages/MajorFeedPage";
import { MoodDetailPage } from "../pages/MoodDetailPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SearchPage } from "../pages/SearchPage";
import { StatisticsPage } from "../pages/StatisticsPage";
import { TrendingPage } from "../pages/TrendingPage";

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
    element: (
      <RedirectIfAuthenticated>
        <AuthLayout />
      </RedirectIfAuthenticated>
    ),
    children: [
      {
        path: ROUTES.login,
        element: <LoginPage />,
      },
      {
        path: ROUTES.register,
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <StudentLayout />,
    children: [
      {
        path: ROUTES.feed,
        element: <FeedPage />,
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
        <StudentLayout />
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
    ],
  },
  {
    element: (
      <RequireAdmin>
        <AdminLayout />
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
