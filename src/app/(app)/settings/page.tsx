'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, BarChart3, Settings as SettingsIcon } from 'lucide-react';
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
  const t = (key: string) => getTranslation(currentLang, key);
  const locale = currentLang === 'ro' ? 'ro-RO' : 'en-US';
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
        title: t('Error'),
        description: t('PasswordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 12) {
      toast({
        title: t('Error'),
        description: t('PasswordMinimum'),
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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await signOut({ callbackUrl: '/login?passwordChanged=1' });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: t('Error'),
        description: error instanceof Error ? error.message : t('PasswordChangeFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <p>{t('Loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
          {t('Settings')}
        </h1>
      </div>

      {session.user.passwordResetRequired && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('TemporaryPasswordNotice')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={session.user.passwordResetRequired ? 'security' : 'profile'} className="w-full">
        <TabsList className={`grid w-full ${session.user.role === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {t('Profile')}
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Lock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {t('Security')}
          </TabsTrigger>
          {session.user.role !== 'ADMIN' && (
            <TabsTrigger value="statistics" className="text-xs sm:text-sm">
              <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t('AdminNavStatistics')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t('ProfileInformation')}</CardTitle>
              <CardDescription className="text-sm">
                {t('ProfileInformationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('Name')}</Label>
                <Input value={session.user.name || ''} disabled />
              </div>
              <div>
                <Label>{t('EmailLabel')}</Label>
                <Input value={session.user.email || ''} disabled />
              </div>
              <div>
                <Label>{t('Role')}</Label>
                <div className="mt-2">
                  <Badge>
                    {session.user.role}
                  </Badge>
                </div>
              </div>
              <Alert>
                <AlertDescription>
                  {t('ContactAdminForProfileChanges')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t('ChangePassword')}</CardTitle>
              <CardDescription className="text-sm">
                {t('ChangePasswordDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">{t('CurrentPassword')}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">{t('NewPassword')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={12}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">{t('ConfirmNewPassword')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? t('ChangingPassword') : t('ChangePassword')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {session.user.role !== 'ADMIN' && (
          <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">{t('UserStatistics')}</CardTitle>
                <CardDescription className="text-sm">
                  {session.user.role === 'PRODUCER' 
                    ? t('ProducerStatisticsDescription')
                    : t('OperatorStatisticsDescription')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <p role="status" className="text-muted-foreground">{t('LoadingStatistics')}</p>
                ) : userStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {session.user.role === 'PRODUCER' ? (
                      <>
                        <div className="space-y-2">
                          <Label>{t('UserTotalAssignmentsCreated')}</Label>
                          <p className="text-2xl font-bold">{userStats.totalAssignmentsCreated || 0}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('UniqueActivityDays')}</Label>
                          <p className="text-2xl font-bold">{userStats.uniqueDaysWithActivity}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('FirstAssignmentCreated')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.firstAssignment ? new Date(userStats.firstAssignment).toLocaleDateString(locale) : t('None')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('LastAssignmentCreated')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.lastAssignment ? new Date(userStats.lastAssignment).toLocaleDateString(locale) : t('None')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('AverageAssignmentsCreated')}</Label>
                          <p className="text-2xl font-bold">{userStats.avgAssignmentsPerActiveDay?.toFixed(1) || '0.0'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>{t('UserTotalAssignmentsCompleted')}</Label>
                          <p className="text-2xl font-bold">{userStats.totalAssignmentsCompleted || 0}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('UniqueActivityDays')}</Label>
                          <p className="text-2xl font-bold">{userStats.uniqueDaysWithActivity}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('FirstAssignmentCompleted')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.firstCompletion ? new Date(userStats.firstCompletion).toLocaleDateString(locale) : t('None')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('LastAssignmentCompleted')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {userStats.lastCompletion ? new Date(userStats.lastCompletion).toLocaleDateString(locale) : t('None')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('AverageAssignmentsCompleted')}</Label>
                          <p className="text-2xl font-bold">{userStats.avgCompletionsPerActiveDay?.toFixed(1) || '0.0'}</p>
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>{t('BusiestDay')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {userStats.busiestDay || t('NoData')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('BusiestMonth')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {userStats.busiestMonth || t('NoData')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('NoStatisticsAvailable')}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
