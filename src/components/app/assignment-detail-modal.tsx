
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
import type { AssignmentCommentWithAuthor, AssignmentWithUsers } from '@/lib/api';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate } from 'date-fns'; 
import { enUS, ro } from 'date-fns/locale';
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
  Loader2,
  Reply,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAssignmentTiming } from '@/lib/assignment-timing';

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentWithUsers | null;
  onCommentCountChanged?: (count: number) => void;
}

export function AssignmentDetailModal({ isOpen, onClose, assignment, onCommentCountChanged }: AssignmentDetailModalProps) {
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState<AssignmentCommentWithAuthor[]>([]);
  const [replyingTo, setReplyingTo] = React.useState<{ id: string; authorName: string } | null>(null);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [isSavingComment, setIsSavingComment] = React.useState(false);
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const locale = currentLang === 'ro' ? ro : enUS;

  React.useEffect(() => {
    if (!isOpen || !assignment) return;
    let cancelled = false;
    setComment('');
    setReplyingTo(null);
    setIsLoadingComments(true);
    void api.getAssignmentComments(assignment.id)
      .then((result) => {
        if (!cancelled) setComments(result);
      })
      .catch((error) => {
        if (!cancelled) {
          toast({
            title: getTranslation(currentLang, 'Error'),
            description: error instanceof Error
              ? error.message
              : getTranslation(currentLang, 'AssignmentCommentsLoadError'),
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignment, currentLang, isOpen, toast]);

  if (!assignment) {
    return null;
  }

  const handlePostComment = async () => {
    const content = comment.trim();
    if (!content) return;
    setIsSavingComment(true);
    try {
      const createdComment = await api.createAssignmentComment(assignment.id, content, replyingTo?.id);
      const persistedComments = await api.getAssignmentComments(assignment.id);
      if (!persistedComments.some((item) => item.id === createdComment.id)) {
        throw new Error(getTranslation(currentLang, 'AssignmentCommentVerificationError'));
      }
      setComments(persistedComments);
      onCommentCountChanged?.(persistedComments.length);
      setComment('');
      setReplyingTo(null);
      toast({
        title: getTranslation(currentLang, 'AssignmentCommentSavedTitle'),
        description: getTranslation(currentLang, 'AssignmentCommentSavedDescription'),
      });
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: error instanceof Error
          ? error.message
          : getTranslation(currentLang, 'AssignmentCommentSaveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingComment(false);
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

  const assignmentAuthor = (assignment as AssignmentWithUsers & { author?: string }).author;
  const timing = getAssignmentTiming(assignment);
  const commentsByParent = comments.reduce((map, item) => {
    const parentId = item.parentId || 'root';
    const children = map.get(parentId) || [];
    children.push(item);
    map.set(parentId, children);
    return map;
  }, new Map<string, AssignmentCommentWithAuthor[]>());

  const renderComment = (item: AssignmentCommentWithAuthor, depth = 0): React.ReactNode => {
    const authorName = item.author?.name || item.authorName;
    const replies = commentsByParent.get(item.id) || [];
    return (
      <div key={item.id} className={cn(depth > 0 && 'ml-5 border-l pl-3')}>
        <div className="rounded-md border bg-muted/30 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" title={authorName}>{authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(item.createdAt), 'PPp', { locale })}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2"
              onClick={() => setReplyingTo({ id: item.id, authorName })}
            >
              <Reply className="h-3.5 w-3.5" />
              {getTranslation(currentLang, 'AssignmentCommentReplyButton')}
            </Button>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{item.content}</p>
        </div>
        {replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };


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
            {timing.isCompletedLate && assignment.completedAt && (
              <div className="flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-amber-900 dark:text-amber-200">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold">
                    {getTranslation(
                      currentLang,
                      timing.daysLate === 1 ? 'AssignmentCompletedLateOneDay' : 'AssignmentCompletedLateDays',
                      { count: String(timing.daysLate) },
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-200/75">
                    {getTranslation(currentLang, 'AssignmentCompletedLateDates', {
                      dueDate: formatDate(new Date(assignment.dueDate), 'PP', { locale }),
                      completedDate: formatDate(new Date(assignment.completedAt), 'PP', { locale }),
                    })}
                  </p>
                </div>
              </div>
            )}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    {getTranslation(currentLang, 'AssignmentCommentsTitle')}
                  </h3>
                </div>
                <Badge variant="secondary">{comments.length}</Badge>
              </div>
              {isLoadingComments ? (
                <div className="flex items-center justify-center gap-2 rounded-md border py-5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getTranslation(currentLang, 'AssignmentCommentsLoading')}
                </div>
              ) : comments.length > 0 ? (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(commentsByParent.get('root') || []).map((item) => renderComment(item))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  {getTranslation(currentLang, 'AssignmentCommentsEmpty')}
                </p>
              )}
              {replyingTo && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="truncate">
                    {getTranslation(currentLang, 'AssignmentCommentReplyingTo', { name: replyingTo.authorName })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setReplyingTo(null)}
                    aria-label={getTranslation(currentLang, 'Cancel')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={getTranslation(
                    currentLang,
                    replyingTo ? 'AssignmentCommentReplyPlaceholder' : 'AssignmentDetailCommentPlaceholder',
                  )}
                  maxLength={10_000}
                  disabled={isSavingComment}
                  className="min-h-16 flex-1 resize-y"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={isSavingComment || !comment.trim()}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {isSavingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getTranslation(
                    currentLang,
                    replyingTo ? 'AssignmentCommentPostReplyButton' : 'AssignmentDetailPostCommentButton',
                  )}
                </Button>
              </div>
            </div>

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
