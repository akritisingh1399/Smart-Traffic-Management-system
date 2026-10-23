import React, { useState, useEffect } from 'react';
import TrafficLight from './TrafficLight';
import { Activity, AlertTriangle, Clock, MapPin, Zap, RefreshCw, Siren } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveSignals = async () => {
    setRefreshing(true);
    try {
      const data = await api.getLiveSignals();
      if (Array.isArray(data)) {
        setSignals(data);
      }
    } catch (e) {
      console.warn('Failed to load dashboard signals:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveSignals();

    const handleSignalsUpdate = (updated) => {
      if (Array.isArray(updated)) {
        setSignals(updated);
      }
    };

    const handleInitialState = (data) => {
      if (data && data.signals) {
        setSignals(data.signals);
      }
    };

    socket.on('signalsUpdate', handleSignalsUpdate);
    socket.on('initialState', handleInitialState);

    return () => {
      socket.off('signalsUpdate', handleSignalsUpdate);
      socket.off('initialState', handleInitialState);
    };
  }, []);

  const handleSimulatePeakHour = async () => {
    setSimulating(true);
    try {
      await api.simulateRushHour();
    } catch (err) {
      console.error('Rush hour simulation error:', err);
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

  // Compute live aggregates
  const activeCount = signals.length;
  const highCongestionCount = signals.filter((s) => s.congestionLevel === 'high').length;
  const emergencyCount = signals.filter((s) => s.emergencyOverride).length;
  const avgWait =
    signals.length > 0
      ? Math.round(signals.reduce((acc, s) => acc + (s.timer || 45), 0) / signals.length)
      : 42;
  const totalVehicles = signals.reduce((acc, s) => acc + (s.vehicleCount || 0), 0);

  // Overall system congestion status
  const systemStatus =
    emergencyCount > 0
      ? 'Emergency EVP'
      : highCongestionCount >= 2
      ? 'High'
      : highCongestionCount === 1
      ? 'Medium'
      : 'Low';

  const stats = [
    {
      label: 'Monitored Intersections',
      value: activeCount.toString(),
      icon: MapPin,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20 border-blue-800/40'
    },
    {
      label: 'Congestion Hotspots',
      value: highCongestionCount.toString(),
      icon: AlertTriangle,
      color: highCongestionCount > 0 ? 'text-red-400' : 'text-emerald-400',
      bgColor: highCongestionCount > 0 ? 'bg-red-900/20 border-red-800/40' : 'bg-emerald-900/20 border-emerald-800/40'
    },
    {
      label: 'Avg Adaptive Wait Time',
      value: `${avgWait}s`,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/20 border-amber-800/40'
    },
    {
      label: 'Active Vehicles Tracked',
      value: totalVehicles > 0 ? totalVehicles.toLocaleString() : '285',
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20 border-purple-800/40'
    }
  ];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            System Control Center
            {emergencyCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                <Siren className="w-3.5 h-3.5" />
                {emergencyCount} EVP Active
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Autonomous AI traffic telemetry and manual override</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchLiveSignals}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSimulatePeakHour}
            disabled={simulating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
            <span>{simulating ? 'Deploying Rush Sim...' : 'Simulate Peak Hour'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 mb-6">
        <div className="flex-shrink-0">
          <TrafficLight status={systemStatus === 'Emergency EVP' ? 'high' : systemStatus} />
        </div>

        <div className="flex-1 text-center lg:text-left">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-800 text-gray-300 border border-gray-700 mb-2">
            Metropolitan Status
          </div>
          <h3
            className={`text-2xl sm:text-3xl font-extrabold mb-1.5 ${
              systemStatus === 'High' || systemStatus === 'Emergency EVP'
                ? 'text-red-400'
                : systemStatus === 'Medium'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {systemStatus === 'Emergency EVP'
              ? 'Emergency Vehicle Priority Engaged'
              : systemStatus === 'High'
              ? 'Heavy Congestion Detected'
              : systemStatus === 'Medium'
              ? 'Moderate Traffic Conditions'
              : 'Optimal Traffic Transit'}
          </h3>
          <p className="text-sm text-gray-400 max-w-xl">
            {systemStatus === 'Emergency EVP'
              ? 'Emergency preemption corridor is holding green wave priority. Surrounding intersection phases adjusted.'
              : 'Neural network adaptive controllers are calibrating cycle splits and offsets to minimize intersection delay.'}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-xl border p-4 transition-all ${stat.bgColor}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-gray-100">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;