export interface EmotionTag {
  id: string;
  name: string;
  slug: string;
  colorToken: string | null;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
}
