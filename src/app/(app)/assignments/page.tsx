
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AssignmentTable } from '@/components/app/assignment-table';
import { InteractiveCalendar } from '@/components/app/interactive-calendar';
import { NewAssignmentModal, type NewAssignmentFormValues } from '@/components/app/new-assignment-modal';
import { PlusCircle, Users, CalendarDays, ShieldCheck, Search } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import { api, type AssignmentWithUsers } from '@/lib/api';
import { User } from '@prisma/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithUsers[]>([]);
  const [calendarAssignments, setCalendarAssignments] = useState<AssignmentWithUsers[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [producers, setProducers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUsers | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [actualCurrentDate, setActualCurrentDate] = useState<Date | null>(null);
  const [teamForActualCurrentDay, setTeamForActualCurrentDay] = useState<{ producers: User[], operators: User[] }>({ producers: [], operators: [] });
  const [formattedActualCurrentDateString, setFormattedActualCurrentDateString] = useState<string>('');

  const { currentLang } = useLanguage();
  const { toast } = useToast();

  // Fetch initial data (only once on session load)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch operators and producers
        const [operatorsList, producersList] = await Promise.all([
          api.getUsers('OPERATOR'),
          api.getUsers('PRODUCER'),
        ]);
        
        setOperators(operatorsList);
        setProducers(producersList);

        // Set up current date info
        const today = new Date();
        setActualCurrentDate(today);
        setFormattedActualCurrentDateString(format(today, 'MMMM do, yyyy'));

        // Fetch team schedule for today
        const teamSchedule = await api.getTeamSchedule(format(today, 'yyyy-MM-dd'));
        const scheduledUsers = teamSchedule.map(schedule => schedule.user);
        const scheduledProducers = scheduledUsers.filter(user => user.role === 'PRODUCER');
        const scheduledOperators = scheduledUsers.filter(user => user.role === 'OPERATOR');
        
        setTeamForActualCurrentDay({
          producers: scheduledProducers,
          operators: scheduledOperators,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
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
  }, [session, initialDataLoaded]); // Only run once when session is available

  const fetchAssignments = useCallback(async () => {
    try {
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load assignments. Please try again.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, searchTerm, toast]);

  // Fetch all assignments for calendar colors (no date filter)
  const fetchCalendarAssignments = useCallback(async () => {
    try {
      const assignments = await api.getAssignments(); // No filters - get all assignments
      setCalendarAssignments(assignments);
    } catch (error) {
      console.error('Error fetching calendar assignments:', error);
    }
  }, []);

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

  // Initial fetch of assignments and calendar assignments
  useEffect(() => {
    if (session && initialDataLoaded) {
      Promise.all([
        fetchAssignments(),
        fetchCalendarAssignments()
      ]);
    }
  }, [session, initialDataLoaded, fetchAssignments, fetchCalendarAssignments]);


  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    // Only clear search if it's not already empty to avoid triggering search useEffect
    if (searchTerm.trim() !== '') {
      setSearchTerm('');
    }
  }, [searchTerm]);

  const assignmentsToDisplay = useMemo(() => {
    return allAssignments;
  }, [allAssignments]);

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
          dueDate: format(data.dueDate, 'yyyy-MM-dd\'T00:00:00.000Z\''),
          status: data.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
          priority: data.priority as 'LOW' | 'NORMAL' | 'URGENT',
          assignedToId: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
          description: data.description || '',
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
          dueDate: format(data.dueDate, 'yyyy-MM-dd\'T00:00:00.000Z\''),
          priority: data.priority as 'LOW' | 'NORMAL' | 'URGENT',
          assignedToId: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
          description: data.description || '',
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
  }, [currentLang, toast]);

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
      const assignment = allAssignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const updateData = {
        id: assignmentId,
        name: assignment.name,
        dueDate: format(new Date(assignment.dueDate), 'yyyy-MM-dd\'T00:00:00.000Z\''),
        status: completed ? 'COMPLETED' as const : 'PENDING' as const,
        priority: assignment.priority as 'LOW' | 'NORMAL' | 'URGENT',
        assignedToId: assignment.assignedToId || undefined,
        description: assignment.description || '',
        sourceLocation: assignment.sourceLocation || '',
      };

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
  }, [allAssignments, toast, fetchAssignments, fetchCalendarAssignments]);

  const displaySelectedDateString = selectedDate ? format(selectedDate, 'MMMM do, yyyy') : getTranslation(currentLang, 'None');
  const displayActualCurrentDateString = actualCurrentDate ? formattedActualCurrentDateString : getTranslation(currentLang, 'LoadingDate');

  let workAssignmentsCardTitleKey = 'WorkAssignmentsForDate';
  let workAssignmentsCardTitleParams: Record<string, string> = { date: displaySelectedDateString };
  let workAssignmentsCardDescriptionKey = 'CalendarDescription';

  if (searchTerm.trim() !== '') {
    workAssignmentsCardTitleKey = 'WorkAssignmentsSearch_title';
    workAssignmentsCardTitleParams = { searchTerm: searchTerm };
    workAssignmentsCardDescriptionKey = 'WorkAssignmentsSearch_description';
  }
  
  const workAssignmentsTitle = getTranslation(currentLang, workAssignmentsCardTitleKey, workAssignmentsCardTitleParams);
  const workAssignmentsDescription = getTranslation(currentLang, workAssignmentsCardDescriptionKey);

  if ((loading && !initialDataLoaded) || !session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>{getTranslation(currentLang, 'Loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{getTranslation(currentLang, 'AssignmentsDashboardTitle')}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <div className="flex-grow">
                  <CardTitle className="text-2xl">{workAssignmentsTitle}</CardTitle>
                  <CardDescription>{workAssignmentsDescription}</CardDescription>
                </div>
                {(session.user.role === 'PRODUCER' || session.user.role === 'ADMIN') && (
                  <Button onClick={() => { setEditingAssignment(null); setIsAssignmentModalOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {getTranslation(currentLang, 'NewAssignmentButton')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsToDisplay.length > 0 ? (
                <AssignmentTable
                  assignments={assignmentsToDisplay}
                  operators={operators.filter(op => op.name !== null).map(op => ({ id: op.id, name: op.name! }))}
                  onEditAssignment={handleOpenEditModal}
                  onDeleteAssignment={handleDeleteAssignment}
                  onToggleComplete={handleToggleComplete}
                />
              ) : (
                <div className="text-center py-10">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-semibold text-accent">
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

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">{getTranslation(currentLang, 'SearchCardTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={getTranslation(currentLang, 'SearchAssignmentsPlaceholder')}
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">
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

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">
                {getTranslation(currentLang, 'TeamScheduleTitle')}
              </CardTitle>
              <CardDescription>
                 {getTranslation(currentLang, 'TeamScheduleDescription', { date: displayActualCurrentDateString })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-primary flex items-center">
                  <Users className="mr-2 h-4 w-4" /> {getTranslation(currentLang, 'ProducersOnDuty')}
                </h4>
                {teamForActualCurrentDay.producers.length > 0 ? (
                  <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                    {teamForActualCurrentDay.producers.map(p => <li key={p.id}>{p.name}</li>)}
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
                {teamForActualCurrentDay.operators.length > 0 ? (
                  <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                    {teamForActualCurrentDay.operators.map(o => <li key={o.id}>{o.name}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">{getTranslation(currentLang, 'NoneScheduled')}</p>
                )}
              </div>
              {(teamForActualCurrentDay.producers.length === 0 && teamForActualCurrentDay.operators.length === 0) && (
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
