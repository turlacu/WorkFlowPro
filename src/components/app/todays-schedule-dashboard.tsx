'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarDays, Upload, FileText, Edit, Trash2, Download, User, Clock, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, startOfDay } from 'date-fns';
import { PDFScheduleViewer } from './pdf-schedule-viewer';

interface DailySchedule {
  id: string;
  date: string;
  title: string;
  content?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  filePath?: string;
  uploadedBy: string;
  uploader: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function TodaysScheduleDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [schedules, setSchedules] = React.useState<DailySchedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = React.useState<DailySchedule | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = React.useState('');

  const canUpload = session?.user?.role === 'ADMIN' || session?.user?.role === 'PRODUCER';

  // Fetch schedule for selected date
  const fetchSchedule = React.useCallback(async (date: Date) => {
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/daily-schedules?date=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSchedule(data.length > 0 ? data[0] : null);
      } else {
        setCurrentSchedule(null);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setCurrentSchedule(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch schedules for calendar (current month)
  const fetchMonthSchedules = React.useCallback(async (date: Date) => {
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const response = await fetch(`/api/daily-schedules?month=${month}&year=${year}`);
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching month schedules:', error);
    }
  }, []);

  // Fetch data when selected date changes
  React.useEffect(() => {
    fetchSchedule(selectedDate);
    fetchMonthSchedules(selectedDate);
  }, [selectedDate, fetchSchedule, fetchMonthSchedules]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a file and a title.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('date', format(selectedDate, 'yyyy-MM-dd'));
      formData.append('title', uploadTitle.trim());

      const response = await fetch('/api/daily-schedules/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Upload Successful',
          description: result.message,
        });
        
        // Reset form and close dialog
        setUploadFile(null);
        setUploadTitle('');
        setShowUploadDialog(false);
        
        // Clear file input
        const fileInput = document.getElementById('schedule-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Refresh data
        await fetchSchedule(selectedDate);
        await fetchMonthSchedules(selectedDate);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading schedule:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload schedule.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    if (!currentSchedule) return;
    setEditTitle(currentSchedule.title);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!currentSchedule || !editTitle.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/daily-schedules?date=${dateStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Schedule Updated',
          description: 'Schedule title has been updated successfully.',
        });
        
        setShowEditDialog(false);
        await fetchSchedule(selectedDate);
        await fetchMonthSchedules(selectedDate);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update schedule.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentSchedule) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/daily-schedules?date=${dateStr}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Schedule Deleted',
          description: 'Schedule has been deleted successfully.',
        });
        
        setShowDeleteDialog(false);
        await fetchSchedule(selectedDate);
        await fetchMonthSchedules(selectedDate);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete schedule.',
        variant: 'destructive',
      });
    }
  };

  const getScheduleDates = () => {
    return schedules.map(schedule => new Date(schedule.date));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today's Schedule Dashboard</h2>
          <p className="text-muted-foreground">
            View and manage daily schedules. {canUpload ? 'Upload new schedules or edit existing ones.' : 'View schedules uploaded by admins and producers.'}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Schedule
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              Days with schedules are highlighted
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{
                hasSchedule: getScheduleDates(),
              }}
              modifiersStyles={{
                hasSchedule: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold',
                },
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Schedule Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Schedule for {format(selectedDate, 'MMMM do, yyyy')}
                    {isToday(selectedDate) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Today
                      </span>
                    )}
                  </CardTitle>
                  {currentSchedule && (
                    <CardDescription>
                      Uploaded by {currentSchedule.uploader.name} ({currentSchedule.uploader.role})
                    </CardDescription>
                  )}
                </div>
                {currentSchedule && canUpload && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Title
                    </Button>
                    {session?.user?.role === 'ADMIN' && (
                      <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading schedule...</div>
                </div>
              ) : currentSchedule ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{currentSchedule.title}</h3>
                    {currentSchedule.fileName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <FileText className="h-4 w-4" />
                        <span>{currentSchedule.fileName}</span>
                        {currentSchedule.fileSize && (
                          <span>({formatFileSize(currentSchedule.fileSize)})</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {currentSchedule.filePath ? (
                    <PDFScheduleViewer
                      fileName={currentSchedule.fileName}
                      filePath={currentSchedule.filePath}
                      fileSize={currentSchedule.fileSize}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                      <p>No PDF file available for viewing</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {currentSchedule.uploader.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(currentSchedule.updatedAt), 'MMM do, yyyy at h:mm a')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Schedule Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No schedule has been uploaded for {format(selectedDate, 'MMMM do, yyyy')}.
                  </p>
                  {canUpload && (
                    <Button onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Schedule
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Daily Schedule</DialogTitle>
            <DialogDescription>
              Upload a PDF schedule for {format(selectedDate, 'MMMM do, yyyy')}.
              Only PDF files are supported.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-title">Schedule Title</Label>
              <Input
                id="schedule-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Production Schedule - September 12th"
              />
            </div>
            
            <div>
              <Label htmlFor="schedule-file">Select File</Label>
              <Input
                id="schedule-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            
            {uploadFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{uploadFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(uploadFile.size)})
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
              {uploading ? 'Uploading...' : 'Upload Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule Title</DialogTitle>
            <DialogDescription>
              Edit the title for the schedule on {format(selectedDate, 'MMMM do, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Schedule Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter the schedule title..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the schedule for {format(selectedDate, 'MMMM do, yyyy')}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}