'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Palette, Palmtree } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShiftColorLegend {
  id: string;
  colorCode: string;
  colorName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isVacation: boolean;
  description?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftColorLegendFormData {
  colorCode: string;
  colorName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isVacation: boolean;
  description: string;
  role: string;
}

export function ShiftColorLegendManager() {
  const [legends, setLegends] = React.useState<ShiftColorLegend[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingLegend, setEditingLegend] = React.useState<ShiftColorLegend | null>(null);
  const [legendToDelete, setLegendToDelete] = React.useState<ShiftColorLegend | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('ALL');
  const [formData, setFormData] = React.useState<ShiftColorLegendFormData>({
    colorCode: '#FF0000',
    colorName: '',
    shiftName: '',
    startTime: '08:00',
    endTime: '16:00',
    isVacation: false,
    description: '',
    role: 'OPERATOR'
  });

  const { toast } = useToast();

  const fetchLegends = React.useCallback(async (role?: string) => {
    try {
      setLoading(true);
      const url = role && role !== 'ALL' ? `/api/shift-color-legend?role=${role}` : '/api/shift-color-legend';
      const response = await fetch(url);
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
    fetchLegends(selectedRole);
  }, [fetchLegends, selectedRole]);

  const handleOpenModal = (legend?: ShiftColorLegend) => {
    if (legend) {
      setEditingLegend(legend);
      setFormData({
        colorCode: legend.colorCode,
        colorName: legend.colorName,
        shiftName: legend.shiftName,
        startTime: legend.startTime,
        endTime: legend.endTime,
        isVacation: legend.isVacation,
        description: legend.description || '',
        role: legend.role
      });
    } else {
      setEditingLegend(null);
      setFormData({
        colorCode: '#FF0000',
        colorName: '',
        shiftName: '',
        startTime: '08:00',
        endTime: '16:00',
        isVacation: false,
        description: '',
        role: selectedRole !== 'ALL' ? selectedRole : 'OPERATOR'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = '/api/shift-color-legend';
      const method = editingLegend ? 'PUT' : 'POST';
      const body = editingLegend ? { ...formData, id: editingLegend.id } : formData;

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
      await fetchLegends(selectedRole);
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
      await fetchLegends(selectedRole);
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
        <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Shift Color Legend Management
            </CardTitle>
            <CardDescription>
              Define colors as working shifts or vacation days for Excel schedule imports.
              Each role can have its own color meanings.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter color legends by role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="OPERATOR">OPERATOR</SelectItem>
                <SelectItem value="PRODUCER">PRODUCER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Color Legend
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : legends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No color legends defined yet. Create one to get started.
            </div>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 w-[42%] px-2 sm:h-10 sm:px-3 lg:w-[30%]">Legend</TableHead>
                  <TableHead className="h-10 w-[38%] px-2 sm:h-10 sm:px-3 lg:w-[25%]">Schedule</TableHead>
                  <TableHead className="hidden h-10 px-3 sm:h-10 lg:table-cell">Notes</TableHead>
                  <TableHead className="h-10 w-[20%] px-2 text-right sm:h-10 sm:w-20 sm:px-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legends.map((legend) => (
                  <TableRow key={legend.id}>
                    <TableCell className="p-2 sm:p-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className="h-8 w-8 shrink-0 rounded-md border border-border/70 shadow-sm"
                          style={{ backgroundColor: legend.colorCode }}
                          title={legend.colorCode}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-5" title={legend.shiftName}>
                            {legend.shiftName}
                          </p>
                          <p
                            className="truncate text-xs leading-4 text-muted-foreground"
                            title={`${legend.colorName} · ${legend.colorCode}`}
                          >
                            {legend.colorName} <span aria-hidden="true">·</span>{' '}
                            <code className="font-mono text-[11px]">{legend.colorCode}</code>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                        <Badge
                          variant={legend.isVacation ? 'secondary' : 'outline'}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {legend.isVacation ? 'Vacation' : 'Shift'}
                        </Badge>
                        <Badge
                          variant={legend.role === 'ADMIN' ? 'destructive' : legend.role === 'PRODUCER' ? 'default' : 'secondary'}
                          className="h-5 max-w-full truncate px-1.5 text-[10px] font-medium"
                        >
                          {legend.role}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {legend.isVacation ? 'Not scheduled' : `${legend.startTime} – ${legend.endTime}`}
                      </p>
                    </TableCell>
                    <TableCell className="hidden p-3 lg:table-cell">
                      <p className="line-clamp-2 text-xs leading-4 text-muted-foreground" title={legend.description}>
                        {legend.description || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="p-2 sm:p-2">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(legend)}
                          className="h-8 w-8"
                          aria-label={`Edit ${legend.shiftName}`}
                          title="Edit legend"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setLegendToDelete(legend)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${legend.shiftName}`}
                          title="Delete legend"
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
              Define whether this color represents working time or vacation.
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
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select
                value={formData.isVacation ? 'VACATION' : 'SHIFT'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  isVacation: value === 'VACATION',
                  startTime: value === 'VACATION' ? '00:00' : formData.startTime,
                  endTime: value === 'VACATION' ? '00:00' : formData.endTime,
                  shiftName: value === 'VACATION' && !formData.shiftName ? 'Vacation' : formData.shiftName,
                })}
              >
                <SelectTrigger id="scheduleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIFT">Working shift</SelectItem>
                  <SelectItem value="VACATION">Vacation (concediu de odihnă)</SelectItem>
                </SelectContent>
              </Select>
              {formData.isVacation && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Palmtree className="h-3.5 w-3.5" />
                  Vacation cells will not appear as working schedules.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shiftName">Shift Name</Label>
                <Input
                  id="shiftName"
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  placeholder="e.g., Morning Shift, Night Shift"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">OPERATOR</SelectItem>
                    <SelectItem value="PRODUCER">PRODUCER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={formData.isVacation}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={formData.isVacation}
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
            <Button onClick={() => setIsModalOpen(false)} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">
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
