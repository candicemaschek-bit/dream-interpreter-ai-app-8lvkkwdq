/**
 * Admin Task List Component
 * Displays living task list with real-time updates and drag-and-drop reordering
 */

import { useState, useEffect, useCallback } from 'react'
import { AdminTask, AdminTaskListProps } from '@/types/adminTask'
import { AdminTaskItem } from '@/components/AdminTaskItem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { getAllTasks, migrateTasksToDatabase, updateTask } from '@/utils/taskOperations'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import toast from 'react-hot-toast'

// New props interface to support external data
interface AdminTaskListPropsExtended extends Omit<AdminTaskListProps, 'tasks'> {
  tasks?: AdminTask[];
  onUpdate?: () => void;
}

export function AdminTaskList({
  tasks: externalTasks,
  maxVisible = 3,
  allowDismiss = true,
  allowReorder = false,
  compact = false,
  onTaskUpdate,
  onUpdate
}: AdminTaskListPropsExtended) {
  const [tasks, setTasks] = useState<AdminTask[]>(externalTasks || [])
  const [isCollapsed, setIsCollapsed] = useLocalStorage('admin-task-list-collapsed', false)
  const [isLoading, setIsLoading] = useState(!externalTasks)
  const [showAllTasks, setShowAllTasks] = useState(false)

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load tasks on mount only if not provided externally
  useEffect(() => {
    if (externalTasks) {
      setTasks(externalTasks)
      return
    }

    const loadTasks = async () => {
      try {
        setIsLoading(true)
        // Migrate from JSON to database on first load
        await migrateTasksToDatabase()
        // Fetch from database
        const dbTasks = await getAllTasks()
        setTasks(dbTasks)
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [externalTasks])

  // Handle task completion
  const handleCompleteTask = useCallback(async (taskId: string, _task?: AdminTask) => {
    try {
      // Update in database first
      await updateTask(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        progress: 100
      })
      
      // Then update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'completed',
                completedAt: new Date().toISOString(),
                progress: 100,
                updatedAt: new Date().toISOString()
              }
            : task
        )
      )
      
      // Trigger parent refresh if callback provided
      if (onUpdate) {
        onUpdate()
      }
      
      toast.success('Task completed!')
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task')
    }
  }, [onUpdate])

  // Handle task dismissal
  const handleDismissTask = useCallback(async (taskId: string) => {
    try {
      // Update in database first
      await updateTask(taskId, {
        status: 'dismissed'
      })
      
      // Then update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'dismissed',
                updatedAt: new Date().toISOString()
              }
            : task
        )
      )
      
      // Trigger parent refresh if callback provided
      if (onUpdate) {
        onUpdate()
      }
      
      toast.success('Task dismissed')
    } catch (error) {
      console.error('Error dismissing task:', error)
      toast.error('Failed to dismiss task')
    }
  }, [onUpdate])

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id)
    const newIndex = tasks.findIndex((task) => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Optimistically update UI
    const newTasks = arrayMove(tasks, oldIndex, newIndex)
    setTasks(newTasks)

    // Update order_index in database for all affected tasks
    try {
      // Update all tasks with new order indices
      await Promise.all(
        newTasks.map((task, index) =>
          updateTask(task.id, { orderIndex: index })
        )
      )
      toast.success('Task order updated')

      // Trigger parent refresh if callback provided
      if (onTaskUpdate && newTasks[newIndex]) {
        onTaskUpdate(newTasks[newIndex])
      }
    } catch (error) {
      console.error('Error updating task order:', error)
      toast.error('Failed to save task order')
      // Revert on error
      setTasks(tasks)
    }
  }

  // Filter tasks for display
  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'dismissed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const visibleTasks = showAllTasks ? activeTasks : activeTasks.slice(0, maxVisible)

  // Calculate stats
  const completionPercentage =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">🎯 Living Task List</h4>
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
            {completedTasks.length}/{tasks.length}
          </span>
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {visibleTasks.map((task) => (
            <AdminTaskItem
              key={task.id}
              task={task}
              onComplete={handleCompleteTask}
              onDismiss={handleDismissTask}
              compact
            />
          ))}
          {activeTasks.length > maxVisible && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              +{activeTasks.length - maxVisible} more tasks
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">🎯 Living Task List</CardTitle>
            <CardDescription>
              {completedTasks.length}/{tasks.length} tasks completed ({completionPercentage}%)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">All tasks completed! 🎉</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px] pr-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={visibleTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {visibleTasks.map((task) => (
                        <AdminTaskItem
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                          onDismiss={handleDismissTask}
                          onUpdate={onUpdate}
                          isDraggable={true}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>

              {activeTasks.length > maxVisible && !showAllTasks && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setShowAllTasks(true)}
                  >
                    View All {activeTasks.length} Tasks
                  </Button>
                </div>
              )}

              {showAllTasks && activeTasks.length > maxVisible && (
                <div className="border-t pt-3 mt-3">
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setShowAllTasks(false)}
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}