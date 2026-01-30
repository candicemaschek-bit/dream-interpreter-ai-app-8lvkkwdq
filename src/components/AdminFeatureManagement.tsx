import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Lightbulb, Search } from 'lucide-react';
import { AdminHeader } from './AdminHeader';
import { AdminFeatureList } from './AdminFeatureList';
import { AdminTaskList } from './AdminTaskList';
import { CaptureRecommendationModal } from './CaptureRecommendationModal';
import { getAllFeatureRequests } from '../utils/featureRequestOperations';
import { getAllTasks, migrateTasksToDatabase } from '../utils/taskOperations';
import type { FeatureRequest, FeatureCategory, FeaturePriority } from '../types/featureRequest';
import type { AdminTask } from '../types/adminTask';

export function AdminFeatureManagement() {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FeatureCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<FeaturePriority | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // Force migrate tasks to ensure DB matches JSON data as requested
      await migrateTasksToDatabase(true);
      
      const [featuresData, tasksData] = await Promise.all([
        getAllFeatureRequests(),
        getAllTasks()
      ]);
      
      setFeatures(featuresData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter features
  const filterFeatures = (features: FeatureRequest[]) => {
    return features.filter(feature => {
      const matchesSearch = !searchQuery || 
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || feature.priority === priorityFilter;
      
      return matchesSearch && matchesCategory && matchesPriority;
    });
  };

  // Categorize features and tasks based on status
  // Future Ideas: early stage features + deferred tasks
  const deferredTasks = tasks.filter(t => t.status === 'deferred');
  const futureFeatures = filterFeatures(
    features.filter(f => ['idea', 'researching', 'designed', 'planned'].includes(f.status))
  );
  
  // Active Tasks: todo and in-progress (NOT deferred)
  const activeTasks = tasks.filter(t => ['todo', 'in-progress'].includes(t.status));
  
  // Completed Items: launched features + completed tasks
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completedItems = [
    ...completedTasks,
    ...filterFeatures(features.filter(f => f.status === 'launched'))
  ].sort((a, b) => {
    const aDate = 'completedAt' in a ? a.completedAt : a.updatedAt;
    const bDate = 'completedAt' in b ? b.completedAt : b.updatedAt;
    return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AdminHeader
        title="Feature Tracker"
        description="Manage AI recommendations, plan features, and track tasks"
      >
        <Button onClick={() => setCaptureModalOpen(true)} size="sm">
          <Lightbulb className="h-4 w-4 mr-2" />
          Capture Recommendation
        </Button>
      </AdminHeader>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ai">AI Features</SelectItem>
            <SelectItem value="ui">User Interface</SelectItem>
            <SelectItem value="gamification">Gamification</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="admin">Admin Tools</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="dream-analysis">Dream Analysis</SelectItem>
            <SelectItem value="video-generation">Video Generation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="future" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="future" className="flex items-center gap-2">
            <span>🔮</span>
            <span>Future Ideas</span>
            <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {futureFeatures.length + deferredTasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <span>🎯</span>
            <span>Active Tasks</span>
            <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <span>✅</span>
            <span>Completed</span>
            <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {completedItems.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="future" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Future Ideas</strong> are features in early stages (idea, researching, designed, planned) and tasks deferred for later.
              When a feature reaches "planned" status, you can promote it to an active task.
            </p>
          </div>
          
          {/* Show deferred tasks first */}
          {deferredTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span>⏰</span> Deferred Tasks
              </h3>
              {deferredTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg bg-orange-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⏰</span>
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Priority: {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Future features */}
          {futureFeatures.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span>🔮</span> Future Features
              </h3>
              <AdminFeatureList features={futureFeatures} onUpdate={loadData} />
            </div>
          )}
          
          {futureFeatures.length === 0 && deferredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No future ideas or deferred tasks yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Active Tasks</strong> are features that have been promoted from "planned" status.
              These are the current work items in progress.
            </p>
          </div>
          <AdminTaskList tasks={activeTasks} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="complete" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Completed</strong> includes both launched features and completed tasks.
              These items have been successfully shipped to production.
            </p>
          </div>
          
          <div className="space-y-4">
            {completedItems.map((item) => {
              if ('requestedBy' in item) {
                // It's a feature
                return (
                  <div key={item.id} className="p-4 border rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✅</span>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Launched: {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              } else {
                // It's a task
                return (
                  <div key={item.id} className="p-4 border rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✅</span>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Completed: {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              }
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Capture Modal */}
      <CaptureRecommendationModal
        open={captureModalOpen}
        onOpenChange={setCaptureModalOpen}
        onSuccess={loadData}
        requestedBy="Blink AI Assistant"
      />
      </div>
    </div>
  );
}
