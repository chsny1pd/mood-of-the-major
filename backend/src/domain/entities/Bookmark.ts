export interface Bookmark {
  id: string;
  userId: string;
  moodId: string;
  createdAt: Date;
}

export interface CreateBookmarkInput {
  userId: string;
  moodId: string;
}
