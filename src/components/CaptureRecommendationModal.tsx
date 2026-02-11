import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FEATURE_CATEGORIES } from '../types/featureRequest';
import type { FeatureCategory, FeaturePriority, FeatureStatus } from '../types/featureRequest';
import { createFeatureRequest } from '../utils/featureRequestOperations';
import toast from 'react-hot-toast';

interface CaptureRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  requestedBy: string;
}

export function CaptureRecommendationModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  requestedBy 
}: CaptureRecommendationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ai' as FeatureCategory,
    customCategory: '',
    priority: 'medium' as FeaturePriority,
    status: 'idea' as FeatureStatus,
    targetRelease: '',
    estimatedHours: '',
    technicalDetails: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      const category = formData.category === 'custom' && formData.customCategory 
        ? formData.customCategory as FeatureCategory
        : formData.category;

      await createFeatureRequest({
        title: formData.title,
        description: formData.description,
        category,
        priority: formData.priority,
        status: formData.status,
        requestedBy,
        requestedByType: 'ai',
        targetRelease: formData.targetRelease || undefined,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        technicalDetails: formData.technicalDetails || undefined,
        notes: formData.notes || undefined
      });

      toast.success('Feature request captured!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'ai',
        customCategory: '',
        priority: 'medium',
        status: 'idea',
        targetRelease: '',
        estimatedHours: '',
        technicalDetails: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error capturing recommendation:', error);
      toast.error('Failed to capture recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💡 Capture AI Recommendation
          </DialogTitle>
          <DialogDescription>
            Add this recommendation to your feature tracker
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Token-based auth at project level"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the feature..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as FeatureCategory })}
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

            {formData.category === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">Custom Category</Label>
                <Input
                  id="customCategory"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  placeholder="Enter custom category"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as FeaturePriority })}
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as FeatureStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">💡 Idea</SelectItem>
                  <SelectItem value="researching">🔍 Researching</SelectItem>
                  <SelectItem value="designed">🎨 Designed</SelectItem>
                  <SelectItem value="planned">📋 Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRelease">Target Release</Label>
              <Input
                id="targetRelease"
                value={formData.targetRelease}
                onChange={(e) => setFormData({ ...formData, targetRelease: e.target.value })}
                placeholder="e.g., 1.2.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Est. Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technicalDetails">Technical Details</Label>
            <Textarea
              id="technicalDetails"
              value={formData.technicalDetails}
              onChange={(e) => setFormData({ ...formData, technicalDetails: e.target.value })}
              placeholder="Implementation notes, dependencies, etc..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Capture Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
