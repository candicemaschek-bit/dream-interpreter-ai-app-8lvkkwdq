/**
 * Admin Task Management Types
 * Defines types for the living task list feature
 */

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'deferred' | 'dismissed'

export interface AdminTask {
  id: string
  userId?: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  progress: number // 0-100
  assignedTo?: string // Admin user ID (future feature)
  dueDate: string // ISO date string
  completedAt?: string // ISO timestamp when marked complete
  orderIndex: number // For sorting/reordering
  tags?: string[] // e.g., ['database', 'ui', 'api']
  promotedFromFeatureId?: string // Optional link to feature request that promoted this task
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface AdminTaskListProps {
  maxVisible?: number // Default: 3 (show top 3 tasks)
  allowDismiss?: boolean // Default: true
  allowReorder?: boolean // Default: false (future feature)
  compact?: boolean // Default: false (for mobile)
  onTaskUpdate?: (task: AdminTask) => void // Callback when task changes
  onUpdate?: () => void // Generic callback for list refresh
}

export interface AdminTaskItemProps {
  task: AdminTask
  onComplete: (taskId: string) => void
  onDismiss: (taskId: string) => void
  onUpdate?: () => void
  compact?: boolean
}
