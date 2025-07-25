
'use client';

import * as React from 'react';
import { InteractiveCalendar } from '@/components/app/interactive-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Users, CalendarDays, BarChart3, DatabaseBackup, Save, Upload } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getTranslation } from '@/lib/translations';
import { StatisticsDashboard } from '@/components/app/statistics-dashboard';
import { UserManagementDashboard } from '@/components/app/user-management-dashboard';
import { DataBackupRestoreDashboard } from '@/components/app/data-backup-restore-dashboard';
import { ShiftColorLegendManager } from '@/components/app/shift-color-legend-manager';
import { ExcelScheduleUploader } from '@/components/app/excel-schedule-uploader'; 
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  shiftColor?: string;
  shiftHours?: string;
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
    (_checked: boolean | 'indeterminate') => {
      onToggleSelection(user, type);
    },
    [user, type, onToggleSelection]
  );
  const itemId = `${type}-${user.id}`;
  return (
    <div className="flex items-center space-x-2 p-2 rounded-md border bg-card hover:bg-muted/50">
      <Checkbox
        id={itemId}
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        aria-label={getTranslation(currentLang, 'SelectUserAriaLabel', { userName: user.name })}
      />
      <Label htmlFor={itemId} className="flex-1 cursor-pointer">
        <span className="font-medium">{user.name}</span>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </Label>
    </div>
  );
});
UserCheckboxItem.displayName = 'UserCheckboxItem';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedProducers, setSelectedProducers] = React.useState<User[]>([]);
  const [selectedOperators, setSelectedOperators] = React.useState<User[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [existingSchedule, setExistingSchedule] = React.useState<{producers: User[], operators: User[]}>({producers: [], operators: []});
  const [loadingSchedule, setLoadingSchedule] = React.useState(false);
  const { currentLang } = useLanguage();
  const [selectedScheduleFile, setSelectedScheduleFile] = React.useState<File | null>(null);
  const { toast } = useToast();

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
        const scheduleData = await response.json();
        console.log('Fetched schedule data:', scheduleData);
        
        // Store full schedule data including shift information
        const scheduledUsers = scheduleData.map((schedule: any) => ({
          ...schedule.user,
          shiftColor: schedule.shiftColor,
          shiftHours: schedule.shiftHours,
          timeRange: schedule.timeRange,
          shiftName: schedule.shiftName
        }));
        const scheduledProducers = scheduledUsers.filter((user: any) => user.role === 'PRODUCER');
        const scheduledOperators = scheduledUsers.filter((user: any) => user.role === 'OPERATOR');
        
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
          date: selectedDate.toISOString(),
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
  }, [selectedDate, selectedProducers, selectedOperators, currentLang, toast]);

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

  const isSelected = (userId: string, type: 'producer' | 'operator') => {
    return type === 'producer'
      ? !!selectedProducers.find(p => p.id === userId)
      : !!selectedOperators.find(o => o.id === userId);
  };

  const handleScheduleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedScheduleFile(event.target.files[0]);
    } else {
      setSelectedScheduleFile(null);
    }
  };

  const handleUploadScheduleFile = async () => {
    if (!selectedScheduleFile) {
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: getTranslation(currentLang, 'NoFileSelectedForUpload'),
        variant: 'destructive',
      });
      return;
    }
    // Simulate API call for upload and processing
    toast({ title: getTranslation(currentLang, 'Processing'), description: `Simulating upload of ${selectedScheduleFile.name}` });
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: getTranslation(currentLang, 'ScheduleUploadSuccessTitle'),
      description: getTranslation(currentLang, 'ScheduleUploadSuccessDescription', { fileName: selectedScheduleFile.name }),
    });
    setSelectedScheduleFile(null); // Reset file input state
    
    // Attempt to clear the actual file input element
    const fileInput = document.getElementById('schedule-file-upload') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formattedSelectedDate = selectedDate ? format(selectedDate, 'MMMM do, yyyy') : getTranslation(currentLang, 'None');
  const producersOnDutyText = selectedProducers.length > 0 ? selectedProducers.map(p => p.name).join(', ') : getTranslation(currentLang, 'None');
  const operatorsOnDutyText = selectedOperators.length > 0 ? selectedOperators.map(o => o.name).join(', ') : getTranslation(currentLang, 'None');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{getTranslation(currentLang, 'DashboardTitle')}</h1>
      </div>

      <Tabs defaultValue="team-scheduling" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="user-management"><Users className="mr-2 h-4 w-4" />{getTranslation(currentLang, 'UserManagementTab')}</TabsTrigger>
          <TabsTrigger value="team-scheduling"><CalendarDays className="mr-2 h-4 w-4" />{getTranslation(currentLang, 'TeamSchedulingTab')}</TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="mr-2 h-4 w-4" />
            {getTranslation(currentLang, 'StatisticsTab')}
          </TabsTrigger>
          <TabsTrigger value="data-backup"><DatabaseBackup className="mr-2 h-4 w-4" />{getTranslation(currentLang, 'DataBackupRestoreTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="user-management">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {getTranslation(currentLang, 'UserManagementTab')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagementDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-scheduling">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">{getTranslation(currentLang, 'ManageTeamScheduleTitle')}</h2>
              <p className="text-muted-foreground">{getTranslation(currentLang, 'ManageTeamScheduleDescription')}</p>
            </div>
            
            <Tabs defaultValue="manual-scheduling" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual-scheduling">Manual Scheduling</TabsTrigger>
                <TabsTrigger value="excel-upload">Excel Upload</TabsTrigger>
                <TabsTrigger value="color-legend">Color Legend</TabsTrigger>
              </TabsList>

              <TabsContent value="manual-scheduling" className="mt-6">
                <Card className="shadow-lg">
                  <CardContent className="grid md:grid-cols-3 gap-6 p-6">
                    <div className="md:col-span-1 space-y-4">
                      <Card className="shadow-md">
                        <CardHeader><CardTitle>{getTranslation(currentLang, 'SelectDateTitle')}</CardTitle></CardHeader>
                        <CardContent className="p-0 flex justify-center">
                          <InteractiveCalendar onDateSelect={handleDateSelect} initialDate={selectedDate} />
                        </CardContent>
                      </Card>
                      <Card className="shadow-md">
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

                    <div className="md:col-span-2 space-y-6">
                      <Card className="shadow-md">
                        <CardHeader><CardTitle>{getTranslation(currentLang, 'AssignRolesForDateTitle', { date: formattedSelectedDate })}</CardTitle></CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-primary">{getTranslation(currentLang, 'ProducersTitle')}</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {loading ? (
                                <p className="text-sm text-muted-foreground">Loading users...</p>
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
                            <h3 className="text-lg font-semibold mb-3 text-primary">{getTranslation(currentLang, 'OperatorsTitle')}</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {loading ? (
                                <p className="text-sm text-muted-foreground">Loading users...</p>
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

                      <Card className="shadow-md">
                        <CardHeader>
                          <CardTitle>{getTranslation(currentLang, 'SummaryForDateTitle', {date: formattedSelectedDate})}</CardTitle>
                          {loadingSchedule && <p className="text-sm text-muted-foreground">Loading existing schedule...</p>}
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <p><strong>{getTranslation(currentLang, 'ProducersOnDutySummary')}</strong> {producersOnDutyText}</p>
                          <p><strong>{getTranslation(currentLang, 'OperatorsOnDutySummary')}</strong> {operatorsOnDutyText}</p>
                          {(existingSchedule.producers.length > 0 || existingSchedule.operators.length > 0) && (
                            <div className="mt-4 p-3 bg-muted rounded-md">
                              <p className="font-medium text-sm text-primary mb-2">Existing Schedule:</p>
                              {existingSchedule.producers.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium mb-1">Producers:</p>
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
                                        {(p as any).timeRange ? (
                                          <span className="text-muted-foreground">({(p as any).timeRange})</span>
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
                                  <p className="text-xs font-medium mb-1">Operators:</p>
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
                                        {(o as any).timeRange ? (
                                          <span className="text-muted-foreground">({(o as any).timeRange})</span>
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
                        <Button size="lg" onClick={handleSaveSchedule}>
                          <Save className="mr-2 h-5 w-5" /> {getTranslation(currentLang, 'SaveScheduleButton')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="excel-upload" className="mt-6">
                <ExcelScheduleUploader 
                  selectedDate={selectedDate}
                  onUploadComplete={() => {
                    // Refresh schedule data after successful upload
                    if (selectedDate) {
                      fetchExistingSchedule(selectedDate);
                    }
                    toast({
                      title: 'Upload Complete',
                      description: 'Schedule has been updated successfully.',
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="color-legend" className="mt-6">
                <ShiftColorLegendManager />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold">{getTranslation(currentLang, 'StatisticsPageTitle')}</CardTitle>
                <CardDescription>{getTranslation(currentLang, 'StatisticsPageDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StatisticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-backup">
           <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{getTranslation(currentLang, 'DataBackupRestoreTabTitle')}</CardTitle>
              <CardDescription>{getTranslation(currentLang, 'DataBackupRestoreTabDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <DataBackupRestoreDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
