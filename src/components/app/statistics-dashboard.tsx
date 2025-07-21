
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { ListChecks, PieChart as PieChartIcon, Users, AreaChart as AreaChartIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatisticsAction } from '@/app/actions/statistics';
// Local type definition for statistics data
type GenerateStatisticsOutput = {
  producerStats: { producerId: string; assignmentsCreated: number; }[];
  operatorStats: { operatorId: string; assignmentsCompleted: number; assignmentsCommented: number; }[];
  totalAssignmentsCreated: number;
  totalAssignmentsCompleted: number;
  mostActiveProducer: string;
  mostActiveOperator: string;
};
import { DailyCompletionsPieChart } from '@/components/app/charts/daily-completions-pie-chart';
import { MonthlyCompletionsTrendChart } from '@/components/app/charts/monthly-completions-trend-chart';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

// Empty data structure for charts
const emptyPieData = [
  { name: 'Pending', value: 0, fill: 'hsl(var(--chart-3))' },
  { name: 'In Progress', value: 0, fill: 'hsl(var(--chart-4))' },
  { name: 'Urgent', value: 0, fill: 'hsl(var(--chart-5))' },
  { name: 'Completed', value: 0, fill: 'hsl(var(--chart-1))' },
];

export function StatisticsDashboard() {
  const { currentLang } = useLanguage();
  const [statsData, setStatsData] = React.useState<GenerateStatisticsOutput | null>(null);
  const [userActivityDate, setUserActivityDate] = React.useState<Date>(new Date(2025, 4, 21)); // Default to May 21st, 2025
  const [trendChartMonth, setTrendChartMonth] = React.useState<Date>(new Date(2025, 4, 1)); // Default to May 2025

  React.useEffect(() => {
    // Fetch initial overall statistics (e.g., for last 30 days or a default range)
    async function fetchInitialStats() {
      const thirtyDaysAgo = subMonths(new Date(),1); // Example: last 30 days
      const today = new Date();
      const result = await getStatisticsAction({
        startDate: format(startOfMonth(thirtyDaysAgo), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      });
      if (!('error' in result)) {
        setStatsData(result);
      } else {
        console.error("Error fetching initial stats:", result.error);
      }
    }
    fetchInitialStats();
  }, []);

  const handlePrevMonth = () => {
    setTrendChartMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setTrendChartMonth(prev => addMonths(prev, 1));
  };
  
  // Status breakdown from actual data
  const statusBreakdown = {
    pending: 0,
    inProgress: 0,
    urgent: 0,
    completed: statsData?.totalAssignmentsCompleted || 0,
  };

  // Overall activity from actual data
  const overallActivity = {
    totalAssignments: statsData?.totalAssignmentsCreated || 0,
    firstAssignment: '',
    lastAssignment: '',
    uniqueDays: 0,
    avgPerDay: 0,
    busiestDay: '',
    busiestMonth: '',
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assignment Overview Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary" />
            {getTranslation(currentLang, 'StatisticsAssignmentOverviewTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-muted-foreground mb-1">{getTranslation(currentLang, 'StatisticsStatusBreakdown')}</h4>
            <p>{getTranslation(currentLang, 'AssignmentStatusPending')}: {statusBreakdown.pending}</p>
            <p>{getTranslation(currentLang, 'AssignmentStatusInProgress')}: {statusBreakdown.inProgress}</p>
            {/* For "Urgent", we might need to clarify if this is a priority count or a status */}
            <p>{getTranslation(currentLang, 'PriorityUrgent')}: {statusBreakdown.urgent}</p> 
            <p>{getTranslation(currentLang, 'AssignmentStatusCompleted')}: {statusBreakdown.completed}</p>
          </div>
          <hr className="border-[hsl(var(--border))]" />
          <div>
            <h4 className="font-semibold text-muted-foreground mb-1">{getTranslation(currentLang, 'StatisticsOverallActivity')}</h4>
            <p>{getTranslation(currentLang, 'TotalAssignmentsCreated')}: {overallActivity.totalAssignments}</p>
            <p>{getTranslation(currentLang, 'StatisticsFirstAssignment')}: {overallActivity.firstAssignment}</p>
            <p>{getTranslation(currentLang, 'StatisticsLastAssignment')}: {overallActivity.lastAssignment}</p>
            <p>{getTranslation(currentLang, 'StatisticsUniqueDaysWithActivity')}: {overallActivity.uniqueDays}</p>
            <p>{getTranslation(currentLang, 'StatisticsAvgAssignmentsPerActiveDay')}: {overallActivity.avgPerDay}</p>
            <p>{getTranslation(currentLang, 'StatisticsBusiestDay')}: {overallActivity.busiestDay}</p>
            <p>{getTranslation(currentLang, 'StatisticsBusiestMonth')}: {overallActivity.busiestMonth}</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Completions Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
            {getTranslation(currentLang, 'StatisticsDailyCompletionsTitle')}
          </CardTitle>
          <CardDescription>
            {getTranslation(currentLang, 'StatisticsDailyCompletionsDescription', { month: format(new Date(2025,4,1), 'MMMM yyyy')})}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <DailyCompletionsPieChart data={emptyPieData} />
          <p className="text-xs text-muted-foreground mt-2">
            {getTranslation(currentLang, 'StatisticsMostCompletionsOn', { date: 'May 16', count: '3' })}
          </p>
        </CardContent>
      </Card>

      {/* User Activity Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
              <CardTitle className="flex items-center mb-1 sm:mb-0">
                <Users className="mr-2 h-5 w-5 text-primary" />
                {getTranslation(currentLang, 'StatisticsUserActivityTitle')}
              </CardTitle>
              <CardDescription>
                {getTranslation(currentLang, 'StatisticsStatsForDate', { date: format(userActivityDate, 'MMMM do, yyyy') })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-normal h-9 text-xs",
                      !userActivityDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {userActivityDate ? format(userActivityDate, "PPP") : <span>{getTranslation(currentLang, 'PickDatePlaceholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={userActivityDate}
                    onSelect={(date) => setUserActivityDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" className="h-9 text-xs">{getTranslation(currentLang, 'StatisticsDayViewButton')}</Button>
              <Button variant="outline" size="sm" className="h-9 text-xs">{getTranslation(currentLang, 'StatisticsMonthViewButton')}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-primary mb-2">
              {getTranslation(currentLang, 'StatisticsProducersAssignmentsCreated')}
            </h3>
            {statsData && statsData.producerStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getTranslation(currentLang, 'StatisticsProducerName')}</TableHead>
                    <TableHead className="text-right">{getTranslation(currentLang, 'StatisticsAssignmentsCreated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.producerStats.map((producer) => (
                    <TableRow key={producer.producerId}>
                      <TableCell>{producer.producerId}</TableCell>
                      <TableCell className="text-right">{producer.assignmentsCreated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'UserActivityTableNoData')}</p>
            )}
          </div>
          <div>
            <h3 className="text-md font-semibold text-primary mb-2">
              {getTranslation(currentLang, 'StatisticsOperatorsAssignmentsCompleted')}
            </h3>
             {statsData && statsData.operatorStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getTranslation(currentLang, 'StatisticsOperatorName')}</TableHead>
                    <TableHead className="text-right">{getTranslation(currentLang, 'UserActivityTableAssignmentsCompleted')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.operatorStats.map((operator) => (
                    <TableRow key={operator.operatorId}>
                      <TableCell>{operator.operatorId}</TableCell>
                      <TableCell className="text-right">{operator.assignmentsCompleted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'UserActivityTableNoData')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Completions Trend Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <AreaChartIcon className="mr-2 h-5 w-5 text-primary" />
                {getTranslation(currentLang, 'StatisticsMonthlyCompletionsTrendTitle')}
              </CardTitle>
              <CardDescription>
                {getTranslation(currentLang, 'StatisticsMonthlyCompletionsTrendDescription', { month: format(trendChartMonth, 'MMMM yyyy') })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-28 text-center">{format(trendChartMonth, 'MMMM yyyy')}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlyCompletionsTrendChart selectedMonth={trendChartMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
