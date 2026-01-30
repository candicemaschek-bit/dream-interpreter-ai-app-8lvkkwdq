import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowUp, Edit, Trash2, ThumbsUp, Save, X } from 'lucide-react';
import type { FeatureRequest, FeatureCategory, FeaturePriority, FeatureStatus } from '../types/featureRequest';
import { FEATURE_STATUS_FLOW, FEATURE_CATEGORIES } from '../types/featureRequest';
import { promoteFeatureToTask } from '../utils/promoteFeature';
import { updateFeatureRequest, deleteFeatureRequest, voteForFeature } from '../utils/featureRequestOperations';
import toast from 'react-hot-toast';

interface AdminFeatureItemProps {
  feature: FeatureRequest;
  onUpdate: () => void;
}

export function AdminFeatureItem({ feature, onUpdate }: AdminFeatureItemProps) {
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: feature.title,
    description: feature.description,
    category: feature.category,
    priority: feature.priority,
    status: feature.status,
    targetRelease: feature.targetRelease || '',
    estimatedHours: feature.estimatedHours?.toString() || '',
    technicalDetails: feature.technicalDetails || '',
    notes: feature.notes || ''
  });
  
  const statusInfo = FEATURE_STATUS_FLOW[feature.status];

  const handlePromote = async () => {
    setLoading(true);
    try {
      await promoteFeatureToTask(feature);
      toast.success('Feature promoted to active task!');
      onUpdate();
    } catch (error) {
      console.error('Error promoting feature:', error);
      toast.error('Failed to promote feature');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: typeof feature.status) => {
    setLoading(true);
    try {
      await updateFeatureRequest(feature.id, { status: newStatus });
      toast.success('Status updated');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    
    setLoading(true);
    try {
      await deleteFeatureRequest(feature.id);
      toast.success('Feature deleted');
      onUpdate();
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    setLoading(true);
    try {
      await voteForFeature(feature.id);
      toast.success('Vote added');
      onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      title: feature.title,
      description: feature.description,
      category: feature.category,
      priority: feature.priority,
      status: feature.status,
      targetRelease: feature.targetRelease || '',
      estimatedHours: feature.estimatedHours?.toString() || '',
      technicalDetails: feature.technicalDetails || '',
      notes: feature.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      await updateFeatureRequest(feature.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        priority: editForm.priority,
        status: editForm.status,
        targetRelease: editForm.targetRelease || undefined,
        estimatedHours: editForm.estimatedHours ? parseInt(editForm.estimatedHours) : undefined,
        technicalDetails: editForm.technicalDetails || undefined,
        notes: editForm.notes || undefined
      });
      toast.success('Feature updated');
      setIsEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating feature:', error);
      toast.error('Failed to update feature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              <Badge 
                variant="secondary"
                className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-700 border-${statusInfo.color}-200`}
              >
                {feature.status}
              </Badge>
              <Badge variant="outline">{feature.category}</Badge>
              <Badge 
                variant={
                  feature.priority === 'urgent' ? 'destructive' :
                  feature.priority === 'high' ? 'default' :
                  'secondary'
                }
              >
                {feature.priority}
              </Badge>
            </div>
            <CardTitle className="text-xl">{feature.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleVote} disabled={loading}>
              <ThumbsUp className="h-4 w-4 mr-1" />
              {feature.votes}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feature.description}</p>
        
        {feature.technicalDetails && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs font-medium mb-1">Technical Details:</p>
            <p className="text-xs text-muted-foreground">{feature.technicalDetails}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {feature.targetRelease && (
            <span className="px-2 py-1 bg-primary/10 rounded-md">
              📦 v{feature.targetRelease}
            </span>
          )}
          {feature.estimatedHours && (
            <span className="px-2 py-1 bg-blue-50 rounded-md">
              ⏱️ {feature.estimatedHours}h
            </span>
          )}
          {feature.assignedTo && (
            <span className="px-2 py-1 bg-green-50 rounded-md">
              👤 {feature.assignedTo}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-50 rounded-md">
            {feature.requestedByType === 'ai' ? '🤖' : 
             feature.requestedByType === 'admin' ? '👨‍💼' : '👥'} {feature.requestedBy}
          </span>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="flex justify-between pt-4">
        <div className="flex gap-2">
          {feature.status === 'planned' && statusInfo.next === 'PROMOTE' && (
            <Button 
              onClick={handlePromote}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Promote to Task
            </Button>
          )}
          
          {statusInfo.next && statusInfo.next !== 'PROMOTE' && (
            <Button 
              onClick={() => handleStatusChange(statusInfo.next as typeof feature.status)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Next: {statusInfo.next}
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleEdit} disabled={loading}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update the feature details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Feature title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Detailed description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value as FeatureCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) => setEditForm({ ...editForm, priority: value as FeaturePriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as FeatureStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">💡 Idea</SelectItem>
                    <SelectItem value="researching">🔍 Researching</SelectItem>
                    <SelectItem value="designed">🎨 Designed</SelectItem>
                    <SelectItem value="planned">📋 Planned</SelectItem>
                    <SelectItem value="in-dev">⚙️ In Dev</SelectItem>
                    <SelectItem value="testing">🧪 Testing</SelectItem>
                    <SelectItem value="launched">✅ Launched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetRelease">Target Release</Label>
                <Input
                  id="edit-targetRelease"
                  value={editForm.targetRelease}
                  onChange={(e) => setEditForm({ ...editForm, targetRelease: e.target.value })}
                  placeholder="e.g., 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimatedHours">Est. Hours</Label>
                <Input
                  id="edit-estimatedHours"
                  type="number"
                  value={editForm.estimatedHours}
                  onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-technicalDetails">Technical Details</Label>
              <Textarea
                id="edit-technicalDetails"
                value={editForm.technicalDetails}
                onChange={(e) => setEditForm({ ...editForm, technicalDetails: e.target.value })}
                placeholder="Implementation notes, dependencies, etc..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveEdit}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
