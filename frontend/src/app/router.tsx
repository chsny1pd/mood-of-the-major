import { createBrowserRouter } from "react-router-dom";
import { RedirectIfAuthenticated, RequireAuth } from "../components/RequireAuth";
import { ROUTES } from "../constants/routes";
import { AuthLayout } from "../layouts/AuthLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { BookmarksPage } from "../pages/BookmarksPage";
import { CreateMoodPage } from "../pages/CreateMoodPage";
import { FacultyFeedPage } from "../pages/FacultyFeedPage";
import { FeedPage } from "../pages/FeedPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MajorFeedPage } from "../pages/MajorFeedPage";
import { MoodDetailPage } from "../pages/MoodDetailPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SearchPage } from "../pages/SearchPage";

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
    ],
  },
]);
