
import React from 'react';
import { BatchResponse } from '../types';
import { getVariableLabel } from '../constants';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ResultsChartsProps {
  data: BatchResponse;
  selectedVars: string[];
}

const ResultsCharts: React.FC<ResultsChartsProps> = ({ data, selectedVars }) => {
  if (!data || !data.locations || data.locations.length === 0) {
    return <div className="text-center text-slate-500 p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">暂无数据，请运行查询。</div>;
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    // Format: MM-DD HH:mm
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}h`;
  };

  const COLORS = ['#2563eb', '#db2777', '#ea580c', '#16a34a', '#7c3aed', '#0891b2', '#be123c', '#b45309'];

  return (
    <div className="space-y-8">
      {selectedVars.map((varCode) => {
        // Resolve dynamic label
        const { label, unit } = getVariableLabel(varCode);
        
        // Prepare data for this specific variable
        const chartData = data.time_steps.map((time, timeIdx) => {
          const point: any = { time: formatTime(time), fullTime: time };
          
          data.locations.forEach((loc) => {
            const varData = loc.data.find(d => d.var === varCode);
            if (varData && varData.values[timeIdx] !== undefined) {
                point[loc.id] = parseFloat(varData.values[timeIdx].toFixed(2));
            }
          });
          return point;
        });

        // Determine if we have data for this variable
        const hasData = chartData.some(pt => Object.keys(pt).length > 2); // time + fullTime + at least one loc

        if (!hasData) return null;

        return (
          <div key={varCode} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{label}</h3>
                <p className="text-sm text-slate-500 mt-1">
                   变量代码: <span className="font-mono bg-slate-100 px-1 rounded text-xs">{varCode}</span> 
                   <span className="mx-2">|</span>
                   单位: <span className="font-mono font-semibold text-slate-700">{unit}</span>
                </p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    tickMargin={10}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{fontSize: 11, fill: '#64748b'}}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: unit, angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: '#94a3b8', fontSize: 12} }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}/>
                  
                  {data.locations.map((loc, idx) => (
                    <Line
                      key={loc.id}
                      type="monotone"
                      dataKey={loc.id}
                      name={`Lat: ${loc.lat}, Lon: ${loc.lon}`}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsCharts;
