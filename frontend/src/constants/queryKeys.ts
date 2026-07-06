export const queryKeys = {
  moodFeed: (scope: string, params?: unknown) => ["moods", "feed", scope, params] as const,
  moodDetail: (moodId: string) => ["moods", "detail", moodId] as const,
  emotionTags: ["tags", "emotions"] as const,
  imageUrl: (imageId: string) => ["images", "url", imageId] as const,
};
