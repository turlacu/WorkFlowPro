
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Producer' | 'Operator';
}

const userRoles: User['role'][] = ['Admin', 'Producer', 'Operator'];

// Define Zod schema dynamically to use translations for error messages
const getUserFormSchema = (currentLang: string) => z.object({
  name: z.string().min(1, { message: getTranslation(currentLang, 'ZodUserNameRequired') }),
  email: z.string().email({ message: getTranslation(currentLang, 'ZodEmailInvalid') })
           .min(1, { message: getTranslation(currentLang, 'ZodUserEmailRequired') }),
  role: z.enum(userRoles, { 
    required_error: getTranslation(currentLang, 'ZodUserRoleRequired'),
  }),
});

type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSaveUser: (data: UserFormValues) => Promise<void>;
}

export function EditUserModal({ isOpen, onClose, userToEdit, onSaveUser }: EditUserModalProps) {
  const { currentLang } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formSchema = React.useMemo(() => getUserFormSchema(currentLang), [currentLang]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: userToEdit || { name: '', email: '', role: undefined },
  });

  React.useEffect(() => {
    if (userToEdit) {
      form.reset(userToEdit);
    } else {
      form.reset({ name: '', email: '', role: undefined });
    }
  }, [userToEdit, form]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      await onSaveUser(data);
      // Parent component will handle closing and toast
    } catch (error) {
      console.error("Failed to save user", error);
      // Optionally show an error toast here if not handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose(); // Call parent's onClose, which should also reset form if needed
  };

  if (!userToEdit) return null; // Should not happen if isOpen is true and userToEdit is passed

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{getTranslation(currentLang, 'EditUserModalTitle')}</DialogTitle>
          <DialogDescription>
            {getTranslation(currentLang, 'EditUserModalDescription', { userName: userToEdit.name })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'UserManagementUserNameLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={getTranslation(currentLang, 'UserManagementUserNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'UserManagementUserEmailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={getTranslation(currentLang, 'UserManagementUserEmailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation(currentLang, 'UserManagementUserRoleLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={getTranslation(currentLang, 'UserManagementSelectRolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {getTranslation(currentLang, role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {getTranslation(currentLang, 'UserManagementSaveChangesButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    