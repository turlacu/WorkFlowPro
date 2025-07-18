
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AssignmentWithUsers } from '@/lib/api';

interface Operator {
  id: string;
  name: string;
}

const priorities = ['LOW', 'NORMAL', 'URGENT'] as const;
const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAssignment: (data: NewAssignmentFormValues, assignmentId?: string) => Promise<void>;
  assignmentToEdit?: AssignmentWithUsers | null;
  availableOperators: Operator[];
}

const getNewAssignmentFormSchema = (currentLang: string) => z.object({
  title: z.string().min(1, { message: getTranslation(currentLang, 'ZodAssignmentTitleRequired') }),
  description: z.string().optional(),
  sourceLocation: z.string().optional(),
  priority: z.enum(priorities, { required_error: getTranslation(currentLang, 'ZodAssignmentPriorityRequired')}),
  status: z.enum(statuses, { required_error: getTranslation(currentLang, 'ZodAssignmentStatusRequired')}),
  assignedTo: z.string().min(1, { message: getTranslation(currentLang, 'ZodAssignmentAssignedToRequired') }),
  dueDate: z.date({ required_error: getTranslation(currentLang, 'ZodAssignmentDueDateRequired') }),
});

export type NewAssignmentFormValues = {
  title: string;
  description?: string;
  sourceLocation?: string;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string; // Will be the operator ID
  dueDate: Date;
};

export function NewAssignmentModal({ isOpen, onClose, onSaveAssignment, assignmentToEdit, availableOperators }: NewAssignmentModalProps) {
  const { currentLang } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditMode = !!assignmentToEdit;

  const formSchema = React.useMemo(() => getNewAssignmentFormSchema(currentLang), [currentLang]);

  const form = useForm<NewAssignmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      sourceLocation: '',
      priority: 'NORMAL',
      status: 'PENDING',
      assignedTo: '',
      dueDate: new Date(),
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (assignmentToEdit) {
        form.reset({
          title: assignmentToEdit.name,
          description: assignmentToEdit.description || '',
          sourceLocation: assignmentToEdit.sourceLocation || '',
          priority: assignmentToEdit.priority as 'LOW' | 'NORMAL' | 'URGENT',
          status: assignmentToEdit.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
          assignedTo: assignmentToEdit.assignedTo?.id || 'unassigned',
          dueDate: new Date(assignmentToEdit.dueDate),
        });
      } else {
        form.reset({
          title: '',
          description: '',
          sourceLocation: '',
          priority: 'NORMAL',
          status: 'PENDING',
          assignedTo: 'unassigned',
          dueDate: new Date(),
        });
      }
    }
  }, [isOpen, assignmentToEdit, form]);

  const onSubmit = async (data: NewAssignmentFormValues) => {
    setIsSubmitting(true);
    try {
      await onSaveAssignment(data, assignmentToEdit?.id);
    } catch (error) {
      console.error("Failed to save assignment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? getTranslation(currentLang, 'EditAssignmentModalTitle')
              : getTranslation(currentLang, 'NewAssignmentModalTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? getTranslation(currentLang, 'EditAssignmentModalDescription')
              : getTranslation(currentLang, 'NewAssignmentModalDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'AssignmentTitleLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={getTranslation(currentLang, 'AssignmentTitlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'AssignmentDescriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={getTranslation(currentLang, 'AssignmentDescriptionPlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'AssignmentSourceLocationLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={getTranslation(currentLang, 'AssignmentSourceLocationPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getTranslation(currentLang, 'AssignmentPriorityLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={getTranslation(currentLang, 'AssignmentPriorityLabel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p} value={p}>
                            {getTranslation(currentLang, `Priority${p}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getTranslation(currentLang, 'AssignmentStatusLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={getTranslation(currentLang, 'AssignmentStatusLabel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map(s => (
                           <SelectItem key={s} value={s}>
                             {getTranslation(currentLang, `AssignmentStatus${s.replace(' ', '')}`)}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'AssignmentAssigneeLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={getTranslation(currentLang, 'AssignmentAssigneePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">{getTranslation(currentLang, 'AssignmentUnassigned')}</SelectItem>
                      {availableOperators.map(operator => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{getTranslation(currentLang, 'AssignmentDueDateLabel')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>{getTranslation(currentLang, 'AssignmentPickDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) && !isEditMode } // Allow past dates if editing
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                {getTranslation(currentLang, 'CancelButton')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode
                  ? getTranslation(currentLang, 'SaveChangesButton')
                  : getTranslation(currentLang, 'CreateButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
