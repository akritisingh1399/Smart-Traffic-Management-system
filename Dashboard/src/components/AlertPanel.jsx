import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle, Trash2, BellRing, Siren } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Load initial alerts from REST API
    const loadAlerts = async () => {
      try {
        const data = await api.getAlerts();
        if (isMounted && Array.isArray(data)) {
          setAlerts(data);
        }
      } catch (err) {
        console.warn('Could not load alerts:', err);
      }
    };

    loadAlerts();

    // Listen to real-time alerts
    const handleNewAlert = (alert) => {
      if (!isMounted) return;
      setAlerts((prev) => [alert, ...prev.filter((a) => (a._id || a.id) !== (alert._id || alert.id))].slice(0, 15));
    };

    const handleAlertsCleared = () => {
      if (!isMounted) return;
      setAlerts([]);
    };

    const handleInitialState = (data) => {
      if (!isMounted) return;
      if (data && data.alerts) {
        setAlerts(data.alerts);
      }
    };

    socket.on('alertUpdate', handleNewAlert);
    socket.on('alertsCleared', handleAlertsCleared);
    socket.on('initialState', handleInitialState);

    return () => {
      isMounted = false;
      socket.off('alertUpdate', handleNewAlert);
      socket.off('alertsCleared', handleAlertsCleared);
      socket.off('initialState', handleInitialState);
    };
  }, []);

  const handleClearAlerts = async () => {
    setClearing(true);
    try {
      await api.clearAlerts();
      setAlerts([]);
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    } finally {
      setClearing(false);
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-purple-950/30 border-l-4 border-purple-500 text-purple-200 border border-purple-800/40';
      case 'high':
        return 'bg-red-950/30 border-l-4 border-red-500 text-red-200 border border-red-800/40';
      case 'medium':
        return 'bg-amber-950/30 border-l-4 border-amber-500 text-amber-200 border border-amber-800/40';
      case 'low':
      default:
        return 'bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-200 border border-emerald-800/40';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Siren className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0 animate-pulse" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />;
      case 'low':
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-gray-100">Live Traffic Alerts</h2>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
              {alerts.length}
            </span>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            onClick={handleClearAlerts}
            disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
          </button>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm">All corridors operating normally.</p>
            <p className="text-xs text-gray-600 mt-1">No active incidents or preemption alerts.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id || alert.id || Math.random()}
              className={`p-3.5 rounded-xl transition-all ${getAlertStyles(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase font-bold tracking-wider opacity-80">
                      {alert.severity || 'Notice'}
                    </p>
                    <span className="text-[11px] text-gray-400">
                      {formatTime(alert.createdAt || alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-100 mt-0.5 leading-snug">
                    {alert.message}
                  </p>
                  {alert.signalId?.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      Intersection: <span className="text-gray-300 font-medium">{alert.signalId.location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> EVP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
          </span>
        </div>
        <span>Real-time dispatch</span>
      </div>
    </div>
  );
}

export default AlertPanel;