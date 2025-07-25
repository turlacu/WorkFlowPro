'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShiftColorLegend {
  id: string;
  colorCode: string;
  colorName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftColorLegendFormData {
  colorCode: string;
  colorName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  description: string;
}

export function ShiftColorLegendManager() {
  const [legends, setLegends] = React.useState<ShiftColorLegend[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingLegend, setEditingLegend] = React.useState<ShiftColorLegend | null>(null);
  const [legendToDelete, setLegendToDelete] = React.useState<ShiftColorLegend | null>(null);
  const [formData, setFormData] = React.useState<ShiftColorLegendFormData>({
    colorCode: '#FF0000',
    colorName: '',
    shiftName: '',
    startTime: '08:00',
    endTime: '16:00',
    description: ''
  });

  const { currentLang } = useLanguage();
  const { toast } = useToast();

  const fetchLegends = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shift-color-legend');
      if (!response.ok) throw new Error('Failed to fetch legends');
      const data = await response.json();
      setLegends(data);
    } catch (error) {
      console.error('Error fetching legends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load color legends.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchLegends();
  }, [fetchLegends]);

  const handleOpenModal = (legend?: ShiftColorLegend) => {
    if (legend) {
      setEditingLegend(legend);
      setFormData({
        colorCode: legend.colorCode,
        colorName: legend.colorName,
        shiftName: legend.shiftName,
        startTime: legend.startTime,
        endTime: legend.endTime,
        description: legend.description || ''
      });
    } else {
      setEditingLegend(null);
      setFormData({
        colorCode: '#FF0000',
        colorName: '',
        shiftName: '',
        startTime: '08:00',
        endTime: '16:00',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = '/api/shift-color-legend';
      const method = editingLegend ? 'PUT' : 'POST';
      const body = editingLegend ? { ...formData, id: editingLegend.id } : formData;

      console.log('Saving color legend:', { method, body });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save error response:', errorData);
        
        if (errorData.error === 'Validation error' && errorData.details) {
          const validationErrors = errorData.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        } else if (errorData.error === 'Color code already exists') {
          throw new Error(errorData.details || 'A color legend with this color code already exists.');
        } else {
          throw new Error(errorData.error || 'Failed to save legend');
        }
      }

      toast({
        title: 'Success',
        description: `Color legend ${editingLegend ? 'updated' : 'created'} successfully.`,
      });

      setIsModalOpen(false);
      await fetchLegends();
    } catch (error) {
      console.error('Error saving legend:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${editingLegend ? 'update' : 'create'} color legend.`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!legendToDelete) return;

    try {
      const response = await fetch(`/api/shift-color-legend/${legendToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete legend');

      toast({
        title: 'Success',
        description: 'Color legend deleted successfully.',
      });

      setLegendToDelete(null);
      await fetchLegends();
    } catch (error) {
      console.error('Error deleting legend:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete color legend.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Shift Color Legend Management
            </CardTitle>
            <CardDescription>
              Define color codes for different shift types to be used when importing Excel schedules.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Color Legend
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : legends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No color legends defined yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Color Name</TableHead>
                  <TableHead>Shift Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legends.map((legend) => (
                  <TableRow key={legend.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border-2 border-gray-300"
                          style={{ backgroundColor: legend.colorCode }}
                        />
                        <code className="text-sm">{legend.colorCode}</code>
                      </div>
                    </TableCell>
                    <TableCell>{legend.colorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{legend.shiftName}</Badge>
                    </TableCell>
                    <TableCell>{legend.startTime} - {legend.endTime}</TableCell>
                    <TableCell className="max-w-xs truncate">{legend.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(legend)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLegendToDelete(legend)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLegend ? 'Edit Color Legend' : 'Create Color Legend'}
            </DialogTitle>
            <DialogDescription>
              Define a color code and its associated shift information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="colorCode">Color Code</Label>
                <Input
                  id="colorCode"
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="colorName">Color Name</Label>
                <Input
                  id="colorName"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  placeholder="e.g., Red, Blue"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shiftName">Shift Name</Label>
              <Input
                id="shiftName"
                value={formData.shiftName}
                onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                placeholder="e.g., Morning Shift, Night Shift"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this shift..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingLegend ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!legendToDelete} onOpenChange={() => setLegendToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color Legend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the color legend "{legendToDelete?.shiftName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}