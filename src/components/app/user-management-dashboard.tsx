
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { EditUserModal } from './edit-user-modal'; // Import the new modal


interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PRODUCER' | 'OPERATOR';
  createdAt?: string;
  updatedAt?: string;
}

const userRoles = ['ADMIN', 'PRODUCER', 'OPERATOR'] as const;

// Define Zod schema dynamically for translations
const getUserFormSchema = (currentLang: string) => z.object({
  name: z.string().min(1, { message: getTranslation(currentLang, 'ZodUserNameRequired') }),
  email: z.string().email({ message: getTranslation(currentLang, 'ZodEmailInvalid') })
           .min(1, { message: getTranslation(currentLang, 'ZodUserEmailRequired') }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(userRoles, { 
    required_error: getTranslation(currentLang, 'ZodUserRoleRequired'),
  }),
});

type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>;

export function UserManagementDashboard() {
  const { currentLang } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = React.useState(false);

  // Fetch users from API
  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while fetching users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentLang, toast]);

  // Load users on component mount
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const formSchema = React.useMemo(() => getUserFormSchema(currentLang), [currentLang]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined, // Explicitly set to undefined or one of the enum values
    },
  });
  
  const handleCreateUserSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        toast({
          title: getTranslation(currentLang, 'UserCreatedSuccessTitle'),
          description: getTranslation(currentLang, 'UserCreatedSuccessDescription', { userName: newUser.name, userRole: getTranslation(currentLang, newUser.role) }),
        });
        form.reset({ name: '', email: '', password: '', role: undefined });
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to create user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while creating user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUserUpdates = async (updatedData: { name: string; email: string; role: 'ADMIN' | 'PRODUCER' | 'OPERATOR' }) => {
    if (!editingUser) return; // Should not happen

    try {
      const updateData = {
        id: editingUser.id,
        name: updatedData.name,
        email: updatedData.email,
        role: updatedData.role,
      };

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prevUsers => prevUsers.map(u => u.id === editingUser.id ? updatedUser : u));
        toast({
          title: getTranslation(currentLang, 'UserUpdatedSuccessTitle'),
          description: getTranslation(currentLang, 'UserUpdatedSuccessDescription', { userName: updatedUser.name }),
        });
        handleCloseEditModal();
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to update user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while updating user',
        variant: 'destructive',
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast({ 
          title: getTranslation(currentLang, 'UserManagementDeleteButton'), 
          description: `User has been deleted successfully.`
        });
      } else {
        const errorData = await response.json();
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: errorData.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Network error while deleting user',
        variant: 'destructive',
      });
    }
  };

  const formTitle = getTranslation(currentLang, 'UserManagementCreateUserTitle');
  const submitButtonText = getTranslation(currentLang, 'UserManagementCreateUserButton');
  const SubmitButtonIcon = PlusCircle;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{formTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUserSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4 items-start">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
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
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SubmitButtonIcon className="mr-2 h-4 w-4" />}
                  {submitButtonText}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(currentLang, 'UserManagementExistingUsersTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length > 0 ? (
            <Table>
              <TableCaption>{getTranslation(currentLang, 'UserActivityTableCaption', { count: users.length.toString(), type: getTranslation(currentLang, 'UsersTitle')})}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{getTranslation(currentLang, 'UserManagementTableUserName')}</TableHead>
                  <TableHead>{getTranslation(currentLang, 'UserManagementTableUserEmail')}</TableHead>
                  <TableHead>{getTranslation(currentLang, 'UserManagementTableUserRole')}</TableHead>
                  <TableHead className="text-right">{getTranslation(currentLang, 'UserManagementTableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getTranslation(currentLang, user.role)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(user)} aria-label={getTranslation(currentLang, 'UserManagementEditButton')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} aria-label={getTranslation(currentLang, 'UserManagementDeleteButton')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">{getTranslation(currentLang, 'UserManagementNoUsers')}</p>
          )}
        </CardContent>
      </Card>
      
      {editingUser && (
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={handleCloseEditModal}
          userToEdit={editingUser}
          onSaveUser={handleSaveUserUpdates}
        />
      )}
    </div>
  );
}

    