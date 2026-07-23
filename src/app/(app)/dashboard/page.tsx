
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { InteractiveCalendar } from '@/components/app/interactive-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import Link from 'next/link';
import { getTranslation } from '@/lib/translations';
import { StatisticsDashboard } from '@/components/app/statistics-dashboard';
import { ErrorBoundary } from '@/components/app/error-boundary';
import { UserManagementDashboard } from '@/components/app/user-management-dashboard';
import { DataBackupRestoreDashboard } from '@/components/app/data-backup-restore-dashboard';
import { ShiftColorLegendManager } from '@/components/app/shift-color-legend-manager';
import { ExcelScheduleUploader } from '@/components/app/excel-schedule-uploader';
import { MonthScheduleDeleter } from '@/components/app/month-schedule-deleter';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { AdminNavigation } from '@/components/app/admin-navigation';

const ExcelConfigurationsPage = dynamic(() => import('@/app/(app)/admin/excel-configurations/page'), { ssr: false }); 
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  shiftColor?: string;
  shiftHours?: string;
  timeRange?: string;
  shiftName?: string;
}

interface TeamScheduleResponse {
  user: User;
  shiftColor?: string;
  shiftHours?: string;
  timeRange?: string;
  shiftName?: string;
}

// Users will be fetched from the database

interface UserCheckboxItemProps {
  user: User;
  type: 'producer' | 'operator';
  isChecked: boolean;
  onToggleSelection: (user: User, type: 'producer' | 'operator') => void;
}

