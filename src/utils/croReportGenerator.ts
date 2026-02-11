/**
 * CRO Report Generator Utility
 * Compiles comprehensive data from multiple tables to generate structured CRO insights
 */

import { blink } from '../blink/client';
import { castUserProfiles } from './databaseCast';
import type { SubscriptionTier } from '@/types/subscription';

export interface CROReportData {
  reportDate: string;
  acquisition: {
    totalVisitorsEstimate: number; // Placeholder until real traffic tracking
    totalSignups: number;
    signupConversionRate: number;
  };
  activation: {
    onboardingCompletionRate: number;
    firstDreamConversionRate: number;
    ahaMomentRate: number; // Viewed interpretation
  };
  monetization: {
    tierBreakdown: Record<SubscriptionTier, number>;
    freeToPaidConversionRate: number;
    averageRevenuePerUser: number;
    addonPurchaseRate: number;
  };
  retention: {
    day7RetentionEstimate: number;
    day30RetentionEstimate: number;
    averageDreamsPerUser: number;
  };
  technical: {
    totalInterpretations: number;
    totalImages: number;
    totalVideos: number;
    averageCostPerDream: number;
  };
}

/**
 * Generate a comprehensive CRO Report object
 */
export async function generateCROReport(): Promise<CROReportData> {
  try {
    console.log('Generating CRO Report: Starting data fetch...');
    // 1. Gather raw data with error handling
    const [profilesRaw, dreams, usageSummaries, addonPurchases] = await Promise.all([
      blink.db.userProfiles.list({ limit: 10000 }).catch(err => {
        console.error('Error fetching userProfiles:', err);
        return [];
      }),
      blink.db.dreams.list({ limit: 10000 }).catch(err => {
        console.error('Error fetching dreams:', err);
        return [];
      }),
      blink.db.monthlyUsageSummary.list({ limit: 1000 }).catch(err => {
        console.error('Error fetching monthlyUsageSummary:', err);
        return [];
      }),
      blink.db.addOnPurchases?.list?.({ limit: 1000 }).catch(err => {
        console.error('Error fetching addOnPurchases:', err);
        return [];
      }) || Promise.resolve([])
    ]);
    
    console.log(`Generating CRO Report: Data fetched. Profiles: ${profilesRaw.length}, Dreams: ${dreams.length}`);

    const profiles = castUserProfiles(profilesRaw as any);

    const totalUsers = profiles.length;
    const totalDreams = dreams.length;

    // 2. Acquisition Metrics
    // Since we don't track raw "page views" in DB yet, we estimate based on signups (industry avg 30%)
    const estimatedVisitors = Math.round(totalUsers / 0.3); 
    const signupConversionRate = totalUsers > 0 ? (totalUsers / estimatedVisitors) * 100 : 0;

    // 3. Activation Metrics
    const onboardingCompleted = profiles.filter(p => p.onboardingCompleted).length;
    const onboardingRate = totalUsers > 0 ? (onboardingCompleted / totalUsers) * 100 : 0;

    const usersWithDreams = new Set(dreams.map(d => d.userId)).size;
    const firstDreamRate = totalUsers > 0 ? (usersWithDreams / totalUsers) * 100 : 0;

    const dreamsWithInterpretations = dreams.filter(d => d.interpretation).length;
    const ahaMomentRate = totalDreams > 0 ? (dreamsWithInterpretations / totalDreams) * 100 : 0;

    // 4. Monetization Metrics
    const tierBreakdown: Record<SubscriptionTier, number> = {
      free: profiles.filter(p => p.subscriptionTier === 'free').length,
      pro: profiles.filter(p => p.subscriptionTier === 'pro').length,
      premium: profiles.filter(p => p.subscriptionTier === 'premium').length,
      vip: profiles.filter(p => p.subscriptionTier === 'vip' || p.subscriptionTier === 'star').length,
      star: profiles.filter(p => p.subscriptionTier === 'star').length
    };

    const paidUsers = totalUsers - tierBreakdown.free;
    const freeToPaidRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

    // Simplified revenue calculation
    const revenueMap: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 12,
      premium: 29,
      vip: 99,
      star: 29
    };

    const monthlyRevenue = 
      (tierBreakdown.pro * revenueMap.pro) + 
      (tierBreakdown.premium * revenueMap.premium) + 
      (tierBreakdown.star * revenueMap.star);

    const arpu = totalUsers > 0 ? monthlyRevenue / totalUsers : 0;
    const addonPurchaseRate = totalUsers > 0 ? (addonPurchases.length / totalUsers) * 100 : 0;

    // 5. Retention Metrics
    // Day 7 retention estimate based on users with > 3 dreams
    const retainedUsers = profiles.filter(p => p.dreamsAnalyzedLifetime > 3).length;
    const day7Retention = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
    
    // Day 30 retention estimate based on users with > 10 dreams
    const loyalUsers = profiles.filter(p => p.dreamsAnalyzedLifetime > 10).length;
    const day30Retention = totalUsers > 0 ? (loyalUsers / totalUsers) * 100 : 0;

    const avgDreams = totalUsers > 0 ? totalDreams / totalUsers : 0;

    // 6. Technical Performance
    const totalImages = dreams.filter(d => d.imageUrl).length;
    const totalVideos = dreams.filter(d => d.videoUrl).length;
    const totalCost = usageSummaries.reduce((sum, s) => sum + (Number(s.totalCostUsd) || 0), 0);
    const avgCostPerDream = totalDreams > 0 ? totalCost / totalDreams : 0;

    return {
      reportDate: new Date().toISOString(),
      acquisition: {
        totalVisitorsEstimate: estimatedVisitors,
        totalSignups: totalUsers,
        signupConversionRate
      },
      activation: {
        onboardingCompletionRate: onboardingRate,
        firstDreamConversionRate: firstDreamRate,
        ahaMomentRate
      },
      monetization: {
        tierBreakdown,
        freeToPaidConversionRate: freeToPaidRate,
        averageRevenuePerUser: arpu,
        addonPurchaseRate
      },
      retention: {
        day7RetentionEstimate: day7Retention,
        day30RetentionEstimate: day30Retention,
        averageDreamsPerUser: avgDreams
      },
      technical: {
        totalInterpretations: dreamsWithInterpretations,
        totalImages,
        totalVideos,
        averageCostPerDream
      }
    };
  } catch (error) {
    console.error('Failed to generate CRO report:', error);
    throw error;
  }
}

