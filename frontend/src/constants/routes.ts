export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  feed: "/feed",
  create: "/create",
  bookmarks: "/bookmarks",
  search: "/search",
  moodDetail: (moodId: string) => `/mood/${moodId}`,
  facultyFeed: (facultyId: string) => `/faculty/${facultyId}`,
  majorFeed: (majorId: string) => `/major/${majorId}`,
} as const;
