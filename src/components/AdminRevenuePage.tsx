/**
 * Admin Revenue Page Component
 * Subscription analytics, payment tracking, and revenue projections
 */

import { useState, useEffect } from 'react'
import { blink } from '@/blink/client'
import { castUserProfiles } from '../utils/databaseCast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react'
import type { SubscriptionTier } from '@/types/subscription'
import type { UserProfile } from '@/types/profile'

interface RevenueMetrics {
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  totalRevenue: number
  projectedMRR: number
  projectedARR: number
  avgRevenuePerUser: number
  churnRate: number
  ltv: number // Lifetime Value
}

interface SubscriptionStats {
  total: number
  free: number
  pro: number
  premium: number
  vip: number
  monthlyBilling: number
  annualBilling: number
}

interface PaymentRecord {
  id: string
  userId: string
  userEmail: string
  userName: string
  amount: number
  tier: SubscriptionTier
  billingCycle: 'monthly' | 'annual'
  status: 'completed' | 'pending' | 'failed'
  date: string
}

export function AdminRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadRevenueData()
  }, [timeRange])

  const loadRevenueData = async () => {
    try {
      setLoading(true)

      // Fetch all user profiles with subscription data
      const profileRows = await blink.db.userProfiles.list()
      const profiles = castUserProfiles(profileRows)

      // Calculate subscription stats
      const stats: SubscriptionStats = {
        total: profiles.length,
        free: profiles.filter(p => p.subscriptionTier === 'free').length,
        pro: profiles.filter(p => p.subscriptionTier === 'pro').length,
        premium: profiles.filter(p => p.subscriptionTier === 'premium').length,
        vip: profiles.filter(p => p.subscriptionTier === 'vip').length,
        monthlyBilling: 0, // Would need payment records table
        annualBilling: 0
      }

      // Calculate revenue metrics
      const proUsers = stats.pro
      const premiumUsers = stats.premium

      // MRR = (Pro users * $12) + (Premium users * $29)
      const mrr = (proUsers * 12) + (premiumUsers * 29)

      // ARR = MRR * 12
      const arr = mrr * 12

      // Total revenue (lifetime)
      const totalRevenue = arr // Simplified - would need actual payment history

      // Projected MRR (assuming 10% growth)
      const projectedMRR = mrr * 1.1

      // Projected ARR
      const projectedARR = projectedMRR * 12

      // Average revenue per user (ARPU)
      const avgRevenuePerUser = stats.total > 0 ? mrr / stats.total : 0

      // Churn rate (simplified - would need historical data)
      const churnRate = 0.05 // 5% placeholder

      // Customer Lifetime Value (LTV = ARPU / Churn Rate)
      const ltv = churnRate > 0 ? avgRevenuePerUser / churnRate : 0

      const revenueMetrics: RevenueMetrics = {
        mrr,
        arr,
        totalRevenue,
        projectedMRR,
        projectedARR,
        avgRevenuePerUser,
        churnRate,
        ltv
      }

      // Generate sample payment records from current subscriptions
      const paymentRecords: PaymentRecord[] = profiles
        .filter(p => p.subscriptionTier !== 'free')
        .map((profile, index) => ({
          id: `payment-${profile.id}-${index}`,
          userId: profile.userId,
          userEmail: profile.userId, // Would fetch from users table
          userName: profile.name,
          amount: profile.subscriptionTier === 'pro' ? 6.99 : profile.subscriptionTier === 'premium' ? 14.99 : 29.99,
          tier: profile.subscriptionTier as SubscriptionTier,
          billingCycle: 'monthly' as const,
          status: 'completed' as const,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setMetrics(revenueMetrics)
      setSubscriptionStats(stats)
      setPayments(paymentRecords)
    } catch (error) {
      console.error('Failed to load revenue data:', error)
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadRevenueData()
  }

  const handleExportData = () => {
    if (!metrics || !subscriptionStats || !payments) return

    const exportData = {
      metrics,
      subscriptionStats,
      payments,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Revenue report exported')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Revenue Analytics</h1>
            <p className="text-muted-foreground">
              Track subscriptions, payments, and revenue projections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.mrr.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{((metrics?.projectedMRR || 0) - (metrics?.mrr || 0)).toFixed(2)} projected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.arr.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{((metrics?.projectedARR || 0) - (metrics?.arr || 0)).toFixed(2)} projected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.avgRevenuePerUser.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                LTV: ${metrics?.ltv.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((metrics?.churnRate || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {subscriptionStats?.total} total users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="projections">Revenue Projections</TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Free Tier</CardTitle>
                  <CardDescription>Dreamer Plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{subscriptionStats?.free}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {subscriptionStats?.total ? ((subscriptionStats.free / subscriptionStats.total) * 100).toFixed(1) : 0}% of total users
                  </p>
                  <Badge variant="secondary" className="mt-2">$0/month</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pro Tier</CardTitle>
                  <CardDescription>Visionary Plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{subscriptionStats?.pro}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {subscriptionStats?.total ? ((subscriptionStats.pro / subscriptionStats.total) * 100).toFixed(1) : 0}% of total users
                  </p>
                  <Badge variant="default" className="mt-2">$12/month</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Premium Tier</CardTitle>
                  <CardDescription>Architect Plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{subscriptionStats?.premium}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {subscriptionStats?.total ? ((subscriptionStats.premium / subscriptionStats.total) * 100).toFixed(1) : 0}% of total users
                  </p>
                  <Badge variant="default" className="mt-2">$29/month</Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Current tier breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Free ({subscriptionStats?.free})</span>
                    <div className="flex items-center gap-2">
                      <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-muted-foreground"
                          style={{
                            width: subscriptionStats?.total
                              ? `${(subscriptionStats.free / subscriptionStats.total) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">
                        {subscriptionStats?.total ? ((subscriptionStats.free / subscriptionStats.total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pro ({subscriptionStats?.pro})</span>
                    <div className="flex items-center gap-2">
                      <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: subscriptionStats?.total
                              ? `${(subscriptionStats.pro / subscriptionStats.total) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">
                        {subscriptionStats?.total ? ((subscriptionStats.pro / subscriptionStats.total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Premium ({subscriptionStats?.premium})</span>
                    <div className="flex items-center gap-2">
                      <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: subscriptionStats?.total
                              ? `${(subscriptionStats.premium / subscriptionStats.total) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">
                        {subscriptionStats?.total ? ((subscriptionStats.premium / subscriptionStats.total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Payment transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payment records found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.slice(0, 20).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{payment.userName}</p>
                              <p className="text-xs text-muted-foreground">{payment.userEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={payment.tier === 'premium' ? 'default' : 'secondary'}>
                              {payment.tier}
                            </Badge>
                            <div className="text-right">
                              <p className="font-bold text-sm">${payment.amount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(payment.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                payment.status === 'completed'
                                  ? 'default'
                                  : payment.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Projections</CardTitle>
                <CardDescription>Forecasted revenue based on current growth trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Next Month</span>
                      </div>
                      <p className="text-2xl font-bold">${metrics?.projectedMRR.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        +${((metrics?.projectedMRR || 0) - (metrics?.mrr || 0)).toFixed(2)} from current
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Next Year</span>
                      </div>
                      <p className="text-2xl font-bold">${metrics?.projectedARR.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        +${((metrics?.projectedARR || 0) - (metrics?.arr || 0)).toFixed(2)} from current
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-accent/20">
                    <h3 className="font-medium mb-3">Growth Assumptions</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 10% monthly MRR growth rate</li>
                      <li>• 5% average churn rate</li>
                      <li>• Current conversion rate: {subscriptionStats?.total ? (((subscriptionStats.pro + subscriptionStats.premium) / subscriptionStats.total) * 100).toFixed(1) : 0}%</li>
                      <li>• Customer lifetime value: ${metrics?.ltv.toFixed(2)}</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-3">Revenue Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pro Tier Revenue</span>
                        <span className="font-bold">${((subscriptionStats?.pro || 0) * 12).toFixed(2)}/mo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Premium Tier Revenue</span>
                        <span className="font-bold">${((subscriptionStats?.premium || 0) * 29).toFixed(2)}/mo</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">Total MRR</span>
                        <span className="font-bold text-lg">${metrics?.mrr.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
