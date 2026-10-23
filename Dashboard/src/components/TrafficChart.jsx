import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';

function TrafficChart() {
  const trafficData = [
    { time: '6:00', vehicles: 120, congestion: 'low' },
    { time: '8:00', vehicles: 450, congestion: 'high' },
    { time: '10:00', vehicles: 280, congestion: 'medium' },
    { time: '12:00', vehicles: 320, congestion: 'medium' },
    { time: '14:00', vehicles: 210, congestion: 'low' },
    { time: '16:00', vehicles: 510, congestion: 'high' },
    { time: '18:00', vehicles: 480, congestion: 'high' },
    { time: '20:00', vehicles: 190, congestion: 'low' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-primary-600">Vehicles: {payload[0].value}</p>
          <p className="text-gray-600">Status: {payload[0].payload.congestion}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trafficData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            label={{ 
              value: 'Vehicles per hour', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#6b7280'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="vehicles" 
            stroke="#3f51b5" 
            fill="#3f51b5" 
            fillOpacity={0.1}
            strokeWidth={3}
          />
          <Line 
            type="monotone" 
            dataKey="vehicles" 
            stroke="#1a237e" 
            strokeWidth={2}
            dot={{ stroke: '#1a237e', strokeWidth: 2, r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrafficChart;