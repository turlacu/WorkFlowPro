
'use client';

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

interface MonthlyCompletionsTrendChartProps {
  selectedMonth: Date;
}

interface DailyData {
  date: string;
  fullDate: string;
  completions: number;
}

export function MonthlyCompletionsTrendChart({ selectedMonth }: MonthlyCompletionsTrendChartProps) {
  const { currentLang } = useLanguage();
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchDailyCompletions() {
      try {
        setLoading(true);
        setError(null);
        
        const monthStr = format(selectedMonth, 'yyyy-MM');
        console.log('📊 Fetching daily completions for month:', monthStr);
        
        const response = await fetch('/api/statistics/daily-completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ month: monthStr }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch daily completions: ${response.status}`);
        }

        const result = await response.json();
        console.log('📈 Daily completions received:', result);

        // Transform the data for the chart
        const transformedData = result.dailyData.map((day: DailyData) => ({
          date: day.date,
          [getTranslation(currentLang, 'StatisticsChartLegendCompleted')]: day.completions,
        }));

        setChartData(transformedData);
      } catch (fetchError) {
        console.error('❌ Error fetching daily completions:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDailyCompletions();
  }, [selectedMonth, currentLang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Failed to load chart data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No completion data available for this month</p>
        </div>
      </div>
    );
  }

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
