export type FeatureStatus = 
  | 'idea' 
  | 'researching' 
  | 'designed' 
  | 'planned' 
  | 'in-dev' 
  | 'testing' 
  | 'launched' 
  | 'dismissed';

export type FeaturePriority = 'low' | 'medium' | 'high' | 'urgent';

export type FeatureCategory = 
  | 'ai' 
  | 'ui' 
  | 'payments' 
  | 'admin' 
  | 'performance' 
  | 'security' 
  | 'analytics'
  | 'dream-analysis'
  | 'video-generation'
  | 'custom'

export type RequestedByType = 'ai' | 'admin' | 'user';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
  priority: FeaturePriority;
  requestedBy: string;
  requestedByType: RequestedByType;
  targetRelease?: string; // Version format: 1.2.0
  estimatedHours?: number;
  notes?: string;
  technicalDetails?: string;
  dependencies?: string[]; // Array of feature IDs
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedTo?: string;
  votes: number;
}

export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  category: FeatureCategory;
  status?: FeatureStatus;
  priority?: FeaturePriority;
  requestedBy: string;
  requestedByType: RequestedByType;
  targetRelease?: string;
  estimatedHours?: number;
  notes?: string;
  technicalDetails?: string;
  dependencies?: string[];
  assignedTo?: string;
}

export interface UpdateFeatureRequestInput {
  title?: string;
  description?: string;
  category?: FeatureCategory;
  status?: FeatureStatus;
  priority?: FeaturePriority;
  targetRelease?: string;
  estimatedHours?: number;
  notes?: string;
  technicalDetails?: string;
  dependencies?: string[];
  assignedTo?: string;
  completedAt?: string;
}

export const FEATURE_STATUS_FLOW: Record<FeatureStatus, { next: FeatureStatus | 'PROMOTE' | null; color: string; icon: string }> = {
  idea: { next: 'researching', color: 'gray', icon: '💡' },
  researching: { next: 'designed', color: 'blue', icon: '🔍' },
  designed: { next: 'planned', color: 'purple', icon: '🎨' },
  planned: { next: 'PROMOTE', color: 'indigo', icon: '📋' },
  'in-dev': { next: 'testing', color: 'orange', icon: '⚙️' },
  testing: { next: 'launched', color: 'yellow', icon: '🧪' },
  launched: { next: null, color: 'green', icon: '✅' },
  dismissed: { next: null, color: 'red', icon: '❌' }
};

export const FEATURE_CATEGORIES = [
  { value: 'ai', label: 'AI Features' },
  { value: 'ui', label: 'User Interface' },
  { value: 'payments', label: 'Payments' },
  { value: 'admin', label: 'Admin Tools' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'dream-analysis', label: 'Dream Analysis' },
  { value: 'video-generation', label: 'Video Generation' },
  { value: 'custom', label: 'Custom' }
] as const
