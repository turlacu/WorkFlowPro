
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; 

interface DailyCompletionData {
  date: string; // YYYY-MM-DD
  completed: number;
}

interface AssignmentsCompletedDailyChartProps {
  // This component might be deprecated or repurposed. 
  // For now, keeping its structure but it's not directly used in the new StatisticsDashboard design.
  // The new design uses MonthlyCompletionsTrendChart.
  data?: DailyCompletionData[]; // Make data optional for now
  selectedMonth: Date; 
}

export function AssignmentsCompletedDailyChart({ data, selectedMonth }: AssignmentsCompletedDailyChartProps) {
  const { currentLang } = useLanguage(); 
  const monthName = format(selectedMonth, 'MMMM yyyy');

  const chartData = React.useMemo(() => {
    if (data && data.length > 0) return data.map(d => ({ ...d, date: format(new Date(d.date), 'MMM d')})); 
    
    // Fallback to mock data if no real data is provided
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end }).map(day => ({
      date: format(day, 'MMM d'),
      completed: Math.floor(Math.random() * 15) + 1, 
    }));
  }, [data, selectedMonth]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTranslation(currentLang, 'AssignmentsCompletedDailyChartTitle')}</CardTitle>
        <CardDescription>
          {getTranslation(currentLang, 'AssignmentsCompletedDailyChartDescription', { monthName: monthName })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `${value}`} 
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--chart-1))' }}
              formatter={(value: number, name: string) => [`${value} ${getTranslation(currentLang, 'assignments')}`, getTranslation(currentLang, 'AssignmentsCompletedDailyChartTooltipCompleted')]}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(var(--foreground))' }} 
              payload={[{ value: getTranslation(currentLang, 'AssignmentsCompletedDailyChartTooltipCompleted'), type: 'square', id: 'completed', color: 'hsl(var(--chart-1))' }]}
            />
            <Bar dataKey="completed" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name={getTranslation(currentLang, 'AssignmentsCompletedDailyChartTooltipCompleted')} />
          </BarChart>
        </ResponsiveContainer>
         {(!data || data.length === 0) && (
           <p className="text-center text-muted-foreground mt-4">
             {getTranslation(currentLang, 'AssignmentsCompletedDailyChartPlaceholder')}
           </p>
         )}
      </CardContent>
    </Card>
  );
}
