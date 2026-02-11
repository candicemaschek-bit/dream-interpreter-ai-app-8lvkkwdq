/**
 * Suggestion Capture Component
 * Allows users to submit suggestions that get added to Admin Tasks
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Lightbulb } from 'lucide-react'
import { createTask, calculateDueDate } from '@/utils/taskOperations'
import toast from 'react-hot-toast'

interface SuggestionCaptureProps {
  triggerClassName?: string
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'link'
  onSuggestionSubmitted?: () => void
}

export function SuggestionCapture({
  triggerClassName,
  triggerVariant = 'outline',
  onSuggestionSubmitted
}: SuggestionCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState({
    title: '',
    description: '',
    category: 'feature' as 'feature' | 'bug' | 'improvement' | 'documentation',
    estimatedHours: 4
  })

  const handleSubmit = async () => {
    if (!suggestion.title.trim()) {
      toast.error('Suggestion title is required')
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate priority based on category
      const priorityMap = {
        bug: 'high' as const,
        feature: 'medium' as const,
        improvement: 'medium' as const,
        documentation: 'low' as const
      }

      // Create task from suggestion
      await createTask({
        title: suggestion.title,
        description: `${suggestion.description}\n\n**Category:** ${suggestion.category}\n**Estimated Hours:** ${suggestion.estimatedHours}h`,
        priority: priorityMap[suggestion.category],
        status: 'todo',
        progress: 0,
        dueDate: calculateDueDate(suggestion.estimatedHours),
        orderIndex: Date.now(),
        tags: ['suggestion', suggestion.category]
      })

      toast.success('Suggestion submitted successfully!')
      
      // Reset form
      setSuggestion({
        title: '',
        description: '',
        category: 'feature',
        estimatedHours: 4
      })
      
      setIsOpen(false)
      
      // Notify parent
      if (onSuggestionSubmitted) {
        onSuggestionSubmitted()
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit suggestion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Suggest Improvement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>💡 Submit a Suggestion</DialogTitle>
          <DialogDescription>
            Your suggestion will be added to the Admin Tasks for review and implementation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suggestion-title">Title *</Label>
            <Input
              id="suggestion-title"
              value={suggestion.title}
              onChange={(e) => setSuggestion(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief title for your suggestion"
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion-description">Description</Label>
            <Textarea
              id="suggestion-description"
              value={suggestion.description}
              onChange={(e) => setSuggestion(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your suggestion..."
              className="border-primary/20 resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-category">Category</Label>
              <Select
                value={suggestion.category}
                onValueChange={(value) => setSuggestion(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger id="suggestion-category" className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">✨ New Feature</SelectItem>
                  <SelectItem value="bug">🐛 Bug Fix</SelectItem>
                  <SelectItem value="improvement">🚀 Improvement</SelectItem>
                  <SelectItem value="documentation">📝 Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-hours">Est. Hours</Label>
              <Input
                id="suggestion-hours"
                type="number"
                min="1"
                max="100"
                value={suggestion.estimatedHours}
                onChange={(e) => setSuggestion(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 4 }))}
                className="border-primary/20"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 <strong>Tip:</strong> Your suggestion will be added to the Admin Tasks list with appropriate priority and due date.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
