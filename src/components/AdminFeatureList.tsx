import { AdminFeatureItem } from './AdminFeatureItem';
import type { FeatureRequest } from '../types/featureRequest';

interface AdminFeatureListProps {
  features: FeatureRequest[];
  onUpdate: () => void;
}

export function AdminFeatureList({ features, onUpdate }: AdminFeatureListProps) {
  if (features.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No features in this category yet</p>
        <p className="text-sm mt-2">Click "Capture Recommendation" to add your first feature</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <AdminFeatureItem
          key={feature.id}
          feature={feature}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
