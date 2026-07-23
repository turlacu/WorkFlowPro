
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AssignmentWithUsers } from '@/lib/api';
import { format as formatDate } from 'date-fns'; 
import {
  Info,
  CheckCircle2,
  User,
  CalendarDays,
  MessageSquare,
  UserCircle,
  Clock,
  Edit3,
  CalendarCheck,
  Tag,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentWithUsers | null;
}

const currentUserRole = 'Operator';

export function AssignmentDetailModal({ isOpen, onClose, assignment }: AssignmentDetailModalProps) {
  const [comment, setComment] = React.useState('');
  const { currentLang } = useLanguage();

  React.useEffect(() => {
    if (assignment) {
      setComment(assignment.comment || '');
    }
  }, [assignment]);

  if (!assignment) {
    return null;
  }

  const handlePostComment = () => {
    console.log('Posting comment:', comment, 'for assignment ID:', assignment.id);
    // Here you would typically call an API to save the comment
    // For now, let's just close the modal or give some feedback
    onClose();
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

  const assignmentAuthor = (assignment as AssignmentWithUsers & { author?: string }).author;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[calc(100svh-2rem)] w-full max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <div className="p-4 sm:p-5">
          <DialogHeader className="mb-3 pr-8">
            <DialogTitle className="text-xl font-bold text-primary sm:text-2xl">{assignment.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {getTranslation(currentLang, 'AssignmentDetailModalFullDetails')}
            </p>
          </DialogHeader>

          <div className="space-y-3">
            {assignment.description && (
              <div className="flex items-start gap-3 rounded-md bg-muted/40 px-3 py-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {getTranslation(currentLang, 'AssignmentDetailDescriptionLabel')}
                  </h3>
                  <p className="mt-0.5 text-sm leading-5 text-foreground/90">{assignment.description}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 border-y py-3 sm:grid-cols-3">
              {assignmentAuthor && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Author</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium" title={assignmentAuthor}>{assignmentAuthor}</p>
                </div>
              )}
              {assignment.sourceLocation && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>Source Location</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium" title={assignment.sourceLocation}>{assignment.sourceLocation}</p>
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span>{getTranslation(currentLang, 'AssignmentDetailPriorityLabel')}</span>
                </div>
                <Badge className="mt-1 text-xs capitalize">
                  {getTranslation(currentLang, `Priority${assignment.priority}`)}
                </Badge>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{getTranslation(currentLang, 'AssignmentDetailStatusLabel')}</span>
                </div>
                <Badge className={cn("mt-1 text-xs capitalize", getStatusBadgeClassName(assignment.status))}>
                  {getTranslation(currentLang, `AssignmentStatus${assignment.status.replace(' ', '')}`)}
                </Badge>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>{getTranslation(currentLang, 'AssignmentDetailAssigneeLabel')}</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium" title={assignment.assignedTo?.name || 'Unassigned'}>
                  {assignment.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>{getTranslation(currentLang, 'AssignmentDetailDateLabel')}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{formatDate(new Date(assignment.dueDate), 'MMM do, yyyy')}</p>
              </div>
            </div>

            {currentUserRole === 'Operator' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    {getTranslation(currentLang, 'AssignmentDetailAddCommentLabel')}
                  </h3>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={getTranslation(currentLang, 'AssignmentDetailCommentPlaceholder')}
                    className="min-h-16 flex-1 resize-y"
                  />
                  <Button onClick={handlePostComment} className="w-full shrink-0 sm:w-auto">
                    {getTranslation(currentLang, 'AssignmentDetailPostCommentButton')}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 border-t pt-3 text-sm sm:grid-cols-2 sm:gap-6">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">People</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <UserCircle className="h-3.5 w-3.5" />
                      {getTranslation(currentLang, 'AssignmentDetailCreatedByLabel')}
                    </span>
                    <span className="truncate font-medium">{assignment.createdBy?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Edit3 className="h-3.5 w-3.5" />
                      {getTranslation(currentLang, 'AssignmentDetailLastUpdatedByLabel')}
                    </span>
                    <span className="truncate font-medium">{assignment.lastUpdatedBy?.name || 'Unknown'}</span>
                  </div>
                  {assignment.status === 'COMPLETED' && assignment.completedBy && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <UserCircle className="h-3.5 w-3.5" />
                        Completed by
                      </span>
                      <span className="truncate font-medium">{assignment.completedBy.name || assignment.completedBy.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {getTranslation(currentLang, 'AssignmentDetailCreatedAtLabel')}
                    </span>
                    <span className="whitespace-nowrap font-medium">{formatDate(assignment.createdAt, 'MMM d, yyyy · HH:mm')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {getTranslation(currentLang, 'AssignmentDetailLastUpdatedAtLabel')}
                    </span>
                    <span className="whitespace-nowrap font-medium">{formatDate(assignment.updatedAt, 'MMM d, yyyy · HH:mm')}</span>
                  </div>
                  {assignment.status === 'COMPLETED' && assignment.completedAt && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        {getTranslation(currentLang, 'AssignmentDetailCompletedAtLabel')}
                      </span>
                      <span className="whitespace-nowrap font-medium">{formatDate(assignment.completedAt, 'MMM d, yyyy · HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t px-4 py-3 sm:px-5">
          <Button 
            onClick={onClose}
            className="h-10 w-full sm:w-auto"
          >
            {getTranslation(currentLang, 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
