
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AssignmentWithUsers } from '@/lib/api';
import { format as formatDate } from 'date-fns'; 
import {
  Info,
  ShieldAlert,
  CheckCircle2,
  User,
  CalendarDays,
  MessageSquare,
  UserCircle,
  Clock,
  Edit3,
  CalendarCheck,
  Tag,
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

   const getPriorityBadgeClassName = (priority: AssignmentWithUsers['priority']) => {
    // 'Normal' uses secondary variant, 'Urgent' destructive, 'Low' outline
    // No specific class overrides needed here currently
    return "";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="p-6 relative">
          <DialogClose className="absolute right-4 top-4" />
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-primary">{assignment.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {getTranslation(currentLang, 'AssignmentDetailModalFullDetails')}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description Section */}
            {assignment.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info size={18} />
                  <h3 className="text-md font-semibold text-foreground">
                    {getTranslation(currentLang, 'AssignmentDetailDescriptionLabel')}
                  </h3>
                </div>
                <p className="text-sm text-foreground/90 ml-7">{assignment.description}</p>
              </div>
            )}

            <Separator />

            {/* Priority & Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Tag size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailPriorityLabel')}</span>
                </div>
                <Badge
                  variant={getPriorityBadgeVariant(assignment.priority)}
                  className={cn("text-xs capitalize", getPriorityBadgeClassName(assignment.priority))}
                >
                  {getTranslation(currentLang, `Priority${assignment.priority}`)}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle2 size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailStatusLabel')}</span>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(assignment.status)}
                  className={cn("text-xs capitalize", getStatusBadgeClassName(assignment.status))}
                >
                  {getTranslation(currentLang, `AssignmentStatus${assignment.status.replace(' ', '')}`)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Assignee & Date Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailAssigneeLabel')}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{assignment.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CalendarDays size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailDateLabel')}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{formatDate(new Date(assignment.dueDate), 'MMM do, yyyy')}</p>
              </div>
            </div>

            {/* Add Comment Section */}
            {currentUserRole === 'Operator' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare size={18} />
                    <h3 className="text-md font-semibold text-foreground">
                      {getTranslation(currentLang, 'AssignmentDetailAddCommentLabel')}
                    </h3>
                  </div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={getTranslation(currentLang, 'AssignmentDetailCommentPlaceholder')}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-start pt-2">
                    <Button onClick={handlePostComment} size="sm">
                      {getTranslation(currentLang, 'AssignmentDetailPostCommentButton')}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Audit Trail Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailCreatedByLabel')}</span>
                </div>
                <p className="text-foreground/90">{assignment.createdBy?.name || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailCreatedAtLabel')}</span>
                </div>
                <p className="text-foreground/90">{formatDate(assignment.createdAt, 'MMM do, yyyy \'at\' h:mm a')}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Edit3 size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailLastUpdatedByLabel')}</span>
                </div>
                <p className="text-foreground/90">{assignment.lastUpdatedBy?.name || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  <span>{getTranslation(currentLang, 'AssignmentDetailLastUpdatedAtLabel')}</span>
                </div>
                <p className="text-foreground/90">{formatDate(assignment.updatedAt, 'MMM do, yyyy \'at\' h:mm a')}</p>
              </div>
              {assignment.status === 'COMPLETED' && assignment.completedAt && (
                <div className="space-y-1 md:col-span-2"> {/* Allow completed at to span if needed */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarCheck size={16} />
                    <span>{getTranslation(currentLang, 'AssignmentDetailCompletedAtLabel')}</span>
                  </div>
                  <p className="text-foreground/90">{formatDate(assignment.completedAt!, 'MMM do, yyyy \'at\' h:mm a')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>{getTranslation(currentLang, 'Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

