/**
 * Admin Analytics Page
 * Detailed analytics and insights for platform usage
 */

import { useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminHeader } from '@/components/AdminHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, Image, Video } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { generateCROReport, formatReportToMarkdown } from '@/utils/croReportGenerator'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { toast } from 'sonner'

interface MonthlyData {
  month: string
  users: number
  dreams: number
  interpretations: number
  images: number
  videos: number
}

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [totalStats, setTotalStats] = useState({
    totalDreams: 0,
    totalInterpretations: 0,
    totalImages: 0,
    totalVideos: 0,
    totalCost: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Load data
      const dreams = await blink.db.dreams.list({ limit: 10000 })
      const usageSummaries = await blink.db.monthlyUsageSummary.list({ limit: 1000 })
      const profiles = await blink.db.userProfiles.list({ limit: 1000 })

      // Calculate totals
      const totalDreams = dreams.length
      const totalInterpretations = dreams.filter((d: any) => d.interpretation).length
      const totalImages = dreams.filter((d: any) => d.imageUrl).length
      const totalVideos = dreams.filter((d: any) => d.videoUrl).length
      const totalCost = usageSummaries.reduce((sum: number, s: any) => sum + (Number(s.totalCostUsd) || 0), 0)

      setTotalStats({
        totalDreams,
        totalInterpretations,
        totalImages,
        totalVideos,
        totalCost
      })

      // Group by month
      const monthlyMap = new Map<string, MonthlyData>()

      // Process dreams by month
      dreams.forEach((dream: any) => {
        const month = dream.createdAt.substring(0, 7) // YYYY-MM
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, {
            month,
            users: 0,
            dreams: 0,
            interpretations: 0,
            images: 0,
            videos: 0
          })
        }
        const data = monthlyMap.get(month)!
        data.dreams++
        if (dream.interpretation) data.interpretations++
        if (dream.imageUrl) data.images++
        if (dream.videoUrl) data.videos++
      })

      // Add user counts per month
      profiles.forEach((profile: any) => {
        const month = profile.createdAt.substring(0, 7)
        if (monthlyMap.has(month)) {
          const data = monthlyMap.get(month)!
          data.users++
        }
      })

      // Convert to array and sort
      const monthlyArray = Array.from(monthlyMap.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12) // Last 12 months

      setMonthlyData(monthlyArray)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-')
      const date = new Date(Number(year), Number(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } catch {
      return monthStr
    }
  }

  const handleExportCROReport = async () => {
    try {
      console.log('Export CRO Report button clicked');
      setExporting(true)
      toast.loading('Generating CRO report...', { id: 'cro-export' })
      
      // Generate the report with fresh data
      const data = await generateCROReport()
      console.log('Report data generated:', data);
      const markdown = formatReportToMarkdown(data)
      
      // Create and download the file
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `dreamcatcher-cro-report-${timestamp}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('CRO Report generated and downloaded successfully', { id: 'cro-export' })
    } catch (error) {
      console.error('Failed to export CRO report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to generate CRO report: ${errorMessage}`, { id: 'cro-export' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <AdminHeader 
        title="Analytics" 
        description="Platform usage insights" 
      >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCROReport} 
            disabled={exporting}
          >
            {exporting ? (
              <img src="/logo_new.png" alt="Loading..." className="w-4 h-4 mr-2 animate-spin opacity-50" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export CRO Report
          </Button>
      </AdminHeader>

      <ScrollArea className="flex-1">
        <div className="px-6 py-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <img src="/logo_new.png" alt="Loading..." className="w-8 h-8 animate-pulse mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Dreams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStats.totalDreams}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <img src="/logo_new.png" alt="Icon" className="w-3 h-3 mr-1 opacity-50" />
                    All time
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Interpretations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStats.totalInterpretations}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {((totalStats.totalInterpretations / totalStats.totalDreams) * 100).toFixed(1)}% of dreams
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Images Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStats.totalImages}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Image className="w-3 h-3 mr-1" />
                    {((totalStats.totalImages / totalStats.totalDreams) * 100).toFixed(1)}% of dreams
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Videos Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStats.totalVideos}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Video className="w-3 h-3 mr-1" />
                    {((totalStats.totalVideos / totalStats.totalDreams) * 100).toFixed(1)}% of dreams
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalStats.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">API usage</div>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>New users over time</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={formatMonth}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={formatMonth} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Dreams, interpretations, and content generation</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={formatMonth}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={formatMonth} />
                      <Legend />
                      <Bar dataKey="dreams" fill="#8B5CF6" name="Dreams" />
                      <Bar dataKey="interpretations" fill="#A855F7" name="Interpretations" />
                      <Bar dataKey="images" fill="#D8B4FE" name="Images" />
                      <Bar dataKey="videos" fill="#F3E8FF" name="Videos" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </ScrollArea>
    </>
  )
}