/**
 * Format the report data into Markdown
 */
export function formatReportToMarkdown(data: CROReportData): string {
  const { acquisition, activation, monetization, retention, technical } = data;
  
  return `# 📊 Conversion Rate Optimization (CRO) Automated Report
Generated on: ${new Date(data.reportDate).toLocaleDateString()}

## 📈 Acquisition
- **Estimated Visitors:** ${acquisition.totalVisitorsEstimate}
- **Total Signups:** ${acquisition.totalSignups}
- **Signup Conversion Rate:** ${acquisition.signupConversionRate.toFixed(2)}%

## 🧩 Activation
- **Onboarding Completion:** ${activation.onboardingCompletionRate.toFixed(2)}%
- **First Dream Submission:** ${activation.firstDreamConversionRate.toFixed(2)}%
- **"Aha Moment" (Interpretation Viewed):** ${activation.ahaMomentRate.toFixed(2)}%

## 💰 Monetization
- **Free to Paid Conversion:** ${monetization.freeToPaidConversionRate.toFixed(2)}%
- **Monthly Revenue (Est):** $${(monetization.averageRevenuePerUser * acquisition.totalSignups).toFixed(2)}
- **ARPU:** $${monetization.averageRevenuePerUser.toFixed(2)}
- **Add-on Purchase Rate:** ${monetization.addonPurchaseRate.toFixed(2)}%

### Tier Breakdown
- **Free:** ${monetization.tierBreakdown.free}
- **Pro:** ${monetization.tierBreakdown.pro}
- **Premium:** ${monetization.tierBreakdown.premium}
- **Star/VIP:** ${monetization.tierBreakdown.star}

## 🔄 Retention
- **Estimated Day 7 Retention:** ${retention.day7RetentionEstimate.toFixed(2)}%
- **Estimated Day 30 Retention:** ${retention.day30RetentionEstimate.toFixed(2)}%
- **Average Dreams per User:** ${retention.averageDreamsPerUser.toFixed(2)}

## 🛠️ Technical
- **Interpretations:** ${technical.totalInterpretations}
- **Images Generated:** ${technical.totalImages}
- **Videos Generated:** ${technical.totalVideos}
- **Avg Cost per Dream:** $${technical.averageCostPerDream.toFixed(4)}

---
*Report generated by Dreamcatcher AI CRO Intelligence System.*
`;
}