
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

// Pie chart data will be calculated dynamically
const generatePieData = (statsData: GenerateStatisticsOutput | null) => {
  if (!statsData) {
    return [
      { name: 'No Data', value: 1, fill: 'hsl(var(--muted))' },
    ];
  }
  
  const totalCreated = statsData.totalAssignmentsCreated;
  const totalCompleted = statsData.totalAssignmentsCompleted;
  const inProgress = Math.max(0, totalCreated - totalCompleted);
  
  if (totalCreated === 0) {
    return [
      { name: 'No Assignments', value: 1, fill: 'hsl(var(--muted))' },
    ];
  }
  
  return [
    { name: 'Completed', value: totalCompleted, fill: 'hsl(142 76% 36%)' },
    { name: 'In Progress', value: inProgress, fill: 'hsl(48 96% 53%)' },
  ].filter(item => item.value > 0);
};

export function StatisticsDashboard() {
  const { currentLang } = useLanguage();
  const [statsData, setStatsData] = React.useState<GenerateStatisticsOutput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userActivityDate, setUserActivityDate] = React.useState<Date>(new Date());
  const [trendChartMonth, setTrendChartMonth] = React.useState<Date>(new Date());

  React.useEffect(() => {
    // Fetch initial overall statistics (e.g., for last 30 days or a default range)
    async function fetchInitialStats() {
      try {
        setLoading(true);
        const thirtyDaysAgo = subMonths(new Date(), 1); // Last 30 days
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
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
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
    totalCreated: statsData?.totalAssignmentsCreated || 0,
    totalCompleted: statsData?.totalAssignmentsCompleted || 0,
    inProgress: Math.max(0, (statsData?.totalAssignmentsCreated || 0) - (statsData?.totalAssignmentsCompleted || 0)),
    completionRate: statsData?.totalAssignmentsCreated 
      ? Math.round((statsData.totalAssignmentsCompleted / statsData.totalAssignmentsCreated) * 100)
      : 0,
  };

  // Team performance data
  const teamPerformance = {
    totalProducers: statsData?.producerStats.length || 0,
    totalOperators: statsData?.operatorStats.length || 0,
    mostActiveProducer: statsData?.mostActiveProducer || 'None',
    mostActiveOperator: statsData?.mostActiveOperator || 'None',
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

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
            <h4 className="font-semibold text-muted-foreground mb-2">Assignment Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">{statusBreakdown.totalCreated}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Created</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-green-600 dark:text-green-400 font-semibold text-lg">{statusBreakdown.totalCompleted}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">{statusBreakdown.inProgress}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">In Progress</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                <p className="text-purple-600 dark:text-purple-400 font-semibold text-lg">{statusBreakdown.completionRate}%</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Completion Rate</p>
              </div>
            </div>
          </div>
          <hr className="border-[hsl(var(--border))]" />
          <div>
            <h4 className="font-semibold text-muted-foreground mb-2">Team Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Producers:</span>
                <span className="font-medium">{teamPerformance.totalProducers}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Operators:</span>
                <span className="font-medium">{teamPerformance.totalOperators}</span>
              </div>
              <div className="flex justify-between">
                <span>Top Producer:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{teamPerformance.mostActiveProducer}</span>
              </div>
              <div className="flex justify-between">
                <span>Top Operator:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{teamPerformance.mostActiveOperator}</span>
              </div>
            </div>
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
          <DailyCompletionsPieChart data={generatePieData(statsData)} />
          <div className="mt-3 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Assignment Status Distribution
            </p>
            {statsData && statsData.totalAssignmentsCreated > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {statusBreakdown.completionRate}% completion rate
              </p>
            )}
          </div>
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
