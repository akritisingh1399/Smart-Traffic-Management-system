import React from 'react';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Traffic Analytics</h1>
        <p className="text-gray-400">Comprehensive traffic data analysis and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Total Vehicles Today', value: '45,328', change: '+12.5%', trend: 'up', color: 'blue' },
          { label: 'Average Speed', value: '38 km/h', change: '-2.3%', trend: 'down', color: 'emerald' },
          { label: 'Incidents', value: '23', change: '+5', trend: 'up', color: 'red' },
          { label: 'System Efficiency', value: '94%', change: '+4.1%', trend: 'up', color: 'purple' }
        ].map((stat, index) => (
          <div key={index} className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="ml-1">{stat.change}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <AnalyticsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-6">Peak Traffic Hours</h3>
          <div className="space-y-4">
            {[
              { time: '07:00 - 09:00', vehicles: 8234, percentage: 85 },
              { time: '12:00 - 14:00', vehicles: 6521, percentage: 67 },
              { time: '17:00 - 19:00', vehicles: 9102, percentage: 94 },
              { time: '20:00 - 22:00', vehicles: 4231, percentage: 44 }
            ].map((period, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{period.time}</span>
                  <span className="text-gray-400">{period.vehicles.toLocaleString()} vehicles</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: `${period.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-gray-200 mb-6">Traffic Distribution</h3>
          <div className="space-y-4">
            {[
              { zone: 'Downtown Core', percentage: 35, vehicles: '15,865', color: 'red' },
              { zone: 'Financial District', percentage: 28, vehicles: '12,692', color: 'yellow' },
              { zone: 'Residential Areas', percentage: 22, vehicles: '9,972', color: 'emerald' },
              { zone: 'Industrial Zone', percentage: 15, vehicles: '6,799', color: 'blue' }
            ].map((zone, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{zone.zone}</span>
                  <span className="text-gray-400">{zone.vehicles} ({zone.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${zone.color}-500`}
                    style={{ width: `${zone.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;