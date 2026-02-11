/**
 * Moderation Review Panel
 * Shows detailed report information and allows admins to take action
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Skeleton } from './ui/skeleton'
import { AlertTriangle, CheckCircle2, XCircle, Heart } from 'lucide-react'
import { takeModerationAction, getDreamReportDetails } from '../utils/moderationService'
import type { ModerationActionType } from '../types/moderation'
import {
  getReasonLabel,
  getActionLabel,
  getSeverityLabel,
  getSeverityColor
} from '../types/moderation'
import toast from 'react-hot-toast'

interface ModerationReviewPanelProps {
  report: any
  onActionTaken: () => void
}

export function ModerationReviewPanel({
  report,
  onActionTaken
}: ModerationReviewPanelProps) {
  const [actionType, setActionType] = useState<ModerationActionType>('dismiss_report')
  const [actionReason, setActionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relatedReports, setRelatedReports] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)

  useEffect(() => {
    loadDetails()
  }, [report.id])

  const loadDetails = async () => {
    setIsLoadingDetails(true)
    try {
      const reports = await getDreamReportDetails(report.dream_id)
      setRelatedReports(reports)
    } catch (error) {
      console.error('Error loading report details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleTakeAction = async () => {
    if (!actionReason.trim()) {
      toast.error('Please provide a reason for this action')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await takeModerationAction(
        report.dream_id,
        actionType,
        actionReason,
        [report.id]
      )

      if (result.success) {
        toast.success('Moderation action applied successfully')
        setActionReason('')
        onActionTaken()
      } else {
        toast.error(result.error || 'Failed to apply moderation action')
      }
    } catch (error) {
      console.error('Error applying moderation action:', error)
      toast.error('Failed to apply moderation action')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingDetails) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Report Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ID: {report.id}
              </p>
            </div>
            <Badge
              variant={
                report.status === 'pending'
                  ? 'destructive'
                  : report.status === 'reviewed'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {report.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Badge variant="outline" className="mt-1">
                {getReasonLabel(report.report_reason)}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Severity</Label>
              <Badge
                variant="outline"
                className={`mt-1 bg-${getSeverityColor(report.severity_auto)}-100`}
              >
                {getSeverityLabel(report.severity_auto)}
              </Badge>
            </div>
          </div>

          {/* Report Details */}
          {report.report_details && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Reporter's Details
              </Label>
              <p className="text-sm mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                {report.report_details}
              </p>
            </div>
          )}

          {/* Reporter Hash (anonymized) */}
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-300">
              Reporter Anonymity Protected
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-400 text-sm">
              Reporter ID is hashed: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{report.reporter_id_hash.substring(0, 16)}...</code>
            </AlertDescription>
          </Alert>

          {/* Auto-Moderation Indicator */}
          {report.dream_status === 'hidden' && report.report_count >= 3 && (
            <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-900 dark:text-purple-300">
                Auto-Moderation May Be Active
              </AlertTitle>
              <AlertDescription className="text-purple-800 dark:text-purple-400 text-sm">
                This dream has {report.report_count} reports and was hidden. Check audit trail to see if auto-moderation was triggered.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dream Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dream Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <p className="font-medium mt-1">{report.dream_title}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border max-h-32 overflow-y-auto">
              {report.dream_description}
            </p>
          </div>

          {report.dream_image_url && (
            <div>
              <Label className="text-xs text-muted-foreground">Image</Label>
              <img
                src={report.dream_image_url}
                alt={report.dream_title}
                className="mt-2 rounded-lg max-h-48 w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant="outline" className="mt-1">
                {report.dream_status}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Author</Label>
              <p className="text-sm mt-1">
                {report.dream_is_anonymous ? 'Anonymous' : 'Identified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Reports */}
      {relatedReports.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Related Reports ({relatedReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {relatedReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between p-2 rounded border"
                >
                  <div className="flex-1">
                    <p className="text-sm">
                      {getReasonLabel(r.report_reason)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2 flex-shrink-0"
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Action */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Take Moderation Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Type */}
          <div className="space-y-2">
            <Label htmlFor="action-type" className="font-medium">
              Action to Take
            </Label>
            <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <SelectTrigger id="action-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dismiss_report">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Dismiss Report (no violation)
                  </span>
                </SelectItem>
                <SelectItem value="warn_author">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Warn Author Only
                  </span>
                </SelectItem>
                <SelectItem value="hide">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-orange-600" />
                    Hide from Feed
                  </span>
                </SelectItem>
                <SelectItem value="remove">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Remove Permanently
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {actionType === 'dismiss_report' &&
                'Report will be dismissed, dream remains visible'}
              {actionType === 'warn_author' &&
                'Author will be notified, dream remains visible'}
              {actionType === 'hide' &&
                'Dream hidden from feed, visible to author only'}
              {actionType === 'remove' &&
                'Dream permanently removed from Dreamstream'}
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-medium">
              Reason for Decision *
            </Label>
            <Textarea
              id="reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Explain your decision for the audit trail..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Required for audit trail. Will not be shared with reporter or author.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleTakeAction}
            disabled={isSubmitting || !actionReason.trim()}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Applying Action...
              </>
            ) : (
              `${getActionLabel(actionType)}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
