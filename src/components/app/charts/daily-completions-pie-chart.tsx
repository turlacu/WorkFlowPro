
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

interface DailyCompletionsPieChartProps {
  data: { name: string; value: number; fill: string }[];
}

export function DailyCompletionsPieChart({ data }: DailyCompletionsPieChartProps) {
  const { currentLang } = useLanguage();

  // Ensure data is not empty for rendering the chart
  const chartData = data && data.length > 0 ? data : [{ name: 'No Data', value: 1, fill: 'hsl(var(--muted))' }];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={50} // This makes it a donut chart
          fill="#8884d8"
          dataKey="value"
          // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // Optional: for labels on slices
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
          formatter={(value: number, name: string) => [`${value} ${getTranslation(currentLang, 'assignments')}`, name]}
        />
        {/* 
        // Optional: Custom legend if needed, otherwise Tooltip provides info on hover
        <Legend 
            wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}
            formatter={(value, entry) => <span style={{ color: entry.color }}>{getTranslation(currentLang, value)}</span>}
        /> 
        */}
      </PieChart>
    </ResponsiveContainer>
  );
}
