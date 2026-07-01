import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PointsChartProps {
  data: { 
    name: string; 
    points: number;
    daily?: number;
    bonus?: number;
    bumper?: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-700 text-white min-w-[150px]">
        <p className="font-bold text-sm mb-2 pb-2 border-b border-slate-700">{label}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Total Points</span>
            <span className="font-bold text-indigo-400">{data.points} pts</span>
          </div>
          {data.daily !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Daily Points</span>
              <span className="font-medium text-slate-200">{data.daily} pts</span>
            </div>
          )}
          {data.bonus !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Bonus Points</span>
              <span className="font-medium text-slate-200">{data.bonus} pts</span>
            </div>
          )}
          {data.bumper !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Bumper Points</span>
              <span className="font-medium text-slate-200">{data.bumper} pts</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function PointsChart({ data }: PointsChartProps) {
  // Take top 10 and reverse them so it looks like a growing trend line from left to right
  const chartData = [...data].slice(0, 10).reverse();

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line 
            type="monotone" 
            dataKey="points" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4, fill: '#ffffff' }}
            activeDot={{ stroke: '#6366f1', strokeWidth: 2, r: 6, fill: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
