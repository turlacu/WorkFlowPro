
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { AssignmentDetailModal } from './assignment-detail-modal';
import { cn } from '@/lib/utils';
import { format as formatDate } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from 'next-auth/react';
import type { AssignmentWithUsers } from '@/lib/api';
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

interface AssignmentTableProps {
  assignments: AssignmentWithUsers[];
  openAssignmentId?: string | null;
  onEditAssignment: (assignment: AssignmentWithUsers) => void;
  onDeleteAssignment: (assignmentId: string, assignmentName: string) => void;
  onToggleComplete: (assignmentId: string, completed: boolean) => void;
  onToggleUploadedToQ: (assignmentId: string, uploaded: boolean) => void;
}

export function AssignmentTable({ assignments, openAssignmentId, onEditAssignment, onDeleteAssignment, onToggleComplete, onToggleUploadedToQ }: AssignmentTableProps) {
  const { data: session } = useSession();
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = React.useState<AssignmentWithUsers | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = React.useState<{id: string, name: string} | null>(null);
  const { currentLang } = useLanguage();
  const locale = currentLang === 'ro' ? ro : enUS;
  const openedAssignmentId = React.useRef<string | null>(null);

  const currentUserRole = session?.user?.role;
  const canManageAssignments = currentUserRole === 'PRODUCER' || currentUserRole === 'ADMIN';
  const canCompleteAssignments = currentUserRole === 'OPERATOR' || currentUserRole === 'ADMIN';

  const handleViewDetails = (assignment: AssignmentWithUsers) => {
    setSelectedAssignmentForDetail(assignment);
    setIsDetailModalOpen(true);
  };

  React.useEffect(() => {
    if (!openAssignmentId || openedAssignmentId.current === openAssignmentId) return;
    const assignment = assignments.find((item) => item.id === openAssignmentId);
    if (!assignment) return;
    openedAssignmentId.current = openAssignmentId;
    setSelectedAssignmentForDetail(assignment);
    setIsDetailModalOpen(true);
  }, [assignments, openAssignmentId]);

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

  const handleEditClick = (assignment: AssignmentWithUsers, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click when clicking edit button
    onEditAssignment(assignment);
  }

  const getStatusBadgeVariant = (status: AssignmentWithUsers['status']) => {
    switch (status) {
      case 'COMPLETED':
        return "default";
      case 'IN_PROGRESS':
        return "default";
      case 'PENDING':
      default:
        return "outline";
    }
  };

  const getStatusBadgeClassName = (status: AssignmentWithUsers['status']) => {
    switch (status) {
      case 'COMPLETED':
        return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white";
      case 'IN_PROGRESS':
        return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white";
      default:
        return "";
    }
  };

  const getPriorityBadgeVariant = (priority: AssignmentWithUsers['priority']) => {
    switch (priority) {
      case 'URGENT':
        return "destructive";
      case 'NORMAL':
        return "secondary";
      case 'LOW':
      default:
        return "outline";
    }
  };

   const getPriorityBadgeClassName = () => {
    return "";
  };


  const getStatusBadge = (status: AssignmentWithUsers['status']) => {
    const variant = getStatusBadgeVariant(status);
    const className = getStatusBadgeClassName(status);
    const text = getTranslation(currentLang, `AssignmentStatus${status.replace(' ', '')}`);

    return (
      <Badge variant={variant} className={cn(className, "capitalize")}>
        {text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: AssignmentWithUsers['priority']) => {
    const variant = getPriorityBadgeVariant(priority);
    const className = getPriorityBadgeClassName();
    const text = getTranslation(currentLang, `Priority${priority}`);
    return (
      <Badge variant={variant} className={cn(className, "capitalize")}>
        {text}
        {priority === 'URGENT' && <AlertTriangle className="ml-1 h-3 w-3" />}
      </Badge>
    );
  };

  const getAssignedUserInitials = (name: string | null) => {
    if (!name) return 'UN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const AssignmentCard = ({ assignment }: { assignment: AssignmentWithUsers }) => (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow duration-200',
        {'border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/10': assignment.status === 'COMPLETED'},
      )}
      onClick={() => handleViewDetails(assignment)}
      role="button"
      tabIndex={0}
      aria-label={`${getTranslation(currentLang, 'View')} ${assignment.name}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleViewDetails(assignment);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight pr-2">
            {assignment.name}
          </CardTitle>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {getPriorityBadge(assignment.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Assigned User */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getAssignedUserInitials(assignment.assignedTo?.name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {assignment.assignedTo?.name || getTranslation(currentLang, 'AssignmentUnassigned')}
              </p>
              <p className="text-xs text-muted-foreground">
                {getTranslation(currentLang, 'AssignmentTableAssignedTo')}
              </p>
            </div>
          </div>

          {/* Due Date and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDate(assignment.dueDate, 'PP', { locale })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTranslation(currentLang, 'AssignmentTableDueDate')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(assignment.status)}
            </div>
          </div>

          <div
            className="space-y-3 border-t border-border/60 pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {getTranslation(currentLang, 'AssignmentTableWorkflow')}
              </p>
              <div className={cn('grid gap-2', canCompleteAssignments && 'grid-cols-2')}>
                <label
                  htmlFor={`mobile-uploaded-${assignment.id}`}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium"
                >
                  <Checkbox
                    id={`mobile-uploaded-${assignment.id}`}
                    checked={assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED'}
                    onCheckedChange={(checked) => onToggleUploadedToQ(assignment.id, !!checked)}
                    aria-label={getTranslation(currentLang, 'MarkUploadedToQ', { name: assignment.name })}
                    className="touch-manipulation"
                  />
                  <span>{getTranslation(currentLang, 'UploadedToQ')}</span>
                </label>
                {canCompleteAssignments && (
                  <label
                    htmlFor={`mobile-done-${assignment.id}`}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium"
                  >
                    <Checkbox
                      id={`mobile-done-${assignment.id}`}
                      checked={assignment.status === 'COMPLETED'}
                      onCheckedChange={(checked) => onToggleComplete(assignment.id, !!checked)}
                      aria-label={getTranslation(currentLang, 'MarkComplete', { name: assignment.name })}
                      className="touch-manipulation"
                    />
                    <span>{getTranslation(currentLang, 'AssignmentTableDone')}</span>
                  </label>
                )}
              </div>
            </div>
            {canManageAssignments && (
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {getTranslation(currentLang, 'AssignmentTableActions')}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => handleEditClick(assignment, event)}
                    className="min-h-11 gap-1.5 px-3"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>{getTranslation(currentLang, 'Edit')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => handleOpenDeleteConfirm(assignment.id, assignment.name, event)}
                    className="min-h-11 gap-1.5 px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{getTranslation(currentLang, 'Delete')}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  if (!assignments || assignments.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{getTranslation(currentLang, 'AssignmentTableNoAssignments')}</p>;
  }

  return (
    <>
      {/* Desktop Table - Hidden on mobile, visible md and up */}
      <div className="hidden overflow-x-hidden md:block">
        <Table className="table-fixed [&_td]:px-2 [&_td]:py-3 [&_th]:px-2">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-[16%]">{getTranslation(currentLang, 'AssignmentTableTaskName')}</TableHead>
              <TableHead className="w-[14%]">{getTranslation(currentLang, 'AssignmentTableDueDate')}</TableHead>
              <TableHead className="w-[14%]">{getTranslation(currentLang, 'AssignmentTableAssignedTo')}</TableHead>
              <TableHead className="w-[13%]">{getTranslation(currentLang, 'AssignmentTableStatus')}</TableHead>
              <TableHead className="w-[10%]">{getTranslation(currentLang, 'AssignmentTablePriority')}</TableHead>
              <TableHead className="w-[13%] text-center leading-4">{getTranslation(currentLang, 'UploadedToQ')}</TableHead>
              {canCompleteAssignments && (
                <TableHead className="w-[8%] text-center">{getTranslation(currentLang, 'AssignmentTableDone')}</TableHead>
              )}
              {canManageAssignments && (
                <TableHead className="w-[12%] border-l text-center">{getTranslation(currentLang, 'AssignmentTableActions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow
                key={assignment.id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50',
                  {'bg-emerald-500/[0.07] dark:bg-emerald-500/10': assignment.status === 'COMPLETED'},
                )}
                onClick={() => handleViewDetails(assignment)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleViewDetails(assignment);
                  }
                }}
              >
                <TableCell className="break-words font-medium leading-5">{assignment.name}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(assignment.dueDate, 'PP', { locale })}</TableCell>
                <TableCell className="truncate">
                  <span title={assignment.assignedTo?.name || getTranslation(currentLang, 'AssignmentUnassigned')}>
                    {!assignment.assignedTo
                      ? getTranslation(currentLang, 'AssignmentUnassigned')
                      : assignment.assignedTo.name}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                <TableCell className="text-center [&:has([role=checkbox])]:pr-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex min-h-10 items-center justify-center">
                    <Checkbox
                      checked={assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED'}
                      onCheckedChange={(checked) => onToggleUploadedToQ(assignment.id, !!checked)}
                      aria-label={getTranslation(currentLang, 'MarkUploadedToQ', { name: assignment.name })}
                      className="touch-manipulation"
                    />
                  </div>
                </TableCell>
                {canCompleteAssignments && (
                  <TableCell onClick={(event) => event.stopPropagation()} className="text-center [&:has([role=checkbox])]:pr-4">
                    <div className="flex min-h-10 items-center justify-center">
                      <Checkbox
                        checked={assignment.status === 'COMPLETED'}
                        onCheckedChange={(checked) => onToggleComplete(assignment.id, !!checked)}
                        aria-label={getTranslation(currentLang, 'MarkComplete', { name: assignment.name })}
                        className="touch-manipulation"
                      />
                    </div>
                  </TableCell>
                )}
                {canManageAssignments && (
                  <TableCell onClick={(event) => event.stopPropagation()} className="border-l p-1">
                    <div className="flex min-h-10 items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => handleEditClick(assignment, event)}
                        aria-label={getTranslation(currentLang, 'Edit')}
                        title={getTranslation(currentLang, 'Edit')}
                        className="h-9 w-9"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => handleOpenDeleteConfirm(assignment.id, assignment.name, event)}
                        aria-label={getTranslation(currentLang, 'Delete')}
                        title={getTranslation(currentLang, 'Delete')}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible on mobile, hidden md and up */}
      <div className="block space-y-4 px-1 md:hidden">
        {assignments.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
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
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {getTranslation(currentLang, 'DeleteButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
