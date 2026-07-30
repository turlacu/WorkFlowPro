
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

interface DailyCompletionsPieChartProps {
  data: { name: string; value: number; fill: string }[];
}

export function DailyCompletionsPieChart({ data }: DailyCompletionsPieChartProps) {
  const { currentLang } = useLanguage();

  // Ensure data is not empty for rendering the chart
  const chartData = data && data.length > 0 ? data : [{ name: 'No Data', value: 1, fill: 'hsl(var(--muted))' }];
  const chartSummary = chartData.map((item) => `${item.name}: ${item.value}`).join(', ');

  return (
    <div role="img" aria-label={`${getTranslation(currentLang, 'StatisticsDailyCompletionsTitle')}: ${chartSummary}`}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
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
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
