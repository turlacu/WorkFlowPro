
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AssignmentTable } from '@/components/app/assignment-table';
import { AssignmentWorkloadSummary } from '@/components/app/assignment-workload-summary';
import { InteractiveCalendar } from '@/components/app/interactive-calendar';
import { NewAssignmentModal, type NewAssignmentFormValues } from '@/components/app/new-assignment-modal';
import { PlusCircle, Users, CalendarDays, Search } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import { api, type AssignmentWithUsers } from '@/lib/api';
import {
  filterAssignmentsBySummary,
  summarizeAssignments,
  type AssignmentSummaryFilter,
} from '@/lib/assignment-summary';
import { User } from '@prisma/client';

type ScheduledUser = User & {
  shiftColor?: string | null;
  shiftHours?: string | null;
  timeRange?: string | null;
  shiftName?: string | null;
};

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithUsers[]>([]);
  const [calendarAssignments, setCalendarAssignments] = useState<AssignmentWithUsers[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUsers | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [requestedAssignmentId, setRequestedAssignmentId] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState<AssignmentSummaryFilter | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [teamForSelectedDay, setTeamForSelectedDay] = useState<{ producers: ScheduledUser[], operators: ScheduledUser[] }>({ producers: [], operators: [] });
  const [formattedSelectedDateString, setFormattedSelectedDateString] = useState<string>('');

  const { currentLang } = useLanguage();
  const dateLocale = currentLang === 'ro' ? ro : enUS;
  const { toast } = useToast();

  useEffect(() => {
    const openRequestedAssignment = (assignmentId: string | null, date: string | null) => {
      if (date) {
        const parsedDate = parseISO(date);
        if (isValid(parsedDate)) setSelectedDate(parsedDate);
      }
      setRequestedAssignmentId(assignmentId);
      setSearchTerm('');
      setSummaryFilter(null);
    };

    const params = new URLSearchParams(window.location.search);
    openRequestedAssignment(params.get('assignment'), params.get('date'));

    const handleOpenAssignment = (event: Event) => {
      const detail = (event as CustomEvent<{ assignmentId: string; date: string }>).detail;
      if (detail?.assignmentId) openRequestedAssignment(detail.assignmentId, detail.date);
    };
    window.addEventListener('workflowpro:open-assignment', handleOpenAssignment);
    return () => window.removeEventListener('workflowpro:open-assignment', handleOpenAssignment);
  }, []);

  // Fetch initial data (only once on session load)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        
        // Fetch operators and producers
        const operatorsList = await api.getUsers('OPERATOR');
        
        setOperators(operatorsList);

        // Set up current date info
        const today = new Date();
        // Initial load - set selected date if not already set
        if (!selectedDate) {
          setSelectedDate(today);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadError(true);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setInitialDataLoaded(true);
      }
    };

    if (session && !initialDataLoaded) {
      fetchInitialData();
    }
  }, [session, initialDataLoaded, selectedDate, toast]); // Only run once when session is available

  const fetchAssignments = useCallback(async () => {
    try {
      setLoadError(false);
      const params: { date?: string; search?: string } = {};
      
      // Include date filter when a date is selected and no search is active
      if (selectedDate && searchTerm.trim() === '') {
        params.date = format(selectedDate, 'yyyy-MM-dd');
      }
      
      // Include search filter when search term exists
      if (searchTerm.trim() !== '') {
        params.search = searchTerm;
      }

      const assignments = await api.getAssignments(params);
      setAllAssignments(assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Set empty array on error to prevent UI issues
      setAllAssignments([]);
      setLoadError(true);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load assignments. Please try again.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, searchTerm, toast]);

  // Fetch all assignments for calendar colors (no date filter)
  const fetchCalendarAssignments = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const assignments = await api.getAssignments(); // No filters - get all assignments
      setCalendarAssignments(assignments);
    } catch (error) {
      console.error('Error fetching calendar assignments:', error);
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch team schedule for the selected date
  const fetchTeamScheduleForDate = useCallback(async (date: Date) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const teamSchedule = await api.getTeamSchedule(dateString);
      const scheduledUsers = teamSchedule.map(schedule => ({
        ...schedule.user,
        shiftColor: schedule.shiftColor,
        shiftHours: schedule.shiftHours,
        timeRange: schedule.timeRange,
        shiftName: schedule.shiftName
      }));
      const scheduledProducers = scheduledUsers.filter(user => user.role === 'PRODUCER');
      const scheduledOperators = scheduledUsers.filter(user => user.role === 'OPERATOR');
      
      setTeamForSelectedDay({
        producers: scheduledProducers,
        operators: scheduledOperators,
      });
      setFormattedSelectedDateString(format(date, 'PPP', { locale: dateLocale }));
    } catch (error) {
      console.error('Error fetching team schedule for date:', error);
      // Reset team on error
      setTeamForSelectedDay({ producers: [], operators: [] });
      setFormattedSelectedDateString(format(date, 'PPP', { locale: dateLocale }));
    }
  }, [dateLocale]);

  // Fetch assignments when search term or selected date changes
  useEffect(() => {
    if (session && initialDataLoaded) {
      // If there's a search term, use debounce
      if (searchTerm.trim() !== '') {
        const delayedFetch = setTimeout(() => {
          fetchAssignments();
        }, 300);
        return () => clearTimeout(delayedFetch);
      } 
      // If no search term but there's a selected date, fetch immediately
      else if (selectedDate) {
        fetchAssignments();
      }
    }
  }, [searchTerm, selectedDate, session, initialDataLoaded, fetchAssignments]);

  // Fetch the full assignment dataset used by the calendar and workload summary.
  // The selected-date/search dataset is handled by the effect above.
  useEffect(() => {
    if (session && initialDataLoaded) {
      void fetchCalendarAssignments();
    }
  }, [session, initialDataLoaded, fetchCalendarAssignments]);

  // Fetch team schedule when selected date changes
  useEffect(() => {
    if (session && initialDataLoaded && selectedDate) {
      fetchTeamScheduleForDate(selectedDate);
    }
  }, [session, initialDataLoaded, selectedDate, fetchTeamScheduleForDate]);


  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSummaryFilter(null);
    // Only clear search if it's not already empty to avoid triggering search useEffect
    if (searchTerm.trim() !== '') {
      setSearchTerm('');
    }
  }, [searchTerm]);

  const assignmentSummary = useMemo(
    () => summarizeAssignments(calendarAssignments, session?.user.id || ''),
    [calendarAssignments, session?.user.id],
  );

  const assignmentsToDisplay = useMemo(() => {
    if (!summaryFilter || !session?.user.id) return allAssignments;
    return filterAssignmentsBySummary(calendarAssignments, summaryFilter, session.user.id);
  }, [allAssignments, calendarAssignments, session?.user.id, summaryFilter]);

  const handleSummarySelect = useCallback((filter: AssignmentSummaryFilter) => {
    setSummaryFilter(filter);
    setSearchTerm('');
  }, []);

  const completedTaskDays = useMemo(() => {
    // Group assignments by date
    const assignmentsByDate = new Map<string, AssignmentWithUsers[]>();
    
    calendarAssignments.forEach(assignment => {
      const dateKey = format(new Date(assignment.dueDate), 'yyyy-MM-dd');
      if (!assignmentsByDate.has(dateKey)) {
        assignmentsByDate.set(dateKey, []);
      }
      assignmentsByDate.get(dateKey)!.push(assignment);
    });

    // Find dates where ALL assignments are completed
    const fullyCompletedDates: Date[] = [];
    assignmentsByDate.forEach((assignments, dateKey) => {
      const allCompleted = assignments.every(a => a.status === 'COMPLETED');
      if (allCompleted && assignments.length > 0) {
        fullyCompletedDates.push(new Date(dateKey));
      }
    });

    return fullyCompletedDates;
  }, [calendarAssignments]);

  const incompleteTaskDays = useMemo(() => {
    // Group assignments by date
    const assignmentsByDate = new Map<string, AssignmentWithUsers[]>();
    
    calendarAssignments.forEach(assignment => {
      const dateKey = format(new Date(assignment.dueDate), 'yyyy-MM-dd');
      if (!assignmentsByDate.has(dateKey)) {
        assignmentsByDate.set(dateKey, []);
      }
      assignmentsByDate.get(dateKey)!.push(assignment);
    });

    // Find dates where NOT ALL assignments are completed
    const incompleteDates: Date[] = [];
    assignmentsByDate.forEach((assignments, dateKey) => {
      const hasIncomplete = assignments.some(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
      if (hasIncomplete && assignments.length > 0) {
        incompleteDates.push(new Date(dateKey));
      }
    });

    return incompleteDates;
  }, [calendarAssignments]);

  const handleSaveAssignment = useCallback(async (data: NewAssignmentFormValues, assignmentIdToUpdate?: string) => {
    try {
      if (assignmentIdToUpdate) {
        const updateData = {
          id: assignmentIdToUpdate,
          name: data.title,
          dueDate: data.dueDate.toISOString(),
          status: data.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
          priority: data.priority as 'LOW' | 'NORMAL' | 'URGENT',
          assignedToId: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
          description: data.description || '',
          author: data.author || '',
          sourceLocation: data.sourceLocation || '',
        };

        await api.updateAssignment(updateData);
        toast({
          title: getTranslation(currentLang, 'AssignmentUpdatedSuccessTitle'),
          description: getTranslation(currentLang, 'AssignmentUpdatedSuccessDescription', { assignmentName: data.title }),
        });
      } else {
        const createData = {
          name: data.title,
          dueDate: data.dueDate.toISOString(),
          priority: data.priority as 'LOW' | 'NORMAL' | 'URGENT',
          assignedToId: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
          description: data.description || '',
          author: data.author || '',
          sourceLocation: data.sourceLocation || '',
        };

        await api.createAssignment(createData);
        toast({
          title: getTranslation(currentLang, 'AssignmentCreatedSuccessTitle'),
          description: getTranslation(currentLang, 'AssignmentCreatedSuccessDescription', { assignmentName: data.title }),
        });
      }
      
      setIsAssignmentModalOpen(false);
      setEditingAssignment(null);
      await Promise.all([
        fetchAssignments(), // Refresh filtered assignments
        fetchCalendarAssignments() // Refresh calendar assignments for colors
      ]);
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: getTranslation(currentLang, 'Error'),
        description: error instanceof Error ? error.message : 'Failed to save assignment. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentLang, toast, fetchAssignments, fetchCalendarAssignments]);

  const handleOpenEditModal = useCallback((assignment: AssignmentWithUsers) => {
    setEditingAssignment(assignment);
    setIsAssignmentModalOpen(true);
  }, []);

  const handleDeleteAssignment = useCallback(async (assignmentId: string, assignmentName: string) => {
    try {
      await api.deleteAssignment(assignmentId);
      toast({
        title: getTranslation(currentLang, 'AssignmentDeletedSuccessTitle'),
        description: getTranslation(currentLang, 'AssignmentDeletedSuccessDescription', { assignmentName }),
        variant: "destructive"
      });
      await Promise.all([
        fetchAssignments(), // Refresh filtered assignments
        fetchCalendarAssignments() // Refresh calendar assignments for colors
      ]);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentLang, toast, fetchAssignments, fetchCalendarAssignments]);

  const handleToggleComplete = useCallback(async (assignmentId: string, completed: boolean) => {
    try {
      const assignment = allAssignments.find(a => a.id === assignmentId)
        ?? calendarAssignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.error('Assignment not found for ID:', assignmentId);
        return;
      }

      // Only ADMIN can uncheck "Done" (unmark as completed)
      if (!completed && assignment.status === 'COMPLETED' && session?.user?.role !== 'ADMIN') {
        toast({
          title: 'Access Denied',
          description: 'Only Admin users can unmark assignments as Done.',
          variant: 'destructive',
        });
        return;
      }

      // If trying to check "Done" but "Uploaded to Q" is not checked, show warning
      if (completed && assignment.status !== 'IN_PROGRESS') {
        toast({
          title: 'Cannot mark as Done',
          description: 'The assignment must be "Uploaded to Q" first before it can be marked as Done.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Toggle complete - Original assignment:', assignment);

      // When toggling "Done" checkbox:
      // - If checking "Done": can only do this if already IN_PROGRESS, then go to COMPLETED  
      // - If unchecking "Done": go back to IN_PROGRESS (keep "Uploaded to Q" checked)
      const newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = completed ? 'COMPLETED' : 'IN_PROGRESS';

      const updateData = {
        id: assignmentId,
        name: assignment.name,
        dueDate: new Date(assignment.dueDate).toISOString(),
        status: newStatus,
        priority: assignment.priority as 'LOW' | 'NORMAL' | 'URGENT',
        assignedToId: assignment.assignedToId || undefined,
        description: assignment.description || '',
        author: assignment.author || '',
        sourceLocation: assignment.sourceLocation || '',
        // Track who marked it as completed
      };

      console.log('Toggle complete - Update data being sent:', updateData);
      await api.updateAssignment(updateData);
      await Promise.all([
        fetchAssignments(), // Refresh filtered assignments
        fetchCalendarAssignments() // Refresh calendar assignments for colors
      ]);
    } catch (error) {
      console.error('Error toggling assignment completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment status. Please try again.',
        variant: 'destructive',
      });
    }
  }, [allAssignments, calendarAssignments, toast, fetchAssignments, fetchCalendarAssignments, session?.user?.role]);

  const handleToggleUploadedToQ = useCallback(async (assignmentId: string, uploaded: boolean) => {
    try {
      const assignment = allAssignments.find(a => a.id === assignmentId)
        ?? calendarAssignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.error('Assignment not found for ID:', assignmentId);
        return;
      }

      // Only ADMIN can uncheck "Uploaded to Q" once it's been checked
      if (!uploaded && assignment.status === 'IN_PROGRESS' && session?.user?.role !== 'ADMIN') {
        toast({
          title: 'Access Denied',
          description: 'Only Admin users can uncheck "Uploaded to Q" once it has been marked.',
          variant: 'destructive',
        });
        return;
      }

      // If unchecking "Uploaded to Q" but assignment is completed, prevent action
      if (!uploaded && assignment.status === 'COMPLETED') {
        toast({
          title: 'Cannot change status',
          description: 'Cannot uncheck "Uploaded to Q" for completed assignments. Please uncheck "Done" first.',
          variant: 'destructive',
        });
        return;
      }

      const updateData = {
        id: assignmentId,
        name: assignment.name,
        dueDate: new Date(assignment.dueDate).toISOString(),
        status: uploaded ? 'IN_PROGRESS' as const : 'PENDING' as const,
        priority: assignment.priority as 'LOW' | 'NORMAL' | 'URGENT',
        assignedToId: assignment.assignedToId || undefined,
        description: assignment.description || '',
        author: assignment.author || '',
        sourceLocation: assignment.sourceLocation || '',
      };

      console.log('Toggle uploaded to Q - Update data being sent:', updateData);
      await api.updateAssignment(updateData);
      await Promise.all([
        fetchAssignments(), // Refresh filtered assignments
        fetchCalendarAssignments() // Refresh calendar assignments for colors
      ]);
    } catch (error) {
      console.error('Error toggling uploaded to Q status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment status. Please try again.',
        variant: 'destructive',
      });
    }
  }, [allAssignments, calendarAssignments, toast, fetchAssignments, fetchCalendarAssignments, session?.user?.role]);

  const displaySelectedDateString = selectedDate ? format(selectedDate, 'PPP', { locale: dateLocale }) : getTranslation(currentLang, 'None');

  let workAssignmentsCardTitleKey = 'WorkAssignmentsForDate';
  let workAssignmentsCardTitleParams: Record<string, string> = { date: displaySelectedDateString };
  let workAssignmentsCardDescriptionKey = 'CalendarDescription';

  if (searchTerm.trim() !== '') {
    workAssignmentsCardTitleKey = 'WorkAssignmentsSearch_title';
    workAssignmentsCardTitleParams = { searchTerm: searchTerm };
    workAssignmentsCardDescriptionKey = 'WorkAssignmentsSearch_description';
  }

  if (summaryFilter) {
    const summaryTitleKeys: Record<AssignmentSummaryFilter, string> = {
      'mine-today': 'AssignmentSummaryMyToday',
      'mine-upcoming': 'AssignmentSummaryMyNextSeven',
      'mine-overdue': 'AssignmentSummaryMyOverdue',
      'others-today': 'AssignmentSummaryOthersToday',
      'team-today': 'AssignmentSummaryTeamToday',
      'team-upcoming': 'AssignmentSummaryTeamNextSeven',
      'team-overdue': 'AssignmentSummaryTeamOverdue',
      unassigned: 'AssignmentSummaryUnassigned',
    };
    workAssignmentsCardTitleKey = summaryTitleKeys[summaryFilter];
    workAssignmentsCardTitleParams = {};
    workAssignmentsCardDescriptionKey = 'AssignmentSummaryFilteredDescription';
  }
  
  const workAssignmentsTitle = getTranslation(currentLang, workAssignmentsCardTitleKey, workAssignmentsCardTitleParams);
  const workAssignmentsDescription = getTranslation(currentLang, workAssignmentsCardDescriptionKey);

  if ((loading && !initialDataLoaded) || !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'Loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{getTranslation(currentLang, 'AssignmentsDashboardTitle')}</h1>
      </div>
      <AssignmentWorkloadSummary
        activeFilter={summaryFilter}
        error={summaryError}
        loading={summaryLoading}
        metrics={assignmentSummary}
        onRetry={() => void fetchCalendarAssignments()}
        onSelect={handleSummarySelect}
        role={session.user.role}
        userName={session.user.name?.trim() || session.user.email.split('@')[0]}
      />
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="xl:col-span-3">
          <Card className="h-full">
            <CardHeader className="space-y-4 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
                <div className="flex-grow">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{workAssignmentsTitle}</CardTitle>
                  <CardDescription className="text-sm">{workAssignmentsDescription}</CardDescription>
                </div>
                {(session.user.role === 'PRODUCER' || session.user.role === 'ADMIN') && (
                  <Button 
                    onClick={() => { setEditingAssignment(null); setIsAssignmentModalOpen(true); }} 
                    size="default"
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {getTranslation(currentLang, 'NewAssignmentButton')}
                  </Button>
                )}
              </div>
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label={getTranslation(currentLang, 'SearchCardTitle')}
                  placeholder={getTranslation(currentLang, 'SearchAssignmentsPlaceholder')}
                  className="h-11 w-full pl-9"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSummaryFilter(null);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadError ? (
                <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'LoadFailed')}</p>
                  <Button variant="outline" onClick={() => void Promise.all([fetchAssignments(), fetchCalendarAssignments()])}>
                    {getTranslation(currentLang, 'Retry')}
                  </Button>
                </div>
              ) : assignmentsToDisplay.length > 0 ? (
                <AssignmentTable
                  assignments={assignmentsToDisplay}
                  openAssignmentId={requestedAssignmentId}
                  onEditAssignment={handleOpenEditModal}
                  onDeleteAssignment={handleDeleteAssignment}
                  onToggleComplete={handleToggleComplete}
                  onToggleUploadedToQ={handleToggleUploadedToQ}
                />
              ) : (
                <div className="text-center py-10">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-semibold text-foreground">
                    {searchTerm.trim() !== ''
                      ? getTranslation(currentLang, 'NoAssignmentsFoundSearch')
                      : getTranslation(currentLang, 'NoAssignmentsForDay')}
                  </p>
                  {searchTerm.trim() === '' && (session.user.role === 'PRODUCER' || session.user.role === 'ADMIN') && (
                    <p className="text-muted-foreground">
                      {getTranslation(currentLang, 'ProducersCanAddNewAssignments')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                {getTranslation(currentLang, 'CalendarTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center">
              <InteractiveCalendar
                onDateSelect={handleDateSelect}
                initialDate={selectedDate}
                completedDays={completedTaskDays}
                incompleteDays={incompleteTaskDays}
              />
            </CardContent>
            <CardFooter className="flex-col items-start space-y-1 pt-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--calendar-selected-day-bg))] mr-2 shrink-0"></div>
                <span>{getTranslation(currentLang, 'CalendarSelectedDayLegend')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--calendar-tasks-completed-bg))] mr-2 shrink-0"></div>
                <span>{getTranslation(currentLang, 'CalendarTasksCompletedLegend')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--calendar-tasks-incomplete-bg))] mr-2 shrink-0"></div>
                <span>{getTranslation(currentLang, 'CalendarTasksIncompleteLegend')}</span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                {getTranslation(currentLang, 'TeamScheduleTitle')}
              </CardTitle>
              <CardDescription className="text-sm">
                 {getTranslation(currentLang, 'TeamScheduleDescription', { date: formattedSelectedDateString || displaySelectedDateString })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-primary flex items-center">
                  <Users className="mr-2 h-4 w-4" /> {getTranslation(currentLang, 'ProducersOnDuty')}
                </h4>
                {teamForSelectedDay.producers.length > 0 ? (
                  <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                    {teamForSelectedDay.producers.map(p => (
                      <li key={p.id} className="flex items-center gap-2">
                        {p.shiftColor && (
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: p.shiftColor }}
                            title={p.shiftColor}
                          />
                        )}
                        <span>{p.name}</span>
                        {p.timeRange ? (
                          <span className="text-xs text-muted-foreground">({p.timeRange})</span>
                        ) : p.shiftHours && (
                          <span className="text-xs text-muted-foreground">({p.shiftHours})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">{getTranslation(currentLang, 'NoneScheduled')}</p>
                )}
              </div>
              <hr className="border-border" />
              <div>
                <h4 className="text-sm font-medium text-primary flex items-center">
                  <Users className="mr-2 h-4 w-4" /> {getTranslation(currentLang, 'OperatorsOnDuty')}
                </h4>
                {teamForSelectedDay.operators.length > 0 ? (
                  <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                    {teamForSelectedDay.operators.map(o => (
                      <li key={o.id} className="flex items-center gap-2">
                        {o.shiftColor && (
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: o.shiftColor }}
                            title={o.shiftColor}
                          />
                        )}
                        <span>{o.name}</span>
                        {o.timeRange ? (
                          <span className="text-xs text-muted-foreground">({o.timeRange})</span>
                        ) : o.shiftHours && (
                          <span className="text-xs text-muted-foreground">({o.shiftHours})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">{getTranslation(currentLang, 'NoneScheduled')}</p>
                )}
              </div>
              {(teamForSelectedDay.producers.length === 0 && teamForSelectedDay.operators.length === 0) && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {getTranslation(currentLang, 'NoProducersOrOperatorsScheduled')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <NewAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => { setIsAssignmentModalOpen(false); setEditingAssignment(null); }}
        onSaveAssignment={handleSaveAssignment}
        assignmentToEdit={editingAssignment}
        availableOperators={operators.filter(op => op.name !== null).map(op => ({ id: op.id, name: op.name! }))}
      />
    </div>
  );
}
