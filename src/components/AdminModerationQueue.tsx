/**
 * Admin Moderation Queue
 * Displays pending reports for admin review and action
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { ScrollArea } from './ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { AlertTriangle, Shield } from 'lucide-react'
import { getReportsForQueue, getModerationStats } from '../utils/moderationService'
import { ModerationReviewPanel } from './ModerationReviewPanel'
import type { CommunityReport } from '../types/moderation'
import { getSeverityColor, getSeverityLabel, getReasonLabel } from '../types/moderation'
import { formatDistanceToNow } from 'date-fns'

export function AdminModerationQueue() {
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'reviewed' | 'all'>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadReports()
    loadStats()
  }, [filterStatus])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const data = await getReportsForQueue(
        filterStatus === 'all' ? 'all' : filterStatus,
        50,
        0
      )
      setReports(data)
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getModerationStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleActionTaken = async () => {
    // Reload reports and stats after action
    await loadReports()
    await loadStats()
  }

  if (isLoading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif mb-2">Moderation Queue</h1>
        <p className="text-muted-foreground">
          Review and take action on community dream reports
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {stats.pendingReports}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Pending Reports
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {stats.dreamsUnderReview}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Under Review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.dreamsHidden}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Hidden
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-700">
                {stats.dreamsRemoved}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Removed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {stats.totalReports}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total Reports
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Auto-Moderation Notice */}
        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Auto-Moderation Active</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Content with high severity scores (≥0.7) and multiple reports (≥5) is automatically hidden for review.
            AI analysis is triggered for edge cases with 3+ reports. Check audit trail for system actions.
          </AlertDescription>
        </Alert>
      </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Reports</h3>
            <Select
              value={filterStatus}
              onValueChange={(value: any) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] border rounded-lg p-4">
            {reports.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No reports to review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className={`cursor-pointer transition-all p-4 ${
                      selectedReport?.id === report.id
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`bg-${getSeverityColor(report.severity_auto)}-100 text-${getSeverityColor(report.severity_auto)}-700 border-${getSeverityColor(report.severity_auto)}-300`}
                      >
                        {getReasonLabel(report.report_reason)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(report.created_at), {
                          addSuffix: true
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">
                      {report.dream_title || 'Untitled Dream'}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {report.dream_is_anonymous && (
                        <Badge variant="secondary" className="text-xs">
                          Anonymous
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <ModerationReviewPanel
              report={selectedReport}
              onActionTaken={handleActionTaken}
            />
          ) : (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Shield className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a report to review
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
