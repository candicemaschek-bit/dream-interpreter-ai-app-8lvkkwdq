export type InsightType = 'weekly_summary' | 'monthly_summary' | 'recurring_theme' | 'nightmare_pattern';

export interface PatternInsight {
  id: string;
  userId: string;
  insightType: InsightType;
  title: string;
  description: string;
  confidence: number;
  supportingDreams: string[]; // Array of dream IDs (handled by database cast)
  generatedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
