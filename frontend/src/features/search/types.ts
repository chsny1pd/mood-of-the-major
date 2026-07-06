export interface MoodFilters {
  tagSlug?: string;
  facultyId?: string;
  majorId?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "most_reacted" | "most_commented";
}

export const DEFAULT_MOOD_FILTERS: MoodFilters = {
  sort: "newest",
};
