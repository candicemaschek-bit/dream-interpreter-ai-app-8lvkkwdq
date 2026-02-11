import { blink } from '../blink/client';
import type { 
  FeatureRequest, 
  CreateFeatureRequestInput, 
  UpdateFeatureRequestInput 
} from '../types/featureRequest';

// Type-safe DB reference
const db = blink.db;

/**
 * Create a new feature request
 */
export async function createFeatureRequest(
  input: CreateFeatureRequestInput
): Promise<FeatureRequest> {
  const now = new Date().toISOString();
  const id = `feat_${Date.now()}`;

  const feature: FeatureRequest = {
    id,
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status || 'idea',
    priority: input.priority || 'medium',
    requestedBy: input.requestedBy,
    requestedByType: input.requestedByType,
    targetRelease: input.targetRelease,
    estimatedHours: input.estimatedHours,
    notes: input.notes,
    technicalDetails: input.technicalDetails,
    dependencies: input.dependencies,
    createdAt: now,
    updatedAt: now,
    assignedTo: input.assignedTo,
    votes: 0
  };

  await db.featureRequests.create({
    id: feature.id,
    title: feature.title,
    description: feature.description,
    category: feature.category,
    status: feature.status,
    priority: feature.priority,
    requestedBy: feature.requestedBy,
    requestedByType: feature.requestedByType,
    targetRelease: feature.targetRelease || null,
    estimatedHours: feature.estimatedHours || null,
    notes: feature.notes || null,
    technicalDetails: feature.technicalDetails || null,
    dependencies: feature.dependencies ? JSON.stringify(feature.dependencies) : null,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    completedAt: null,
    assignedTo: feature.assignedTo || null,
    votes: 0
  });

  return feature;
}

/**
 * Get all feature requests
 */
export async function getAllFeatureRequests(): Promise<FeatureRequest[]> {
  const records = await db.featureRequests.list({
    orderBy: { createdAt: 'desc' }
  });

  return records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    status: record.status,
    priority: record.priority,
    requestedBy: record.requestedBy,
    requestedByType: record.requestedByType,
    targetRelease: record.targetRelease || undefined,
    estimatedHours: record.estimatedHours || undefined,
    notes: record.notes || undefined,
    technicalDetails: record.technicalDetails || undefined,
    dependencies: record.dependencies ? JSON.parse(record.dependencies) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || undefined,
    assignedTo: record.assignedTo || undefined,
    votes: record.votes || 0
  }));
}

/**
 * Get feature request by ID
 */
export async function getFeatureRequestById(id: string): Promise<FeatureRequest | null> {
  const records = await db.featureRequests.list({
    where: { id }
  });

  if (records.length === 0) return null;

  const record = records[0];
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    status: record.status,
    priority: record.priority,
    requestedBy: record.requestedBy,
    requestedByType: record.requestedByType,
    targetRelease: record.targetRelease || undefined,
    estimatedHours: record.estimatedHours || undefined,
    notes: record.notes || undefined,
    technicalDetails: record.technicalDetails || undefined,
    dependencies: record.dependencies ? JSON.parse(record.dependencies) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || undefined,
    assignedTo: record.assignedTo || undefined,
    votes: record.votes || 0
  };
}

/**
 * Update a feature request
 */
export async function updateFeatureRequest(
  id: string,
  updates: UpdateFeatureRequestInput
): Promise<FeatureRequest | null> {
  const existing = await getFeatureRequestById(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    updatedAt: now
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    if (updates.status === 'launched' && !updates.completedAt) {
      updateData.completedAt = now;
    }
  }
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.targetRelease !== undefined) updateData.targetRelease = updates.targetRelease;
  if (updates.estimatedHours !== undefined) updateData.estimatedHours = updates.estimatedHours;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.technicalDetails !== undefined) updateData.technicalDetails = updates.technicalDetails;
  if (updates.dependencies !== undefined) updateData.dependencies = JSON.stringify(updates.dependencies);
  if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
  if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;

  await db.featureRequests.update(id, updateData);

  return getFeatureRequestById(id);
}

/**
 * Delete a feature request
 */
export async function deleteFeatureRequest(id: string): Promise<boolean> {
  try {
    await db.featureRequests.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting feature request:', error);
    return false;
  }
}

/**
 * Increment vote count for a feature
 */
export async function voteForFeature(id: string): Promise<FeatureRequest | null> {
  const feature = await getFeatureRequestById(id);
  if (!feature) return null;

  await db.featureRequests.update(id, {
    votes: feature.votes + 1
  });

  return getFeatureRequestById(id);
}
