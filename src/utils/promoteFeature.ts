import type { FeatureRequest } from '../types/featureRequest';
import type { AdminTask } from '../types/adminTask';
import { createTask, getAllTasks, calculateDueDate } from './taskOperations';
import { updateFeatureRequest } from './featureRequestOperations';

/**
 * Promote a feature request to an active admin task
 */
export async function promoteFeatureToTask(
  feature: FeatureRequest
): Promise<AdminTask> {
  // Get current tasks to determine next order index
  const existingTasks = await getAllTasks();
  const maxOrderIndex = existingTasks.length > 0 
    ? Math.max(...existingTasks.map(t => t.orderIndex))
    : 0;

  // Create task from feature
  // Map feature priority to task priority (urgent -> high)
  const taskPriority = feature.priority === 'urgent' ? 'high' : (feature.priority as any)

  const task = await createTask({
    title: feature.title,
    description: feature.description,
    priority: taskPriority,
    status: 'todo',
    progress: 0,
    dueDate: calculateDueDate(feature.estimatedHours),
    orderIndex: maxOrderIndex + 1,
    tags: [feature.category],
    promotedFromFeatureId: feature.id
  });

  // Update feature status to 'in-dev'
  await updateFeatureRequest(feature.id, {
    status: 'in-dev'
  });

  return task;
}
