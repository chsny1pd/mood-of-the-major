export const queryKeys = {
  moodFeed: (scope: string, params?: unknown) => ["moods", "feed", scope, params] as const,
  moodDetail: (moodId: string) => ["moods", "detail", moodId] as const,
  moodSearch: (params: unknown) => ["moods", "search", params] as const,
  moodComments: (moodId: string) => ["comments", moodId] as const,
  reactions: (targetType: string, targetId: string) => ["reactions", targetType, targetId] as const,
  bookmarks: (params?: unknown) => ["bookmarks", params] as const,
  bookmarkStatus: (moodId: string) => ["bookmarks", "status", moodId] as const,
  emotionTags: ["tags", "emotions"] as const,
  imageUrl: (imageId: string) => ["images", "url", imageId] as const,
};
