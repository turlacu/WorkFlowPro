
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { AssignmentDetailModal } from './assignment-detail-modal';
import { cn } from '@/lib/utils';
import { format as formatDate, parseISO } from 'date-fns';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Assignment } from '@/app/(app)/assignments/page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Operator {
  id: string;
  name: string;
}

interface AssignmentTableProps {
  assignments: Assignment[];
  operators: Operator[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string, assignmentName: string) => void;
  onToggleComplete: (assignmentId: string, completed: boolean) => void;
}

const currentUserRole = 'Producer'; // Assuming Producer can edit/delete, adjust as needed

export function AssignmentTable({ assignments, operators, onEditAssignment, onDeleteAssignment, onToggleComplete }: AssignmentTableProps) {
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = React.useState<Assignment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = React.useState<{id: string, name: string} | null>(null);
  const { currentLang } = useLanguage();

  const operatorNameMap = React.useMemo(() =>
    operators.reduce((acc, operator) => {
      acc[operator.id] = operator.name;
      return acc;
    }, {} as Record<string, string>),
  [operators]);

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignmentForDetail(assignment);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteConfirm = (assignmentId: string, assignmentName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click when clicking delete button
    setAssignmentToDelete({id: assignmentId, name: assignmentName});
  };

  const handleConfirmDelete = () => {
    if (assignmentToDelete) {
      onDeleteAssignment(assignmentToDelete.id, assignmentToDelete.name);
      setAssignmentToDelete(null);
    }
  };

  const handleEditClick = (assignment: Assignment, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click when clicking edit button
    onEditAssignment(assignment);
  }

  const getStatusBadgeVariant = (status: Assignment['status']) => {
    switch (status) {
      case 'Completed':
        return "default";
      case 'In Progress':
        return "default";
      case 'Pending':
      default:
        return "outline";
    }
  };

  const getStatusBadgeClassName = (status: Assignment['status']) => {
    switch (status) {
      case 'Completed':
        return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white";
      case 'In Progress':
        return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white";
      default:
        return "";
    }
  };

  const getPriorityBadgeVariant = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'Urgent':
        return "destructive";
      case 'Normal':
        return "secondary";
      case 'Low':
      default:
        return "outline";
    }
  };

   const getPriorityBadgeClassName = (priority: Assignment['priority']) => {
    return "";
  };


  const getStatusBadge = (status: Assignment['status']) => {
    const variant = getStatusBadgeVariant(status);
    const className = getStatusBadgeClassName(status);
    const text = getTranslation(currentLang, `AssignmentStatus${status.replace(' ', '')}`);

    return (
      <Badge variant={variant} className={cn(className, "capitalize")}>
        {text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Assignment['priority']) => {
    const variant = getPriorityBadgeVariant(priority);
    const className = getPriorityBadgeClassName(priority);
    const text = getTranslation(currentLang, `Priority${priority}`);
    return (
      <Badge variant={variant} className={cn(className, "capitalize")}>
        {text}
        {priority === 'Urgent' && <AlertTriangle className="ml-1 h-3 w-3" />}
      </Badge>
    );
  };


  if (!assignments || assignments.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{getTranslation(currentLang, 'AssignmentTableNoAssignments')}</p>;
  }

  return (
    <>
      <div className="overflow-auto h-[calc(100vh-350px)]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>{getTranslation(currentLang, 'AssignmentTableTaskName')}</TableHead>
              <TableHead>{getTranslation(currentLang, 'AssignmentTableDueDate')}</TableHead>
              <TableHead>{getTranslation(currentLang, 'AssignmentTableStatus')}</TableHead>
              <TableHead>{getTranslation(currentLang, 'AssignmentTablePriority')}</TableHead>
              <TableHead>{getTranslation(currentLang, 'AssignmentTableAssignedTo')}</TableHead>
              <TableHead className="text-right">{getTranslation(currentLang, 'AssignmentTableActions')}</TableHead>
              {currentUserRole === 'Operator' && <TableHead className="w-[50px] text-right">{getTranslation(currentLang, 'AssignmentTableDone')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow
                key={assignment.id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50',
                  {'bg-green-500/10 dark:bg-green-500/20': assignment.status === 'Completed'},
                )}
                onClick={() => handleViewDetails(assignment)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleViewDetails(assignment)}
              >
                <TableCell className="font-medium">{assignment.name}</TableCell>
                <TableCell>{formatDate(parseISO(assignment.dueDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                <TableCell>
                  {assignment.assignedTo === 'unassigned'
                    ? getTranslation(currentLang, 'AssignmentUnassigned')
                    : operatorNameMap[assignment.assignedTo] || assignment.assignedTo}
                </TableCell>
                <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetails(assignment)}>
                     {getTranslation(currentLang, 'View')}
                  </Button>
                  {currentUserRole === 'Producer' && (
                    <>
                      <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(assignment, e)} aria-label={getTranslation(currentLang, 'Edit')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => handleOpenDeleteConfirm(assignment.id, assignment.name, e)} aria-label={getTranslation(currentLang, 'Delete')}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </TableCell>
                {currentUserRole === 'Operator' && (
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <Checkbox
                      checked={assignment.status === 'Completed'}
                      onCheckedChange={(checked) => onToggleComplete(assignment.id, !!checked)}
                      aria-label={`Mark ${assignment.name} as complete`}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedAssignmentForDetail && (
        <AssignmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          assignment={selectedAssignmentForDetail}
        />
      )}
      {assignmentToDelete && (
        <AlertDialog open={!!assignmentToDelete} onOpenChange={() => setAssignmentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getTranslation(currentLang, 'ConfirmDeleteAssignmentTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {getTranslation(currentLang, 'ConfirmDeleteAssignmentDescription', { assignmentName: assignmentToDelete.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAssignmentToDelete(null)}>{getTranslation(currentLang, 'CancelButton')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({variant: "destructive"})}>
                {getTranslation(currentLang, 'DeleteButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
