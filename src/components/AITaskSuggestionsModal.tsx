/**
 * AI Task Suggestions Preview Modal
 * Shows AI-generated task suggestions before creating a task
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import type { AITaskSuggestionsResult } from '@/utils/aiTaskSuggestions'

interface AITaskSuggestionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: AITaskSuggestionsResult | null
  isLoading: boolean
  onApprove: () => void
  onReject: () => void
  taskTitle: string
}

export function AITaskSuggestionsModal({
  open,
  onOpenChange,
  suggestions,
  isLoading,
  onApprove,
  onReject,
  taskTitle,
}: AITaskSuggestionsModalProps) {
  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Task Suggestions
          </DialogTitle>
          <DialogDescription>
            Review AI-generated implementation steps for: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              <p className="text-muted-foreground">Generating AI suggestions...</p>
              <p className="text-sm text-muted-foreground">Analyzing task requirements and creating step-by-step plan</p>
            </div>
          ) : suggestions ? (
            <div className="space-y-6 py-4">
              {/* Summary Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-2">AI Reasoning</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{suggestions.reasoning}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        Total Estimated: <strong>{suggestions.totalEstimatedHours}h</strong>
                      </span>
                    </div>
                    <Badge variant="outline" className="border-primary/30">
                      {suggestions.suggestions.length} Steps
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span>Implementation Steps</span>
                  <Badge variant="secondary" className="text-xs">
                    Review carefully
                  </Badge>
                </h3>

                {suggestions.suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className={`transition-all hover:shadow-md ${getPriorityColor(suggestion.priority)}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <span>{getPriorityIcon(suggestion.priority)}</span>
                              {suggestion.step}
                            </h4>
                            <Badge
                              variant="outline"
                              className={
                                suggestion.priority === 'high'
                                  ? 'border-red-600 text-red-600'
                                  : suggestion.priority === 'medium'
                                  ? 'border-yellow-600 text-yellow-600'
                                  : 'border-green-600 text-green-600'
                              }
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.description}</p>
                          {suggestion.estimatedHours && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Estimated: {suggestion.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Info Box */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">What happens next?</p>
                      <p className="text-xs text-blue-700 mt-1">
                        These AI-generated steps will be appended to your task description. You can edit or refine them
                        after the task is created.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertTriangle className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">No suggestions available</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject} disabled={isLoading}>
            Go Back & Edit
          </Button>
          <Button onClick={onApprove} disabled={isLoading || !suggestions} className="bg-primary hover:bg-primary/90">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Task with Suggestions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
