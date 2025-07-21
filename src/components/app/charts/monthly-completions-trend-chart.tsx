
'use client';

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

interface MonthlyCompletionsTrendChartProps {
  selectedMonth: Date;
  // data prop could be added here if real data is passed
}

export function MonthlyCompletionsTrendChart({ selectedMonth }: MonthlyCompletionsTrendChartProps) {
  const { currentLang } = useLanguage();

  const chartData = React.useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end }).map(day => ({
      date: format(day, 'MMM d'), // Format for X-axis label
      // Empty data for completed trend
      [getTranslation(currentLang, 'StatisticsChartLegendCompleted')]: 0, 
    }));
  }, [selectedMonth, currentLang]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 20, // Adjusted right margin for better label visibility
          left: -20, // Adjusted left margin
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false}
          interval="preserveStartEnd" // Show first and last tick
          // tickFormatter={(value, index) => index % 2 === 0 ? value : ''} // Show every other label
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          allowDecimals={false}
          domain={[0, 'dataMax + 1']} // Ensure y-axis starts at 0 and has some padding
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', marginBottom: '4px', fontWeight: 'bold' }}
          itemStyle={{ color: 'hsl(var(--chart-2))' }} // Using chart-2 for line color
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend 
            verticalAlign="bottom" 
            height={36}
            iconSize={10}
            wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))', paddingTop: '10px' }}
            payload={[{ value: getTranslation(currentLang, 'StatisticsChartLegendCompleted'), type: 'line', id: 'completed', color: 'hsl(var(--chart-2))' }]}
        />
        <Line
          type="monotone"
          dataKey={getTranslation(currentLang, 'StatisticsChartLegendCompleted')}
          stroke="hsl(var(--chart-2))" // Using chart-2 for line color
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1, fill: 'hsl(var(--chart-2))' }}
          activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
