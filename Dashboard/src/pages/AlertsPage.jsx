import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Trash2, Siren } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const data = await api.getAlerts();
        if (isMounted && Array.isArray(data)) {
          setAlerts(data);
        }
      } catch (e) {
        console.warn('Could not load alerts:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAlerts();

    const handleNewAlert = (alert) => {
      if (isMounted) {
        setAlerts((prev) => [alert, ...prev.filter((a) => (a._id || a.id) !== (alert._id || alert.id))]);
      }
    };

    const handleAlertsCleared = () => {
      if (isMounted) setAlerts([]);
    };

    socket.on('alertUpdate', handleNewAlert);
    socket.on('alertsCleared', handleAlertsCleared);

    return () => {
      isMounted = false;
      socket.off('alertUpdate', handleNewAlert);
      socket.off('alertsCleared', handleAlertsCleared);
    };
  }, []);

  const handleClearAll = async () => {
    try {
      await api.clearAlerts();
      setAlerts([]);
    } catch (e) {
      console.error('Clear alerts error:', e);
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Siren className="h-5 w-5 text-purple-400 animate-pulse" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'low':
      default:
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'border-purple-500 bg-purple-500/10';
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-amber-500 bg-amber-500/10';
      case 'low':
      default:
        return 'border-emerald-500 bg-emerald-500/10';
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;
  const lowCount = alerts.filter((a) => a.severity === 'low' || !a.severity).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-200 mb-1">System Alerts & Incidents</h1>
        <p className="text-gray-400 text-sm">Real-time incident dispatch, sensor warnings, and priority wave tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Critical / EVP', count: criticalCount, color: 'purple' },
          { label: 'High Priority', count: highCount, color: 'red' },
          { label: 'Medium Priority', count: mediumCount, color: 'amber' },
          { label: 'Low / Info', count: lowCount, color: 'emerald' }
        ].map((stat, index) => (
          <div key={index} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.count}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-gray-200">Active Alert Stream</h3>
            <p className="text-xs text-gray-400">Live feeds streamed over WebSockets</p>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Alerts</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
            Loading incident feed...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 text-emerald-500/60 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-200 mb-1">Metropolitan Corridors Clear</h3>
            <p className="text-gray-400 text-xs">No active congestion warnings or emergency overrides logged</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const id = alert._id || alert.id;
              return (
                <div
                  key={id}
                  className={`border-l-4 ${getAlertColor(alert.severity)} rounded-xl p-4 transition-all bg-gray-800/40 border border-gray-700/40`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">{getAlertIcon(alert.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-100 text-sm uppercase tracking-wide">
                            {alert.severity || 'Notice'} Alert
                          </h4>
                          <span className="text-xs text-gray-400">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{alert.message}</p>
                        {alert.signalId?.location && (
                          <div className="mt-2 text-xs text-gray-400">
                            Location:{' '}
                            <span className="text-gray-200 font-medium">{alert.signalId.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPage;