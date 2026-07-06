export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  feed: "/feed",
  create: "/create",
  bookmarks: "/bookmarks",
  search: "/search",
  statistics: "/statistics",
  trending: "/trending",
  moodDetail: (moodId: string) => `/mood/${moodId}`,
  facultyFeed: (facultyId: string) => `/faculty/${facultyId}`,
  majorFeed: (majorId: string) => `/major/${majorId}`,
} as const;
