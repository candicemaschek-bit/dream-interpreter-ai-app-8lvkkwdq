import { DreamStatistics } from './DreamStatistics'

interface DreamTrendsProps {
  subscriptionTier?: string
}

// Wrapper component that renames DreamStatistics to DreamTrends
export function DreamTrends({ subscriptionTier = 'free' }: DreamTrendsProps) {
  return <DreamStatistics subscriptionTier={subscriptionTier} />
}
