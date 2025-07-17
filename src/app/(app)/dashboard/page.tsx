
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

const mockProducers: User[] = [
  { id: 'p1', name: 'Adrian Doroș', email: 'adriandoros@radioconstanta.ro' },
  { id: 'p2', name: 'Marian Cosor', email: 'mariancosor@radioconstanta.ro' },
  { id: 'p3', name: 'Victorina Oancea', email: 'victorinaoancea@radioconstanta.ro' },
];

const mockOperators: User[] = [
  { id: 'o1', name: 'Alina Doncea', email: 'alinadoncea@radioconstanta.ro' },
  { id: 'o2', name: 'Manuela Carleciuc', email: 'manuelacarleciuc@radioconstanta.ro' },
  { id: 'o3', name: 'Francesca Vintilescu', email: 'francescavintilescu@radioconstanta.ro' },
  { id: 'o4', name: 'Mihaela Sixt', email: 'mihaelasixt@radioconstanta.ro' },
];

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
  const { currentLang } = useLanguage();
  const [selectedScheduleFile, setSelectedScheduleFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const handleDateSelect = React.useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedProducers([]);
    setSelectedOperators([]);
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{getTranslation(currentLang, 'ManageTeamScheduleTitle')}</CardTitle>
              <CardDescription>{getTranslation(currentLang, 'ManageTeamScheduleDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
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
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{getTranslation(currentLang, 'UploadScheduleFileLabel')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid w-full items-center gap-2">
                      <Input
                        id="schedule-file-upload"
                        type="file"
                        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleScheduleFileChange}
                        className="mb-2"
                      />
                      {selectedScheduleFile && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {getTranslation(currentLang, 'FileSelectedMessage', { fileName: selectedScheduleFile.name })}
                        </p>
                      )}
                      <Button onClick={handleUploadScheduleFile} disabled={!selectedScheduleFile} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        {getTranslation(currentLang, 'UploadScheduleButton')}
                      </Button>
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
                      <div className="space-y-3">
                        {mockProducers.map(producer => (
                          <UserCheckboxItem
                            key={producer.id}
                            user={producer}
                            type="producer"
                            isChecked={isSelected(producer.id, 'producer')}
                            onToggleSelection={toggleSelection}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">{getTranslation(currentLang, 'OperatorsTitle')}</h3>
                      <div className="space-y-3">
                        {mockOperators.map(operator => (
                           <UserCheckboxItem
                            key={operator.id}
                            user={operator}
                            type="operator"
                            isChecked={isSelected(operator.id, 'operator')}
                            onToggleSelection={toggleSelection}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader><CardTitle>{getTranslation(currentLang, 'SummaryForDateTitle', {date: formattedSelectedDate})}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><strong>{getTranslation(currentLang, 'ProducersOnDutySummary')}</strong> {producersOnDutyText}</p>
                    <p><strong>{getTranslation(currentLang, 'OperatorsOnDutySummary')}</strong> {operatorsOnDutyText}</p>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button size="lg">
                    <Save className="mr-2 h-5 w-5" /> {getTranslation(currentLang, 'SaveScheduleButton')}
                  </Button>
                </div>
              </div>
            </CardContent>
            {/* CardFooter removed from here as its content is moved */}
          </Card>
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