const UserCheckboxItem = React.memo<UserCheckboxItemProps>(({ user, type, isChecked, onToggleSelection }) => {
  const { currentLang } = useLanguage();
  const handleCheckedChange = React.useCallback(
    () => {
      onToggleSelection(user, type);
    },
    [user, type, onToggleSelection]
  );
  const itemId = `${type}-${user.id}`;
  return (
    <div className="flex items-center space-x-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors touch-manipulation">
      <Checkbox
        id={itemId}
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        aria-label={getTranslation(currentLang, 'SelectUserAriaLabel', { userName: user.name })}
        className="shrink-0"
      />
      <Label htmlFor={itemId} className="flex-1 cursor-pointer min-w-0">
        <span className="font-medium text-sm block truncate">{user.name}</span>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </Label>
    </div>
  );
});
UserCheckboxItem.displayName = 'UserCheckboxItem';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedProducers, setSelectedProducers] = React.useState<User[]>([]);
  const [selectedOperators, setSelectedOperators] = React.useState<User[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [existingSchedule, setExistingSchedule] = React.useState<{producers: User[], operators: User[]}>({producers: [], operators: []});
  const [loadingSchedule, setLoadingSchedule] = React.useState(false);
  const { currentLang } = useLanguage();
  const dateLocale = currentLang === 'ro' ? ro : enUS;
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  React.useEffect(() => {
    if (pathname === '/dashboard') router.replace('/dashboard/scheduling/manual');
  }, [pathname, router]);
  const primarySection = pathname.includes('/users')
    ? 'user-management'
    : pathname.includes('/statistics')
      ? 'statistics'
      : pathname.includes('/backups')
        ? 'data-backup'
        : 'team-scheduling';
  const schedulingSection = pathname.endsWith('/import')
    ? 'excel-upload'
    : pathname.endsWith('/delete')
      ? 'delete-schedule'
      : pathname.endsWith('/excel-configurations')
        ? 'excel-configurations'
        : pathname.endsWith('/color-legend')
          ? 'color-legend'
          : 'manual-scheduling';

  // Fetch users for manual role assignment
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData.filter((user: User & { role: string }) => 
            user.role === 'PRODUCER' || user.role === 'OPERATOR'
          ));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: getTranslation(currentLang, 'Error'),
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentLang, toast]);

  // Fetch existing schedule for selected date
  const fetchExistingSchedule = React.useCallback(async (date: Date) => {
    if (!date) return;
    
    try {
      setLoadingSchedule(true);
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/team-schedule?date=${dateString}`);
      
      if (response.ok) {
        const scheduleData: TeamScheduleResponse[] = await response.json();
        console.log('Fetched schedule data:', scheduleData);
        
        // Store full schedule data including shift information
        const scheduledUsers: User[] = scheduleData.map((schedule) => ({
          ...schedule.user,
          shiftColor: schedule.shiftColor,
          shiftHours: schedule.shiftHours,
          timeRange: schedule.timeRange,
          shiftName: schedule.shiftName
        }));
        const scheduledProducers = scheduledUsers.filter((user) => user.role === 'PRODUCER');
        const scheduledOperators = scheduledUsers.filter((user) => user.role === 'OPERATOR');
        
        setExistingSchedule({
          producers: scheduledProducers,
          operators: scheduledOperators,
        });
        
        // Pre-select existing users in the form
        setSelectedProducers(scheduledProducers);
        setSelectedOperators(scheduledOperators);
      } else {
        setExistingSchedule({producers: [], operators: []});
        setSelectedProducers([]);
        setSelectedOperators([]);
      }
    } catch (error) {
      console.error('Error fetching existing schedule:', error);
      setExistingSchedule({producers: [], operators: []});
      setSelectedProducers([]);
      setSelectedOperators([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  // Fetch schedule when date changes
  React.useEffect(() => {
    if (selectedDate) {
      fetchExistingSchedule(selectedDate);
    }
  }, [selectedDate, fetchExistingSchedule]);

  const handleSaveSchedule = React.useCallback(async () => {
    if (!selectedDate) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    const allSelectedUsers = [...selectedProducers, ...selectedOperators];
    
    if (allSelectedUsers.length === 0) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/team-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          userIds: allSelectedUsers.map(user => user.id),
        }),
      });

      if (response.ok) {
        toast({
          title: getTranslation(currentLang, 'Success'),
          description: 'Schedule saved successfully',
        });
        // Refresh the schedule data
        if (selectedDate) {
          await fetchExistingSchedule(selectedDate);
        }
      } else {
        const errorData = await response.json();
        console.error('Schedule save error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save schedule`);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: error instanceof Error ? error.message : 'Failed to save schedule',
        variant: 'destructive',
      });
    }
  }, [selectedDate, selectedProducers, selectedOperators, currentLang, toast, fetchExistingSchedule]);

  const handleDateSelect = React.useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    // Don't reset selections here - let the useEffect handle loading existing data
  }, []);

  const toggleSelection = React.useCallback((user: User, type: 'producer' | 'operator') => {
    if (type === 'producer') {
      setSelectedProducers(prev =>
        prev.find(p => p.id === user.id) ? prev.filter(p => p.id !== user.id) : [...prev, user]
      );
    } else {
      setSelectedOperators(prev =>
        prev.find(o => o.id === user.id) ? prev.filter(o => o.id !== user.id) : [...prev, user]
      );
    }
  }, []);

  // Security check - only ADMIN users can access this dashboard
  if (status === 'loading') {
    return <div className="flex min-h-[40vh] items-center justify-center" role="status">{getTranslation(currentLang, 'Loading')}</div>;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="text-xl">{getTranslation(currentLang, 'AccessDenied')}</CardTitle>
            <CardDescription>
              {getTranslation(currentLang, 'AdminOnlyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/assignments">{getTranslation(currentLang, 'GoToAssignments')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSelected = (userId: string, type: 'producer' | 'operator') => {
    return type === 'producer'
      ? !!selectedProducers.find(p => p.id === userId)
      : !!selectedOperators.find(o => o.id === userId);
  };

  const formattedSelectedDate = selectedDate ? format(selectedDate, 'PPP', { locale: dateLocale }) : getTranslation(currentLang, 'None');
  const producersOnDutyText = selectedProducers.length > 0 ? selectedProducers.map(p => p.name).join(', ') : getTranslation(currentLang, 'None');
  const operatorsOnDutyText = selectedOperators.length > 0 ? selectedOperators.map(o => o.name).join(', ') : getTranslation(currentLang, 'None');
  const sectionHeader = primarySection === 'user-management'
    ? {
        title: getTranslation(currentLang, 'UserManagementTab'),
        description: getTranslation(currentLang, 'UserManagementDescription'),
      }
    : primarySection === 'statistics'
      ? {
          title: getTranslation(currentLang, 'StatisticsPageTitle'),
          description: getTranslation(currentLang, 'StatisticsPageDescription'),
        }
      : primarySection === 'data-backup'
        ? {
            title: getTranslation(currentLang, 'DataBackupRestoreTabTitle'),
            description: getTranslation(currentLang, 'DataBackupRestoreTabDescription'),
          }
        : schedulingSection === 'excel-upload'
          ? {
              title: getTranslation(currentLang, 'ScheduleNavImport'),
              description: getTranslation(currentLang, 'ScheduleImportDescription'),
            }
          : schedulingSection === 'delete-schedule'
            ? {
                title: getTranslation(currentLang, 'ScheduleNavDelete'),
                description: getTranslation(currentLang, 'ScheduleDeleteDescription'),
              }
            : schedulingSection === 'excel-configurations'
              ? {
                  title: getTranslation(currentLang, 'ScheduleNavExcelConfigurations'),
                  description: getTranslation(currentLang, 'ScheduleExcelConfigurationsDescription'),
                }
              : schedulingSection === 'color-legend'
                ? {
                    title: getTranslation(currentLang, 'ScheduleNavColorLegend'),
                    description: getTranslation(currentLang, 'ScheduleColorLegendDescription'),
                  }
                : {
                    title: getTranslation(currentLang, 'ManageTeamScheduleTitle'),
                    description: getTranslation(currentLang, 'ManageTeamScheduleDescription'),
                  };

  return (
    <div className="space-y-6 px-1 sm:px-0">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{getTranslation(currentLang, 'DashboardTitle')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {getTranslation(currentLang, 'AdminPanelDescription')}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <AdminNavigation />
        <Tabs value={primarySection} className="min-w-0 w-full">
          <header className="min-h-[5.25rem] border-b pb-5">
            <h2 className="text-2xl font-semibold tracking-tight">{sectionHeader.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{sectionHeader.description}</p>
          </header>

          <TabsContent value="user-management" className="mt-6">
            <UserManagementDashboard />
          </TabsContent>

        <TabsContent value="team-scheduling" className="mt-6">
          <div>
            <Tabs value={schedulingSection} className="w-full">
              <TabsContent value="manual-scheduling" className="mt-0">
                  <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
                    <div className="lg:col-span-1 space-y-4">
                      <Card>
                        <CardHeader className="pb-4"><CardTitle className="text-lg">{getTranslation(currentLang, 'SelectDateTitle')}</CardTitle></CardHeader>
                        <CardContent className="p-0 flex justify-center">
                          <InteractiveCalendar onDateSelect={handleDateSelect} initialDate={selectedDate} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[hsl(var(--calendar-selected-day-bg))] mr-2"></div>
                            <span>{getTranslation(currentLang, 'CalendarSelectedDayLegend')}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full border-2 border-primary mr-2"></div>
                            <span>{getTranslation(currentLang, 'CalendarTodayLegend')}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-4"><CardTitle className="text-lg">{getTranslation(currentLang, 'AssignRolesForDateTitle', { date: formattedSelectedDate })}</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold mb-4 text-primary">{getTranslation(currentLang, 'ProducersTitle')}</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-2">
                              {loading ? (
                                <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'LoadingUsers')}</p>
                              ) : users.filter(user => user.role === 'PRODUCER').length > 0 ? (
                                users
                                  .filter(user => user.role === 'PRODUCER')
                                  .map(user => (
                                    <UserCheckboxItem
                                      key={`producer-${user.id}`}
                                      user={user}
                                      type="producer"
                                      isChecked={isSelected(user.id, 'producer')}
                                      onToggleSelection={toggleSelection}
                                    />
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'NoUsersAvailable')}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold mb-4 text-primary">{getTranslation(currentLang, 'OperatorsTitle')}</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-2">
                              {loading ? (
                                <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'LoadingUsers')}</p>
                              ) : users.filter(user => user.role === 'OPERATOR').length > 0 ? (
                                users
                                  .filter(user => user.role === 'OPERATOR')
                                  .map(user => (
                                    <UserCheckboxItem
                                      key={`operator-${user.id}`}
                                      user={user}
                                      type="operator"
                                      isChecked={isSelected(user.id, 'operator')}
                                      onToggleSelection={toggleSelection}
                                    />
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'NoUsersAvailable')}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">{getTranslation(currentLang, 'SummaryForDateTitle', {date: formattedSelectedDate})}</CardTitle>
                          {loadingSchedule && <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'LoadingExistingSchedule')}</p>}
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <p><strong>{getTranslation(currentLang, 'ProducersOnDutySummary')}</strong> {producersOnDutyText}</p>
                          <p><strong>{getTranslation(currentLang, 'OperatorsOnDutySummary')}</strong> {operatorsOnDutyText}</p>
                          {(existingSchedule.producers.length > 0 || existingSchedule.operators.length > 0) && (
                            <div className="mt-4 p-3 bg-muted rounded-md">
                              <p className="font-medium text-sm text-primary mb-2">{getTranslation(currentLang, 'ExistingSchedule')}</p>
                              {existingSchedule.producers.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium mb-1">{getTranslation(currentLang, 'ProducersTitle')}:</p>
                                  <div className="space-y-1">
                                    {existingSchedule.producers.map(p => (
                                      <div key={p.id} className="flex items-center gap-2 text-xs">
                                        {p.shiftColor && (
                                          <div
                                            className="w-3 h-3 rounded border"
                                            style={{ backgroundColor: p.shiftColor }}
                                            title={p.shiftColor}
                                          />
                                        )}
                                        <span>{p.name}</span>
                                        {p.timeRange ? (
                                          <span className="text-muted-foreground">({p.timeRange})</span>
                                        ) : p.shiftHours && (
                                          <span className="text-muted-foreground">({p.shiftHours})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {existingSchedule.operators.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium mb-1">{getTranslation(currentLang, 'OperatorsTitle')}:</p>
                                  <div className="space-y-1">
                                    {existingSchedule.operators.map(o => (
                                      <div key={o.id} className="flex items-center gap-2 text-xs">
                                        {o.shiftColor && (
                                          <div
                                            className="w-3 h-3 rounded border"
                                            style={{ backgroundColor: o.shiftColor }}
                                            title={o.shiftColor}
                                          />
                                        )}
                                        <span>{o.name}</span>
                                        {o.timeRange ? (
                                          <span className="text-muted-foreground">({o.timeRange})</span>
                                        ) : o.shiftHours && (
                                          <span className="text-muted-foreground">({o.shiftHours})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex justify-end">
                        <Button onClick={handleSaveSchedule} size="default" className="w-full sm:w-auto">
                          <Save className="mr-2 h-4 w-4" /> {getTranslation(currentLang, 'SaveScheduleButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
              </TabsContent>

              <TabsContent value="excel-upload" className="mt-0">
                <ExcelScheduleUploader 
                  selectedDate={selectedDate}
                  onUploadComplete={() => {
                    // Refresh schedule data after successful upload
                    if (selectedDate) {
                      fetchExistingSchedule(selectedDate);
                    }
                    toast({
                      title: getTranslation(currentLang, 'UploadComplete'),
                      description: getTranslation(currentLang, 'ScheduleUpdatedSuccessfully'),
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="delete-schedule" className="mt-0">
                <MonthScheduleDeleter 
                  selectedDate={selectedDate}
                  onDeleteComplete={() => {
                    // Refresh schedule data after successful deletion
                    if (selectedDate) {
                      fetchExistingSchedule(selectedDate);
                    }
                    toast({
                      title: getTranslation(currentLang, 'DeleteComplete'),
                      description: getTranslation(currentLang, 'ScheduleDeletedSuccessfully'),
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="excel-configurations" className="mt-0">
                <ExcelConfigurationsPage />
              </TabsContent>

              <TabsContent value="color-legend" className="mt-0">
                <ShiftColorLegendManager />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <ErrorBoundary>
              <StatisticsDashboard />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="data-backup" className="mt-6">
            <DataBackupRestoreDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
