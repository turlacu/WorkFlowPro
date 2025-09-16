
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
// import { getStatisticsAction } from '@/app/actions/statistics'; // Using API route instead
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
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userActivityDate, setUserActivityDate] = React.useState<Date>(new Date());
  const [trendChartMonth, setTrendChartMonth] = React.useState<Date>(new Date());

  React.useEffect(() => {
    // Fetch initial overall statistics (e.g., for last 30 days or a default range)
    async function fetchInitialStats() {
      try {
        setLoading(true);
        console.log('🔍 Fetching statistics...');
        
        // Use a broader date range to catch all data (last 6 months)
        const sixMonthsAgo = subMonths(new Date(), 6);
        const today = new Date();
        
        const startDate = format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        
        console.log('📅 Date range for statistics:', { startDate, endDate });
        
        const response = await fetch('/api/statistics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch statistics`);
        }
        
        const result = await response.json();
        
        console.log('📊 Full statistics result:', result);
        
        if (!('error' in result)) {
          console.log('✅ Statistics loaded successfully:', {
            totalCreated: result.totalAssignmentsCreated,
            totalCompleted: result.totalAssignmentsCompleted,
            producerCount: result.producerStats.length,
            operatorCount: result.operatorStats.length
          });
          setStatsData(result);
          setError(null);
        } else {
          console.error("❌ Error fetching initial stats:", result.error);
          setStatsData(null);
          setError(result.error);
        }
      } catch (fetchError) {
        console.error("❌ Exception while fetching statistics:", fetchError);
        setStatsData(null);
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error occurred');
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

  const handleRefreshStats = async (viewType: 'day' | 'month') => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing statistics for:', viewType, 'Date:', userActivityDate);
      
      let startDate: string;
      let endDate: string;
      
      if (viewType === 'day') {
        // For day view, use the selected date only
        startDate = format(userActivityDate, 'yyyy-MM-dd');
        endDate = format(userActivityDate, 'yyyy-MM-dd');
      } else {
        // For month view, use the entire month of the selected date
        startDate = format(startOfMonth(userActivityDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(userActivityDate), 'yyyy-MM-dd');
      }
      
      console.log('📅 Fetching statistics for date range:', { startDate, endDate });
      
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch statistics`);
      }
      
      const result = await response.json();
      
      if (!('error' in result)) {
        setStatsData(result);
        setError(null);
        console.log('✅ Statistics updated successfully');
      } else {
        console.error("Error fetching filtered stats:", result.error);
        setStatsData(null);
        setError(result.error);
      }
    } catch (refreshError) {
      console.error("Error refreshing statistics:", refreshError);
      setStatsData(null);
      setError(refreshError instanceof Error ? refreshError.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
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

  // Show error message if database connection failed
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h3 className="text-xl font-semibold">Database Connection Error</h3>
          <p className="text-muted-foreground max-w-md">
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show no data message if there are no assignments
  if (!statsData || (statsData.totalAssignmentsCreated === 0 && statsData.producerStats.length === 0 && statsData.operatorStats.length === 0)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">📊</div>
          <h3 className="text-xl font-semibold">No Statistics Available</h3>
          <p className="text-muted-foreground">
            No assignment data found to generate statistics. Create some assignments first to see statistics here.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.href = '/assignments'} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              Create Assignments
            </Button>
          </div>
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
                    className={cn(
                      "w-[200px] justify-start text-left font-normal h-9 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground",
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
              <Button 
                onClick={() => handleRefreshStats('day')}
                className="h-9 text-xs min-h-[44px] md:min-h-[36px] touch-manipulation border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {getTranslation(currentLang, 'StatisticsDayViewButton')}
              </Button>
              <Button 
                onClick={() => handleRefreshStats('month')}
                className="h-9 text-xs min-h-[44px] md:min-h-[36px] touch-manipulation border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {getTranslation(currentLang, 'StatisticsMonthViewButton')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-primary mb-2">
              {getTranslation(currentLang, 'StatisticsProducersAssignmentsCreated')}
            </h3>
            {statsData && statsData.producerStats.length > 0 ? (
              <>
                {/* Desktop Table - Hidden on mobile, visible md and up */}
                <div className="hidden md:block">
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
                </div>

                {/* Mobile Cards - Visible on mobile, hidden md and up */}
                <div className="block md:hidden space-y-3">
                  {statsData.producerStats.map((producer) => (
                    <div key={producer.producerId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {producer.producerId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{producer.producerId}</p>
                          <p className="text-xs text-muted-foreground">{getTranslation(currentLang, 'StatisticsProducerName')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{producer.assignmentsCreated}</p>
                        <p className="text-xs text-muted-foreground">{getTranslation(currentLang, 'StatisticsAssignmentsCreated')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{getTranslation(currentLang, 'UserActivityTableNoData')}</p>
            )}
          </div>
          <div>
            <h3 className="text-md font-semibold text-primary mb-2">
              {getTranslation(currentLang, 'StatisticsOperatorsAssignmentsCompleted')}
            </h3>
             {statsData && statsData.operatorStats.length > 0 ? (
              <>
                {/* Desktop Table - Hidden on mobile, visible md and up */}
                <div className="hidden md:block">
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
                </div>

                {/* Mobile Cards - Visible on mobile, hidden md and up */}
                <div className="block md:hidden space-y-3">
                  {statsData.operatorStats.map((operator) => (
                    <div key={operator.operatorId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {operator.operatorId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{operator.operatorId}</p>
                          <p className="text-xs text-muted-foreground">{getTranslation(currentLang, 'StatisticsOperatorName')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{operator.assignmentsCompleted}</p>
                        <p className="text-xs text-muted-foreground">{getTranslation(currentLang, 'UserActivityTableAssignmentsCompleted')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] touch-manipulation" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-28 text-center">{format(trendChartMonth, 'MMMM yyyy')}</span>
              <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] touch-manipulation" onClick={handleNextMonth}>
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
