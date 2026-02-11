/**
 * Admin Tasks Page Component
 * Dedicated full-screen page for task management
 */

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdminTaskList } from '@/components/AdminTaskList'
import { SuggestionCapture } from '@/components/SuggestionCapture'
import { AITaskSuggestionsModal } from '@/components/AITaskSuggestionsModal'
import { ArrowLeft, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AdminTask } from '@/types/adminTask'
import { getAllTasks, createTask } from '@/utils/taskOperations'
import { generateTaskSuggestions, appendSuggestionsToDescription, AITaskSuggestionsResult } from '@/utils/aiTaskSuggestions'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function AdminTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [useAISuggestions, setUseAISuggestions] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<AITaskSuggestionsResult | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: new Date().toISOString().split('T')[0],
  })

  // Load tasks on mount
  const loadTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true)
      const allTasks = await getAllTasks()
      setTasks(allTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoadingTasks(false)
    }
  }, [])

  useEffect(() => {
    loadTasks().catch(console.error)
  }, [loadTasks])

  // Handle creating task - now shows preview modal first if AI suggestions enabled
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required')
      return
    }

    // If AI suggestions enabled, generate and show preview
    if (useAISuggestions && (newTask.title.trim() || newTask.description.trim())) {
      setIsGeneratingSuggestions(true)
      setIsPreviewModalOpen(true)

      try {
        const suggestions = await generateTaskSuggestions(
          newTask.title.trim(),
          newTask.description.trim() || 'No additional description provided',
          newTask.priority
        )
        setAiSuggestions(suggestions)
      } catch (error) {
        console.error('Error generating suggestions:', error)
        toast.error('Could not generate AI suggestions')
        setAiSuggestions(null)
      } finally {
        setIsGeneratingSuggestions(false)
      }
    } else {
      // No AI suggestions - create task directly
      await createTaskDirectly(newTask.description.trim())
    }
  }

  // Handle approval from preview modal
  const handleApproveSuggestions = async () => {
    if (!aiSuggestions) return

    const taskDescription = appendSuggestionsToDescription(newTask.description.trim(), aiSuggestions)
    await createTaskDirectly(taskDescription)
    setIsPreviewModalOpen(false)
    setAiSuggestions(null)
  }

  // Handle rejection from preview modal
  const handleRejectSuggestions = () => {
    setIsPreviewModalOpen(false)
    setAiSuggestions(null)
    // Keep the add task dialog open so user can edit
  }

  // Create task directly without preview
  const createTaskDirectly = async (description: string) => {
    try {
      const task = await createTask({
        title: newTask.title.trim(),
        description,
        priority: newTask.priority,
        status: 'todo',
        progress: 0,
        dueDate: newTask.dueDate,
      })

      setTasks((prev) => [task, ...prev])
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
      })
      setIsAddTaskOpen(false)
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-accent lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">📋 Tasks Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all admin tasks</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} className="hover:bg-accent">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-6xl mx-auto">
            {isLoadingTasks ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Add Task Button */}
                <div className="flex justify-end gap-2">
                  <SuggestionCapture triggerVariant="outline" onSuggestionSubmitted={loadTasks} />
                  <Button onClick={() => setIsAddTaskOpen(true)} className="bg-primary hover:bg-primary/90">
                    + Add New Task
                  </Button>
                </div>

                {/* Task List */}
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
                    <CardTitle className="text-lg">All Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AdminTaskList 
                      tasks={tasks} 
                      maxVisible={tasks.length} 
                      onTaskUpdate={() => loadTasks()} 
                      onUpdate={() => loadTasks()}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to the admin task list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                className="border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                className="border-primary/20 resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value as any }))}>
                  <SelectTrigger id="priority" className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="border-primary/20"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Checkbox
                id="ai-suggestions"
                checked={useAISuggestions}
                onCheckedChange={(checked) => setUseAISuggestions(checked === true)}
              />
              <Label htmlFor="ai-suggestions" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4 text-primary" />
                Generate AI-suggested steps to ensure nothing is missed
              </Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)} disabled={isGeneratingSuggestions}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90" disabled={isGeneratingSuggestions}>
              {isGeneratingSuggestions ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Task Settings</DialogTitle>
            <DialogDescription>Configure task management preferences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="bg-accent/5 border-primary/10">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Total Tasks: {tasks.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Active: {tasks.filter((t) => t.status !== 'completed' && t.status !== 'dismissed').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Completed: {tasks.filter((t) => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                💡 <strong>Tip:</strong> Tasks are automatically saved to the database. Use the Add Task button to create new tasks.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSettingsOpen(false)} className="bg-primary hover:bg-primary/90">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Preview Modal */}
      <AITaskSuggestionsModal
        open={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        suggestions={aiSuggestions}
        isLoading={isGeneratingSuggestions}
        onApprove={handleApproveSuggestions}
        onReject={handleRejectSuggestions}
        taskTitle={newTask.title}
      />
    </div>
  )
}
