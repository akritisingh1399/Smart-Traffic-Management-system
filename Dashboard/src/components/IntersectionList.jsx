import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Siren, Clock, Car, Gauge } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

function IntersectionList() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial signals from REST API
    const loadSignals = async () => {
      try {
        const data = await api.getLiveSignals();
        if (isMounted && data && data.length > 0) {
          setSignals(data);
        }
      } catch (err) {
        console.warn('Could not load live signals:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSignals();

    // Listen to real-time WebSockets
    const handleSignalsUpdate = (updatedSignals) => {
      if (!isMounted) return;
      setSignals((prev) => {
        // Merge or replace updated signals
        const map = new Map(prev.map((s) => [s._id || s.id, s]));
        updatedSignals.forEach((s) => map.set(s._id || s.id, s));
        return Array.from(map.values());
      });
    };

    const handleSingleSignalUpdate = (updatedSignal) => {
      if (!isMounted) return;
      setSignals((prev) =>
        prev.map((s) => ((s._id || s.id) === (updatedSignal._id || updatedSignal.id) ? updatedSignal : s))
      );
    };

    const handleInitialState = (data) => {
      if (!isMounted) return;
      if (data && data.signals) {
        setSignals(data.signals);
        setLoading(false);
      }
    };

    socket.on('signalsUpdate', handleSignalsUpdate);
    socket.on('signalUpdate', handleSingleSignalUpdate);
    socket.on('initialState', handleInitialState);

    return () => {
      isMounted = false;
      socket.off('signalsUpdate', handleSignalsUpdate);
      socket.off('signalUpdate', handleSingleSignalUpdate);
      socket.off('initialState', handleInitialState);
    };
  }, []);

  // Emergency Vehicle Preemption toggle
  const handleToggleEmergency = async (signalId) => {
    setActionLoadingId(signalId);
    try {
      await api.toggleEmergency(signalId);
    } catch (err) {
      console.error('Failed to toggle emergency priority:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (congestion) => {
    switch (congestion?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'low':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  };

  const getPhaseIndicator = (phase, emergency) => {
    if (emergency) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
          <Siren className="w-3.5 h-3.5 text-purple-400 animate-spin" />
          EVP ACTIVE
        </span>
      );
    }

    switch (phase?.toLowerCase()) {
      case 'green':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Green Phase
          </span>
        );
      case 'yellow':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Yellow Phase
          </span>
        );
      case 'red':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/40">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Red Phase
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 shadow-xl">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            Intersection Status
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800/50">
              Live IoT Feed
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time signal phases and adaptive green time allocation</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">WebSocket Connected</span>
        </div>
      </div>

      {loading && signals.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
          Loading intersection telemetry...
        </div>
      ) : signals.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No active intersections found</div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig) => {
            const id = sig._id || sig.id;
            const isHigh = sig.congestionLevel === 'high';
            return (
              <div
                key={id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                  sig.emergencyOverride
                    ? 'bg-purple-950/20 border-purple-800/60'
                    : 'bg-gray-800/40 hover:bg-gray-800/70 border-gray-700/50'
                }`}
              >
                {/* Left: Location & Phase */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                      sig.currentPhase === 'green'
                        ? 'bg-emerald-500 shadow-emerald-500/50 shadow-md'
                        : sig.currentPhase === 'yellow'
                        ? 'bg-amber-400 shadow-amber-400/50 shadow-md'
                        : 'bg-red-500 shadow-red-500/50 shadow-md'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-100 text-sm">{sig.location}</h3>
                      {sig.city && (
                        <span className="text-[10px] text-gray-400 bg-gray-700/60 px-1.5 py-0.5 rounded">
                          {sig.city}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Timer: <strong className="text-gray-200">{sig.timer || 45}s</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-amber-400" />
                        Vehicles: <strong className="text-gray-200">{sig.vehicleCount || 20}</strong>
                      </span>
                      {sig.avgSpeed && (
                        <span className="flex items-center gap-1 hidden md:flex">
                          <Gauge className="w-3.5 h-3.5 text-purple-400" />
                          Speed: <strong className="text-gray-200">{sig.avgSpeed} km/h</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & EVP Emergency Control */}
                <div className="flex items-center gap-2.5 mt-3 sm:mt-0 justify-end">
                  {getPhaseIndicator(sig.currentPhase, sig.emergencyOverride)}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadge(sig.congestionLevel)}`}>
                    {sig.congestionLevel || 'low'}
                  </span>

                  {/* Emergency Vehicle Preemption Button */}
                  <button
                    onClick={() => handleToggleEmergency(id)}
                    disabled={actionLoadingId === id}
                    title={sig.emergencyOverride ? 'Deactivate Emergency Priority' : 'Trigger Emergency Priority Green Wave'}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      sig.emergencyOverride
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-gray-700/60 hover:bg-purple-900/40 text-gray-300 hover:text-purple-300 border border-gray-600/40'
                    }`}
                  >
                    <Siren className="w-3.5 h-3.5" />
                    <span>{sig.emergencyOverride ? 'Clear EVP' : 'EVP Priority'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
        <span>Dynamic AI Adaptive Cycle Active</span>
        <span>Auto-adjusting cycle times</span>
      </div>
    </div>
  );
}

export default IntersectionList;