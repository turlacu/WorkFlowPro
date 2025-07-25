'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Palette, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserStats {
  userRole: string;
  totalAssignmentsCreated?: number;
  totalAssignmentsCompleted?: number;
  firstAssignment?: string | null;
  lastAssignment?: string | null;
  firstCompletion?: string | null;
  lastCompletion?: string | null;
  uniqueDaysWithActivity: number;
  avgAssignmentsPerActiveDay?: number;
  avgCompletionsPerActiveDay?: number;
  busiestDay: string | null;
  busiestMonth: string | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const { currentLang } = useLanguage();
  const { toast } = useToast();

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoadingStats(true);
        const response = await fetch('/api/user/statistics');
        if (response.ok) {
          const stats = await response.json();
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error fetching user statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [session]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${session.user.role === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          {session.user.role !== 'ADMIN' && (
            <TabsTrigger value="statistics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View your account information. Contact an administrator to make changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={session.user.name || ''} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={session.user.email || ''} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <div className="mt-2">
                  <Badge variant={
                    session.user.role === 'ADMIN' ? 'destructive' :
                    session.user.role === 'PRODUCER' ? 'default' : 'secondary'
                  }>
                    {session.user.role}
                  </Badge>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  To update your name, email, or role, please contact your system administrator.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {session.user.role !== 'ADMIN' && (
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>
                  {session.user.role === 'PRODUCER' 
                    ? 'View your assignment creation activity and performance metrics.'
                    : 'View your assignment completion activity and performance metrics.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <p className="text-muted-foreground">Loading statistics...</p>
                ) : userStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.user.role === 'PRODUCER' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Total Assignments Created</Label>
                          <p className="text-2xl font-bold">{userStats.totalAssignmentsCreated || 0}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Unique Days with Activity</Label>
                          <p className="text-2xl font-bold">{userStats.uniqueDaysWithActivity}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>First Assignment Created</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.firstAssignment ? new Date(userStats.firstAssignment).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Last Assignment Created</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.lastAssignment ? new Date(userStats.lastAssignment).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Avg. Assignments Created per Active Day</Label>
                          <p className="text-2xl font-bold">{userStats.avgAssignmentsPerActiveDay?.toFixed(1) || '0.0'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Total Assignments Completed</Label>
                          <p className="text-2xl font-bold">{userStats.totalAssignmentsCompleted || 0}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Unique Days with Activity</Label>
                          <p className="text-2xl font-bold">{userStats.uniqueDaysWithActivity}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>First Assignment Completed</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.firstCompletion ? new Date(userStats.firstCompletion).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Last Assignment Completed</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.lastCompletion ? new Date(userStats.lastCompletion).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Avg. Assignments Completed per Active Day</Label>
                          <p className="text-2xl font-bold">{userStats.avgCompletionsPerActiveDay?.toFixed(1) || '0.0'}</p>
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>Busiest Day</Label>
                      <p className="text-sm text-muted-foreground">
                        {userStats.busiestDay || 'No data'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Busiest Month</Label>
                      <p className="text-sm text-muted-foreground">
                        {userStats.busiestMonth || 'No data'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}