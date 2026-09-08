
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, AlertTriangle, Calendar, MessageSquare } from 'lucide-react';
import { AssignmentDetailModal } from './assignment-detail-modal';
import { cn } from '@/lib/utils';
import { format as formatDate } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from 'next-auth/react';
import type { AssignmentWithUsers } from '@/lib/api';
import type { User } from '@prisma/client';
import { getAssignmentTiming } from '@/lib/assignment-timing';
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
  operators: Pick<User, 'id' | 'name'>[];
  openAssignmentId?: string | null;
  onEditAssignment: (assignment: AssignmentWithUsers) => void;
  onDeleteAssignment: (assignmentId: string, assignmentName: string) => void;
  onToggleComplete: (assignmentId: string, completed: boolean) => void;
  onToggleUploadedToQ: (assignmentId: string, uploaded: boolean) => void;
  onCommentCountChanged: (assignmentId: string, count: number) => void;
  onAssignOperator: (assignmentId: string, operatorId: string | null) => Promise<void>;
}

export function AssignmentTable({ assignments, operators, openAssignmentId, onEditAssignment, onDeleteAssignment, onToggleComplete, onToggleUploadedToQ, onCommentCountChanged, onAssignOperator }: AssignmentTableProps) {
  const { data: session } = useSession();
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = React.useState<AssignmentWithUsers | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = React.useState<{id: string, name: string} | null>(null);
  const [assigningAssignmentId, setAssigningAssignmentId] = React.useState<string | null>(null);
  const { currentLang } = useLanguage();
  const locale = currentLang === 'ro' ? ro : enUS;
  const openedAssignmentId = React.useRef<string | null>(null);

  const currentUserRole = session?.user?.role;
  const isAssignmentManager = currentUserRole === 'PRODUCER' || currentUserRole === 'ADMIN';
  const isContributor = currentUserRole === 'CONTRIBUTOR';
  const showActionsColumn = isAssignmentManager || isContributor;
  const canCompleteAssignments = currentUserRole === 'OPERATOR' || currentUserRole === 'ADMIN';
  const canEditAssignment = (assignment: AssignmentWithUsers) =>
    isAssignmentManager || (isContributor && assignment.createdBy.id === session?.user?.id);
  const canDeleteAssignments = isAssignmentManager;
  const canTransitionAssignment = (assignment: AssignmentWithUsers) =>
    isAssignmentManager ||
    (currentUserRole === 'OPERATOR' && assignment.assignedToId === session?.user?.id) ||
    (isContributor && assignment.createdBy.id === session?.user?.id);

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

  const handleAssigneeChange = async (assignmentId: string, value: string) => {
    setAssigningAssignmentId(assignmentId);
    try {
      await onAssignOperator(assignmentId, value === 'unassigned' ? null : value);
    } finally {
      setAssigningAssignmentId(null);
    }
  };

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
        return "bg-green-700 text-white hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-800";
      case 'IN_PROGRESS':
        return "bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-800";
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

  const getLateCompletionNote = (assignment: AssignmentWithUsers) => {
    const timing = getAssignmentTiming(assignment);
    if (!timing.isCompletedLate) return null;
    return (
      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        {getTranslation(
          currentLang,
          timing.daysLate === 1 ? 'AssignmentCompletedLateOneDay' : 'AssignmentCompletedLateDays',
          { count: String(timing.daysLate) },
        )}
      </p>
    );
  };

  const AssignmentCard = ({ assignment }: { assignment: AssignmentWithUsers }) => {
    const canEdit = canEditAssignment(assignment);
    const canTransition = canTransitionAssignment(assignment);

    return (
    <Card
      className={cn(
        'transition-shadow duration-200 hover:shadow-md',
        {'border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/10': assignment.status === 'COMPLETED'},
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="pr-2 text-lg font-semibold leading-tight">
            <button
              type="button"
              className="flex items-start gap-1.5 rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => handleViewDetails(assignment)}
              aria-label={`${getTranslation(currentLang, 'View')} ${assignment.name}`}
            >
              {(assignment.commentCount || 0) > 0 && (
                <span
                  className="mt-0.5 shrink-0 text-primary"
                  title={getTranslation(currentLang, 'AssignmentCommentsCount', { count: String(assignment.commentCount) })}
                >
                  <MessageSquare className="h-4 w-4 fill-primary/15" aria-hidden="true" />
                  <span className="sr-only">
                    {getTranslation(currentLang, 'AssignmentCommentsCount', { count: String(assignment.commentCount) })}
                  </span>
                </span>
              )}
              <span className="line-clamp-2">{assignment.name}</span>
            </button>
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
            <div className="min-w-0 flex-1">
              {canEdit ? (
                <Select
                  value={assignment.assignedToId || 'unassigned'}
                  onValueChange={(value) => void handleAssigneeChange(assignment.id, value)}
                  disabled={assigningAssignmentId === assignment.id}
                >
                  <SelectTrigger className="h-10" aria-label={getTranslation(currentLang, 'AssignmentAssigneeLabel')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{getTranslation(currentLang, 'AssignmentUnassigned')}</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>{operator.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {assignment.assignedTo?.name || getTranslation(currentLang, 'AssignmentUnassigned')}
                </p>
              )}
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
              {getLateCompletionNote(assignment)}
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
                    aria-label={getTranslation(currentLang, 'MarkAssignmentStarted', { name: assignment.name })}
                    disabled={!canTransition}
                    className="touch-manipulation"
                  />
                  <span>{getTranslation(currentLang, 'AssignmentStartWork')}</span>
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
                      disabled={!canTransition}
                      className="touch-manipulation"
                    />
                    <span>{getTranslation(currentLang, 'AssignmentTableDone')}</span>
                  </label>
                )}
              </div>
            </div>
            {(canEdit || canDeleteAssignments) && (
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {getTranslation(currentLang, 'AssignmentTableActions')}
                </span>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => handleEditClick(assignment, event)}
                      className="min-h-11 gap-1.5 px-3"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>{getTranslation(currentLang, 'Edit')}</span>
                    </Button>
                  )}
                  {canDeleteAssignments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => handleOpenDeleteConfirm(assignment.id, assignment.name, event)}
                      className="min-h-11 gap-1.5 px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{getTranslation(currentLang, 'Delete')}</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };


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
              <TableHead className="w-[22%]">{getTranslation(currentLang, 'AssignmentTableTaskName')}</TableHead>
              <TableHead className="w-[13%]">{getTranslation(currentLang, 'AssignmentTableDueDate')}</TableHead>
              <TableHead className="w-[13%]">{getTranslation(currentLang, 'AssignmentTableAssignedTo')}</TableHead>
              <TableHead className="w-[12%]">{getTranslation(currentLang, 'AssignmentTableStatus')}</TableHead>
              <TableHead className="w-[9%]">{getTranslation(currentLang, 'AssignmentTablePriority')}</TableHead>
              <TableHead className="w-[12%] text-center leading-4">{getTranslation(currentLang, 'AssignmentStarted')}</TableHead>
              {canCompleteAssignments && (
                <TableHead className="w-[7%] text-center">{getTranslation(currentLang, 'AssignmentTableDone')}</TableHead>
              )}
              {showActionsColumn && (
                <TableHead className="w-[12%] border-l text-center">{getTranslation(currentLang, 'AssignmentTableActions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const canEdit = canEditAssignment(assignment);
              const canTransition = canTransitionAssignment(assignment);

              return (
              <TableRow
                key={assignment.id}
                className={cn(
                  'hover:bg-muted/50',
                  {'bg-emerald-500/[0.07] dark:bg-emerald-500/10': assignment.status === 'COMPLETED'},
                )}
              >
                <TableCell className="font-medium leading-5">
                  <button
                    type="button"
                    className="flex items-start gap-1.5 rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleViewDetails(assignment)}
                    title={assignment.name}
                  >
                    {(assignment.commentCount || 0) > 0 && (
                      <span
                        className="mt-0.5 shrink-0 text-primary"
                        title={getTranslation(currentLang, 'AssignmentCommentsCount', { count: String(assignment.commentCount) })}
                      >
                        <MessageSquare className="h-4 w-4 fill-primary/15" aria-hidden="true" />
                        <span className="sr-only">
                          {getTranslation(currentLang, 'AssignmentCommentsCount', { count: String(assignment.commentCount) })}
                        </span>
                      </span>
                    )}
                    <span className="line-clamp-2">{assignment.name}</span>
                  </button>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(assignment.dueDate, 'PP', { locale })}</TableCell>
                <TableCell className="truncate" onClick={(event) => event.stopPropagation()}>
                  {canEdit ? (
                    <Select
                      value={assignment.assignedToId || 'unassigned'}
                      onValueChange={(value) => void handleAssigneeChange(assignment.id, value)}
                      disabled={assigningAssignmentId === assignment.id}
                    >
                      <SelectTrigger className="h-9 border-0 px-2 shadow-none" aria-label={getTranslation(currentLang, 'AssignmentAssigneeLabel')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{getTranslation(currentLang, 'AssignmentUnassigned')}</SelectItem>
                        {operators.map((operator) => (
                          <SelectItem key={operator.id} value={operator.id}>{operator.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span title={assignment.assignedTo?.name || getTranslation(currentLang, 'AssignmentUnassigned')}>
                      {assignment.assignedTo?.name || getTranslation(currentLang, 'AssignmentUnassigned')}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(assignment.status)}
                  {getLateCompletionNote(assignment)}
                </TableCell>
                <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                <TableCell className="text-center [&:has([role=checkbox])]:pr-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex min-h-10 items-center justify-center">
                    <Checkbox
                      checked={assignment.status === 'IN_PROGRESS' || assignment.status === 'COMPLETED'}
                      onCheckedChange={(checked) => onToggleUploadedToQ(assignment.id, !!checked)}
                      aria-label={getTranslation(currentLang, 'MarkAssignmentStarted', { name: assignment.name })}
                      disabled={!canTransition}
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
                        disabled={!canTransition}
                        className="touch-manipulation"
                      />
                    </div>
                  </TableCell>
                )}
                {showActionsColumn && (
                  <TableCell onClick={(event) => event.stopPropagation()} className="border-l p-1">
                    <div className="flex min-h-10 items-center justify-center">
                      {canEdit && (
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
                      )}
                      {canDeleteAssignments && (
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
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
              );
            })}
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
          onCommentCountChanged={(count) => onCommentCountChanged(selectedAssignmentForDetail.id, count)}
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
