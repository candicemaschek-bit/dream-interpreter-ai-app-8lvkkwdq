/**
 * Admin Task Item Component
 * Individual task card with actions and drag-and-drop support
 */

import { useState } from 'react'
import { AdminTask, AdminTaskItemProps } from '@/types/adminTask'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X, AlertCircle, Edit, Save, PlayCircle, Pause, GripVertical } from 'lucide-react'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'
import { updateTask } from '@/utils/taskOperations'
import toast from 'react-hot-toast'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const priorityConfig = {
  high: { label: 'High', color: 'bg-red-100 text-red-800', icon: '🔴' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  low: { label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' }
}

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  deferred: { label: 'Deferred', color: 'bg-orange-100 text-orange-800' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-500' }
}

function getDueDateStatus(dueDate: string): { label: string; className: string; isOverdue: boolean } {
  const today = new Date()
  const due = parseISO(dueDate)
  const daysUntil = differenceInDays(due, today)

  if (isPast(due)) {
    return { label: 'Overdue', className: 'text-red-600', isOverdue: true }
  } else if (daysUntil <= 3) {
    return { label: `Due in ${daysUntil} days`, className: 'text-orange-600', isOverdue: false }
  } else if (daysUntil <= 7) {
    return { label: `Due in ${daysUntil} days`, className: 'text-yellow-600', isOverdue: false }
  }
  return { label: `Due in ${daysUntil} days`, className: 'text-gray-600', isOverdue: false }
}

export function AdminTaskItem({
  task,
  onComplete,
  onDismiss,
  onUpdate,
  compact = false,
  isDraggable = false
}: AdminTaskItemProps & { isDraggable?: boolean }) {
  const [isHovering, setIsHovering] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    progress: task.progress
  })
  const [isSaving, setIsSaving] = useState(false)
  
  const priorityInfo = priorityConfig[task.priority]
  const statusInfo = statusConfig[task.status]
  const dueInfo = getDueDateStatus(task.dueDate)
  const isCompleted = task.status === 'completed'
  const isDismissed = task.status === 'dismissed'

  // Setup drag-and-drop for sortable item
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !isDraggable || isEditing || isCompleted || isDismissed
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete(task.id)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss(task.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditedTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      progress: task.progress
    })
    setIsEditing(false)
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!editedTask.title.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      await updateTask(task.id, editedTask)
      setIsEditing(false)
      toast.success('Task updated successfully')
      
      // Trigger parent refresh
      if (onComplete) {
        onComplete(task.id)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: AdminTask['status']) => {
    setIsSaving(true)
    try {
      await updateTask(task.id, { status: newStatus })
      toast.success(`Task moved to ${newStatus}`)
      
      // Trigger parent refresh
      if (onComplete) {
        onComplete(task.id)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    } finally {
      setIsSaving(false)
    }
  }

  if (compact) {
    return (
      <div
        className="p-2 border rounded-md hover:bg-accent/50 transition-colors"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">{priorityInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
            <div className="flex gap-1 flex-wrap mt-1">
              <Badge variant="secondary" className="text-xs">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          {isHovering && (
            <div className="flex gap-1">
              {!isCompleted && !isDismissed && (
                <>
                  <Button size="sm" variant="ghost" onClick={handleComplete} className="h-6 px-2">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-6 px-2">
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`task-item mb-6 transition-all duration-200 ${isCompleted || isDismissed ? 'opacity-60' : 'hover:shadow-lg'} ${isDragging ? 'sortable-dragging' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardContent className="p-6">
        {/* Header with title and priority */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {isDraggable && !isEditing && !isCompleted && !isDismissed && (
            <button
              className="drag-handle cursor-grab active:cursor-grabbing mt-1 touch-none hover:bg-accent/10 rounded p-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </button>
          )}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  className="font-bold"
                />
                <Textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={3}
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value as AdminTask['priority'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{priorityInfo.icon}</span>
                  <h3 className={`font-bold text-base ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 ml-8">{task.description}</p>
              </>
            )}
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        {/* Progress bar */}
        {task.status !== 'completed' && task.status !== 'dismissed' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Progress</span>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editedTask.progress}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-7 text-sm text-right"
                />
              ) : (
                <span className="text-sm font-bold text-primary">{task.progress}%</span>
              )}
            </div>
            <Progress value={isEditing ? editedTask.progress : task.progress} className="h-2.5" />
          </div>
        )}

        {/* Due date and tags */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {dueInfo.isOverdue && <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className={`text-sm font-semibold ${dueInfo.className}`}>
              {format(parseISO(task.dueDate), 'MMM dd')} • {dueInfo.label}
            </span>
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-2">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              {!isCompleted && !isDismissed && (
                <>
                  {task.status === 'todo' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatusChange('in-progress')}
                      disabled={isSaving}
                      className="text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Working
                    </Button>
                  )}
                  {task.status === 'in-progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('todo')}
                      disabled={isSaving}
                      className="text-sm"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                    className="text-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleComplete}
                    className="flex-1 text-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('deferred')}
                    disabled={isSaving}
                    className="text-sm"
                    title="Defer this task for later"
                  >
                    ⏰ Defer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDismiss}
                    className="flex-1 text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Dismiss
                  </Button>
                </>
              )}
              {isCompleted && (
                <Button size="sm" disabled className="flex-1 text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Completed
                </Button>
              )}
              {isDismissed && (
                <Button size="sm" disabled variant="outline" className="flex-1 text-sm">
                  Dismissed
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}