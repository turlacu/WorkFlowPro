'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonthScheduleDeleterProps {
  selectedDate?: Date;
  onDeleteComplete?: () => void;
}

export function MonthScheduleDeleter({ selectedDate, onDeleteComplete }: MonthScheduleDeleterProps) {
  const [selectedUserRole, setSelectedUserRole] = React.useState<string>('');
  const [deleting, setDeleting] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  
  const { toast } = useToast();

  const currentMonth = selectedDate ? selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const currentYear = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const handleDeleteMonth = async () => {
    if (!selectedUserRole) return;

    try {
      setDeleting(true);
      
      const response = await fetch('/api/team-schedule/delete-month', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          userRole: selectedUserRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }

      const result = await response.json();
      
      toast({
        title: 'Schedule Deleted',
        description: result.message,
      });

      // Reset form
      setSelectedUserRole('');
      setShowConfirmDialog(false);

      // Notify parent component
      onDeleteComplete?.();

    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete schedule.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  const getUserRoleDescription = (role: string): string => {
    switch (role) {
      case 'OPERATOR':
        return 'Only operator schedules will be deleted';
      case 'PRODUCER':
        return 'Only producer schedules will be deleted';
      case 'ALL':
        return 'All user schedules will be deleted';
      default:
        return '';
    }
  };

  const getUserRoleLabel = (role: string): string => {
    switch (role) {
      case 'OPERATOR':
        return 'operators';
      case 'PRODUCER':
        return 'producers';
      case 'ALL':
        return 'all users';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Delete Month Schedule
          </CardTitle>
          <CardDescription className="text-red-600">
            Delete all schedules for {getMonthName(currentMonth)} {currentYear} for specific user types.
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Target: {getMonthName(currentMonth)} {currentYear}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Type to Delete
            </label>
            <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type to delete...">
                  {selectedUserRole ? (
                    <div className="flex flex-col text-left">
                      <span className="font-medium">
                        {selectedUserRole === 'OPERATOR' && 'Operators Only'}
                        {selectedUserRole === 'PRODUCER' && 'Producers Only'}
                        {selectedUserRole === 'ALL' && 'All Users'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getUserRoleDescription(selectedUserRole)}
                      </span>
                    </div>
                  ) : (
                    "Select user type to delete..."
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERATOR">
                  <div className="flex flex-col">
                    <span>Operators Only</span>
                    <span className="text-xs text-muted-foreground">
                      Delete only operator schedules
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="PRODUCER">
                  <div className="flex flex-col">
                    <span>Producers Only</span>
                    <span className="text-xs text-muted-foreground">
                      Delete only producer schedules
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="ALL">
                  <div className="flex flex-col">
                    <span>All Users</span>
                    <span className="text-xs text-muted-foreground">
                      Delete schedules for all user types
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedUserRole && (
              <div className="text-xs text-muted-foreground mt-1">
                {getUserRoleDescription(selectedUserRole)}
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!selectedUserRole || deleting}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Schedule for {selectedUserRole ? getUserRoleLabel(selectedUserRole) : '...'}
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Confirm Schedule Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {getUserRoleLabel(selectedUserRole)} schedules for{' '}
              <strong>{getMonthName(currentMonth)} {currentYear}</strong>.
              <br />
              <br />
              <strong className="text-red-600">This action cannot be undone.</strong>
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMonth} 
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Schedule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}