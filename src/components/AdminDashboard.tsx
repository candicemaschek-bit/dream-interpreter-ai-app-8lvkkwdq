/**
 * Main Admin Dashboard
 * Displays key metrics and platform overview for administrators
 */

import { useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminHeader } from '@/components/AdminHeader'
import { SuggestionCapture } from '@/components/SuggestionCapture'
import { GitHubConnectionStatusComponent } from '@/components/GitHubConnectionStatus'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { migrateTasksToDatabase } from '@/utils/taskOperations'

interface AdminDashboardProps {
  hideHeader?: boolean
}

export function AdminDashboard({ hideHeader = false }: AdminDashboardProps = {}) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDreams: 0,
    totalCost: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [usersByTier, setUsersByTier] = useState<Array<{ tier: string; count: number }>>([]);
  const [accountStatuses, setAccountStatuses] = useState<Array<{ status: string; count: number }>>([]);

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Ensure tasks are synced from JSON (only if empty)
      await migrateTasksToDatabase(false)

      // Load all users and profiles
      const users = await blink.db.users.list({ limit: 1000 })
      const profiles = await blink.db.userProfiles.list({ limit: 1000 })
      const dreams = await blink.db.dreams.list({ limit: 10000 })
      const monthlySummaries = await blink.db.monthlyUsageSummary.list({ limit: 1000 })
      const transactions = await blink.db.paymentTransactions.list({
        where: { status: 'completed' },
        limit: 1000
      })

      // Calculate stats
      const totalUsers = users.length
      const currentMonth = new Date().toISOString().slice(0, 7)
      const activeThisMonth = profiles.filter((p: any) => {
        const summary = monthlySummaries.find(
          (s: any) => s.userId === p.userId && s.yearMonth === currentMonth
        )
        return summary && Number(summary.totalOperations) > 0
      }).length

      // Revenue calculation
      const monthlyRevenue = transactions
        .filter((t: any) => t.createdAt.startsWith(currentMonth))
        .reduce((sum: number, t: any) => sum + (Number(t.amountUsd) || 0), 0)

      // Total cost (placeholder - would need subscription tracking)
      const totalCost = monthlySummaries.reduce((sum: number, s: any) => sum + (Number(s.totalCostUsd) || 0), 0)

      // Group users by tier
      const tierGroups = profiles.reduce((acc: any, p: any) => {
        const tier = p.subscriptionTier || 'free'
        const existing = acc.find((g: any) => g.tier === tier)
        if (existing) {
          existing.count++
        } else {
          acc.push({ tier, count: 1 })
        }
        return acc
      }, [])

      // Group users by account status
      const statusGroups = profiles.reduce((acc: any, p: any) => {
        const status = p.accountStatus || 'active'
        const existing = acc.find((g: any) => g.status === status)
        if (existing) {
          existing.count++
        } else {
          acc.push({ status, count: 1 })
        }
        return acc
      }, [])

      setStats({
        totalUsers,
        activeUsers: activeThisMonth,
        totalDreams: dreams.length,
        totalCost,
        monthlyRevenue
      })

      setUsersByTier(tierGroups)
      setAccountStatuses(statusGroups)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#8B5CF6', '#A855F7', '#D8B4FE', '#F3E8FF']

  return (
    <>
      {!hideHeader && (
        <AdminHeader title="Admin Dashboard" description="DreamCatcher AI Platform Overview">
          <SuggestionCapture triggerVariant="outline" onSuggestionSubmitted={loadDashboardData} />
        </AdminHeader>
      )}

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <img src="/logo_new.png" alt="Loading..." className="w-8 h-8 animate-pulse mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">All registered users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Dreams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDreams}</div>
                    <p className="text-xs text-muted-foreground mt-1">Analyzed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">API usage</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Subscriptions</p>
                  </CardContent>
                </Card>
              </div>

              {/* GitHub Connection Status */}
              <div className="mb-6">
                <GitHubConnectionStatusComponent
                  username="ShadowWalker2014"
                  repoName="dream-interpreter-ai-app-8lvkkwdq"
                  owner="candicemaschek-bit"
                  ownerType="User"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Users by Tier Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Subscription Tier</CardTitle>
                    <CardDescription>Distribution of subscription tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersByTier.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={usersByTier}
                            dataKey="count"
                            nameKey="tier"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {usersByTier.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No data available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Status Distribution</CardTitle>
                    <CardDescription>User account statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {accountStatuses.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={accountStatuses}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Commonly used admin operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                      <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <p className="text-sm text-muted-foreground col-span-full">
                          Use the sidebar to navigate to different admin sections.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="recent" className="space-y-4">
                      <p className="text-sm text-muted-foreground">Recent activity log coming soon...</p>
                    </TabsContent>

                    <TabsContent value="alerts" className="space-y-4">
                      <p className="text-sm text-muted-foreground">No critical alerts at this time.</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
