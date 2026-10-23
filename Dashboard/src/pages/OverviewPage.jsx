import React, { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import AnalyticsPanel from '../components/AnalyticsPanel';
import MapView from '../components/MapView';
import Dashboard from '../components/Dashboard';
import IntersectionList from '../components/IntersectionList';
import {
  AlertTriangle,
  Clock,
  Navigation,
  TrendingUp,
  Activity,
  CheckCircle,
  Car
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function OverviewPage() {
  const [signals, setSignals] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadOverviewData = async () => {
      try {
        const [sigData, alertData] = await Promise.all([
          api.getLiveSignals(),
          api.getAlerts()
        ]);
        if (isMounted) {
          if (Array.isArray(sigData)) setSignals(sigData);
          if (Array.isArray(alertData)) setAlerts(alertData);
        }
      } catch (err) {
        console.warn('Overview data load error:', err);
      }
    };

    loadOverviewData();

    const handleSignalsUpdate = (updated) => {
      if (isMounted && Array.isArray(updated)) setSignals(updated);
    };

    const handleAlertUpdate = (newAlert) => {
      if (isMounted) setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
    };

    socket.on('signalsUpdate', handleSignalsUpdate);
    socket.on('alertUpdate', handleAlertUpdate);

    return () => {
      isMounted = false;
      socket.off('signalsUpdate', handleSignalsUpdate);
      socket.off('alertUpdate', handleAlertUpdate);
    };
  }, []);

  const highCongestionCount = signals.filter((s) => s.congestionLevel === 'high').length;
  const avgWait =
    signals.length > 0
      ? Math.round(signals.reduce((acc, s) => acc + (s.timer || 45), 0) / signals.length)
      : 42;
  const totalVehicles = signals.reduce((acc, s) => acc + (s.vehicleCount || 0), 0);
  const flowRate = Math.max(40, Math.min(95, Math.round(100 - (highCongestionCount / (signals.length || 1)) * 40)));

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 py-4 sm:px-6 sm:py-6">
      {/* ================= HEADER ================= */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200">
          Traffic Operations Command
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Intelligent real-time traffic signal optimization and corridor monitoring
        </p>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Telemetry Engine Live</span>
          </div>
          <span className="text-xs text-gray-500">WebSocket Connected: Port 5500</span>
        </div>
      </div>

      {/* ================= QUICK STATS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Active Signals',
            value: signals.length > 0 ? signals.length.toString() : '6',
            note: 'All intersections reporting',
            color: 'blue',
            Icon: Navigation
          },
          {
            label: 'Network Flow Rate',
            value: `${flowRate}%`,
            note: flowRate > 70 ? 'Optimal conditions' : 'Peak load in effect',
            color: 'emerald',
            Icon: TrendingUp
          },
          {
            label: 'Avg Adaptive Wait',
            value: `${avgWait}s`,
            note: 'Dynamic green time',
            color: 'amber',
            Icon: Clock
          },
          {
            label: 'Congestion Alerts',
            value: alerts.length.toString(),
            note: alerts.length > 0 ? `${alerts.length} active notifications` : 'All clear',
            color: 'red',
            Icon: AlertTriangle
          }
        ].map(({ label, value, note, color, Icon }) => (
          <div
            key={label}
            className={`rounded-xl p-3 border bg-${color}-900/20 border-${color}-800/30`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs text-${color}-400 font-medium`}>{label}</p>
                <p className="text-lg sm:text-xl font-bold text-gray-200 mt-0.5">
                  {value}
                </p>
              </div>
              <Icon className={`w-5 h-5 text-${color}-400/60`} />
            </div>
            <p className={`text-xs text-${color}-300 mt-1 truncate`}>{note}</p>
          </div>
        ))}
      </div>

      {/* ================= CONTROL CENTER ================= */}
      <Dashboard />

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* ================= LEFT (MAP & ANALYTICS) ================= */}
        <div className="lg:col-span-2 space-y-5">
          {/* MAP */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
            <MapView />
          </div>

          {/* ANALYTICS */}
          <div>
            <AnalyticsPanel />
          </div>
        </div>

        {/* ================= RIGHT (INTERSECTIONS & ALERTS) ================= */}
        <div className="space-y-5">
          {/* LIVE INTERSECTION LIST */}
          <IntersectionList />

          {/* RECENT INCIDENTS / ALERTS */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <h2 className="text-sm sm:text-base font-semibold text-gray-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Live Incident Stream
              </h2>
              <span className="text-xs text-gray-500">Last 60 minutes</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  <CheckCircle className="w-6 h-6 text-emerald-500/50 mx-auto mb-1.5" />
                  No high priority incidents active.
                </div>
              ) : (
                alerts.slice(0, 5).map((alert, i) => (
                  <div
                    key={alert._id || i}
                    className="p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/70 transition-all text-xs"
                  >
                    <p className="font-semibold text-gray-200 leading-snug">{alert.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span className="uppercase text-red-400 font-bold">{alert.severity || 'high'}</span>
                      <span>
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
