"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GlassWidget, GlassHeader, GlassContent } from './ui/GlassWidget';

interface GenreData {
  name: string;
  count: number;
}

interface GenreChartProps {
  genres: GenreData[];
}

const COLORS = [
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
];

export function GenreChart({ genres }: GenreChartProps) {
  const data = genres.slice(0, 8).map((genre, index) => ({
    name: genre.name,
    value: genre.count,
    color: COLORS[index % COLORS.length]
  }));

  // total calculation removed as it was unused

  return (
    <GlassWidget className="md:col-span-2 row-span-2">
      <GlassHeader>
        <h3 className="font-semibold">Genre Distribution</h3>
      </GlassHeader>
      <GlassContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [`${value} tracks`, 'Count']}
            />
          </PieChart>
        </ResponsiveContainer>
      </GlassContent>
    </GlassWidget>
  );
}
