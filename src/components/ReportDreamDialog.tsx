/**
 * Report Dream Dialog
 * Allows users to report inappropriate community dreams
 * Reporter identity is protected via anonymization
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Shield, AlertCircle } from 'lucide-react'
import { reportDream } from '../utils/reportingService'
import type { ReportReason } from '../types/moderation'
import { REPORT_REASON_LABELS } from '../types/moderation'
import toast from 'react-hot-toast'

interface ReportDreamDialogProps {
  dreamId: string
  dreamTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ReportDreamDialog({
  dreamId,
  dreamTitle,
  isOpen,
  onClose
}: ReportDreamDialogProps) {
  const [reason, setReason] = useState<ReportReason>('other')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await reportDream(dreamId, reason, details || undefined)

      if (result.success) {
        toast.success('Report submitted. Our team will review it.')
        onClose()
        // Reset form
        setReason('other')
        setDetails('')
      } else {
        toast.error(result.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      // Reset form when closing
      setReason('other')
      setDetails('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Dream</DialogTitle>
          <DialogDescription>
            Help us keep Dreamstream safe and respectful for all users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Dream being reported */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Reporting:</p>
            <p className="font-medium text-xs line-clamp-2">{dreamTitle}</p>
          </div>

          {/* Report reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="font-medium text-sm">
              Why are you reporting this?
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger id="reason" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-sm">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional details */}
          <div className="space-y-1.5">
            <Label htmlFor="details" className="font-medium text-sm">
              Additional details (optional)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="What specifically concerns you about this dream?"
              rows={3}
              className="resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}/500 characters
            </p>
          </div>

          {/* Privacy notice */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3">
            <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-300 ml-0.5">
              <strong>Your report is confidential.</strong> The author won't know who reported this.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            size="sm"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="gap-2 w-full sm:w-auto"
            size="sm"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
