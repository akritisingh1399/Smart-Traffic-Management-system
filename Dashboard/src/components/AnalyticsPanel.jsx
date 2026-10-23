import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  ComposedChart
} from 'recharts';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

function AnalyticsPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('load'); // 'load' | 'vehicles'

  useEffect(() => {
    let isMounted = true;
    const loadForecast = async () => {
      try {
        const res = await api.getForecast();
        if (isMounted && res && Array.isArray(res.forecast)) {
          setData(res.forecast);
        }
      } catch (err) {
        console.warn('Forecast fetch failed, using fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadForecast();
    return () => {
      isMounted = false;
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const loadVal = payload.find((p) => p.dataKey === 'loadPercentage')?.value;
      const vehicleVal = payload.find((p) => p.dataKey === 'vehicles')?.value;
      const incidentVal = payload.find((p) => p.dataKey === 'incidents')?.value;

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-gray-300 uppercase mb-2 border-b border-gray-700 pb-1">
            Time Slot: {label}
          </p>
          {loadVal !== undefined && (
            <p className="text-xs text-blue-400 font-semibold">
              Congestion Load: <span className="text-white text-sm">{loadVal}%</span>
            </p>
          )}
          {vehicleVal !== undefined && (
            <p className="text-xs text-indigo-400 font-semibold">
              Estimated Volume: <span className="text-white text-sm">{vehicleVal.toLocaleString()} cars</span>
            </p>
          )}
          {incidentVal !== undefined && (
            <p className="text-xs text-red-400 font-semibold">
              Predicted Risk Incidents: <span className="text-white text-sm">{incidentVal}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-gray-100">AI Traffic Load Forecast</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              LSTM Neural Net
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Predictive congestion curve & incident risk forecasting across the city network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetric('load')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'load'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            Congestion Load %
          </button>
          <button
            onClick={() => setMetric('vehicles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'vehicles'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            Vehicle Volume
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        {loading && data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mr-3" />
            Generating neural network forecast...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="vehicleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="hour" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              {metric === 'load' ? (
                <Area
                  type="monotone"
                  dataKey="loadPercentage"
                  name="Congestion %"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#loadGradient)"
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="vehicles"
                  name="Vehicle Volume"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#vehicleGradient)"
                />
              )}
              <Bar dataKey="incidents" barSize={12} fill="#ef4444" opacity={0.7} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-500 rounded" /> Congestion Curve
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded" /> Predicted Risk Incidents
          </span>
        </div>
        <span>Next 24h predictive horizon</span>
      </div>
    </div>
  );
}

export default AnalyticsPanel;