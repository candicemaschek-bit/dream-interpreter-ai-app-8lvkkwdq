import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Volume2, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import type { SubscriptionTier } from '../types/subscription';

interface TTSCostIndicatorProps {
  subscriptionTier: SubscriptionTier;
  currentSpend: number;
  estimatedCost: number;
  characterCount: number;
  estimatedDuration: number;
  className?: string;
}

export function TTSCostIndicator({
  subscriptionTier,
  currentSpend,
  estimatedCost,
  characterCount,
  estimatedDuration,
  className = ''
}: TTSCostIndicatorProps) {
  // Monthly limits from SUBSCRIPTION_TIERS_REFERENCE
  // TTS is exclusive to VIP tier only with $0.94 monthly budget
  const monthlyLimits = {
    free: 0.00,
    pro: 0.00,
    premium: 0.00,
    vip: 0.94
  };

  const monthlyLimit = monthlyLimits[subscriptionTier];
  const remainingBudget = Math.max(0, monthlyLimit - currentSpend);
  const newTotal = currentSpend + estimatedCost;
  const wouldExceed = newTotal > monthlyLimit && monthlyLimit !== Infinity;
  const percentageUsed = monthlyLimit === Infinity ? 0 : ((newTotal / monthlyLimit) * 100);

  const getTierDisplayName = (tier: SubscriptionTier): string => {
    const names: Record<SubscriptionTier, string> = {
      free: 'Dreamer',
      pro: 'Visionary',
      premium: 'Architect',
      vip: 'Star'
    };
    return names[tier];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Only VIP (Star) tier has TTS with $0.94 monthly budget
  // All other tiers have no TTS access
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-50 border border-purple-200 cursor-help ${className}`}>
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">
                ${estimatedCost.toFixed(3)}
              </span>
              {wouldExceed && (
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {currentSpend.toFixed(3)}/{monthlyLimit.toFixed(2)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-3 text-sm">
            {/* Header */}
            <div>
              <p className="font-semibold">{getTierDisplayName(subscriptionTier)} Tier - TTS Budget</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {subscriptionTier === 'vip' ? '$0.94/month' : 'Not Available'}
              </Badge>
            </div>

            {/* Cost breakdown */}
            <div className="border-t border-gray-700 pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">This narration:</span>
                <span className="font-semibold">+${estimatedCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current month:</span>
                <span className="font-semibold">${currentSpend.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">New total:</span>
                <span className={wouldExceed ? 'text-red-400 font-semibold' : 'font-semibold'}>
                  ${newTotal.toFixed(3)} / ${monthlyLimit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="border-t border-gray-700 pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Characters:</span>
                <span>{characterCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Duration:</span>
                <span>{formatDuration(estimatedDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining Budget:</span>
                <span className={wouldExceed ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                  ${remainingBudget.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="border-t border-gray-700 pt-2 text-xs text-gray-400">
              <p className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                $0.000015 per character (OpenAI TTS)
              </p>
            </div>

            {/* Warning if would exceed */}
            {wouldExceed && (
              <div className="border-t border-red-700 pt-2 mt-2">
                <p className="text-red-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Would exceed monthly budget
                </p>
                <p className="text-xs text-red-300 mt-1">
                  Upgrade to a higher tier or wait for budget reset next month.
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}