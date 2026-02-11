import { blink } from '../blink/client';
import type { AdminTask } from '../types/adminTask';
import adminTasksData from '../data/adminTasks.json';
import { isCurrentUserAdmin } from './roleChecking';

const db = blink.db;

/**
 * Check if user has permission to perform task operations
 */
async function checkTaskPermission(): Promise<void> {
  const hasPermission = await isCurrentUserAdmin();
  if (!hasPermission) {
    throw new Error('Unauthorized: Admin access required for task operations');
  }
}

/**
 * Migrate JSON tasks to database if not already migrated
 * Now supports upserting to ensure DB reflects JSON data
 */
export async function migrateTasksToDatabase(force = false): Promise<void> {
  try {
    // Check if tasks already exist in database
    const existingTasks = await db.adminTasks.list({ limit: 1 });
    
    // If no tasks exist or force refresh is requested
    if (existingTasks.length === 0 || force) {
      // Get current user for ownership
      const user = await blink.auth.me();
      
      // Migrate from JSON
      const tasks = adminTasksData.tasks as AdminTask[];
      
      console.log(`Migrating ${tasks.length} tasks to database (Force: ${force})...`);
      
      for (const task of tasks) {
        // Check if task exists to decide between create or update (upsert logic)
        const existing = await db.adminTasks.exists({ where: { id: task.id } });
        
        const taskData = {
          id: task.id,
          userId: user?.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          progress: task.progress || 0,
          dueDate: task.dueDate,
          orderIndex: task.orderIndex,
          tags: task.tags ? JSON.stringify(task.tags) : null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          // Don't overwrite completedAt if it exists in DB, unless we are resetting
          // For now, we'll just use the JSON value if provided, or null
          completedAt: null,
          promotedFromFeatureId: null
        };

        if (existing) {
             // For existing tasks, we might want to be careful not to overwrite user changes
             // But if the goal is "refresh data", we should update
             // However, let's only update if force is true, OR if we strictly want JSON to be master
             // Given the user request "Refresh adminpanel data to reflect the data in the db. There is a mismatch."
             // It implies DB should be the source. But if DB is missing data from JSON, we should add it.
             
             // Let's standard upsert
             await db.adminTasks.update(task.id, taskData);
        } else {
             await db.adminTasks.create(taskData);
        }
      }
      
      console.log('Successfully synced tasks to database');
    }
  } catch (error) {
    console.error('Error migrating tasks:', error);
  }
}

/**
 * Get all admin tasks from database
 */
export async function getAllTasks(): Promise<AdminTask[]> {
  const records = await db.adminTasks.list({
    orderBy: { orderIndex: 'asc' }
  });

  return records.map(record => ({
    id: record.id,
    userId: record.userId,
    title: record.title,
    description: record.description,
    priority: record.priority as AdminTask['priority'],
    status: record.status as AdminTask['status'],
    progress: record.progress || 0,
    dueDate: record.dueDate,
    orderIndex: record.orderIndex,
    tags: record.tags ? JSON.parse(record.tags) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || undefined,
    promotedFromFeatureId: record.promotedFromFeatureId || undefined
  }));
}

/**
 * Get task by ID
 */
export async function getTaskById(id: string): Promise<AdminTask | null> {
  const records = await db.adminTasks.list({
    where: { id }
  });

  if (records.length === 0) return null;

  const record = records[0];
  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    description: record.description,
    priority: record.priority as AdminTask['priority'],
    status: record.status as AdminTask['status'],
    progress: record.progress || 0,
    dueDate: record.dueDate,
    orderIndex: record.orderIndex,
    tags: record.tags ? JSON.parse(record.tags) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || undefined,
    promotedFromFeatureId: record.promotedFromFeatureId || undefined
  };
}

/**
 * Create a new admin task
 */
export async function createTask(
  task: Partial<Omit<AdminTask, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AdminTask> {
  // Check permission
  await checkTaskPermission();
  const user = await blink.auth.me();
  
  const now = new Date().toISOString();
  const id = `task_${Date.now()}`;
  
  // Get the highest order index
  const allTasks = await db.adminTasks.list({ orderBy: { orderIndex: 'desc' }, limit: 1 });
  const nextOrderIndex = allTasks.length > 0 ? (Number(allTasks[0].orderIndex) || 0) + 1 : 0;

  const newTask: AdminTask = {
    id,
    userId: user?.id,
    title: task.title || 'Untitled Task',
    description: task.description || '',
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    progress: task.progress || 0,
    dueDate: task.dueDate || new Date().toISOString().split('T')[0],
    orderIndex: task.orderIndex !== undefined ? task.orderIndex : nextOrderIndex,
    tags: task.tags || [],
    createdAt: now,
    updatedAt: now,
    completedAt: undefined,
    promotedFromFeatureId: task.promotedFromFeatureId
  };

  await db.adminTasks.create({
    id: newTask.id,
    userId: newTask.userId,
    title: newTask.title,
    description: newTask.description,
    priority: newTask.priority,
    status: newTask.status,
    progress: newTask.progress,
    dueDate: newTask.dueDate,
    orderIndex: newTask.orderIndex,
    tags: newTask.tags && newTask.tags.length > 0 ? JSON.stringify(newTask.tags) : null,
    createdAt: newTask.createdAt,
    updatedAt: newTask.updatedAt,
    completedAt: null,
    promotedFromFeatureId: newTask.promotedFromFeatureId || null
  });

  return newTask;
}

/**
 * Update an admin task
 */
export async function updateTask(
  id: string,
  updates: Partial<Omit<AdminTask, 'id' | 'createdAt'>>
): Promise<AdminTask | null> {
  // Check permission
  await checkTaskPermission();
  
  const existing = await getTaskById(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    updatedAt: now
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    if (updates.status === 'completed' && !updates.completedAt) {
      updateData.completedAt = now;
    }
  }
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
  if (updates.orderIndex !== undefined) updateData.orderIndex = updates.orderIndex;
  if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
  if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;

  await db.adminTasks.update(id, updateData);

  return getTaskById(id);
}

/**
 * Delete an admin task
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    // Check permission
    await checkTaskPermission();
    
    await db.adminTasks.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}

/**
 * Calculate due date based on estimated hours
 */
export function calculateDueDate(estimatedHours?: number): string {
  const hoursPerDay = 4; // Assuming 4 productive hours per day
  const daysNeeded = estimatedHours ? Math.ceil(estimatedHours / hoursPerDay) : 7;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysNeeded);
  
  return dueDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}