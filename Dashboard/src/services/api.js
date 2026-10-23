// Dashboard/src/services/api.js

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5500/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Signals & Traffic status
  async getLiveSignals() {
    try {
      const res = await fetch(`${API_BASE}/traffic/live-status`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch signals');
      return await res.json();
    } catch (err) {
      console.warn('API getLiveSignals error, using fallback:', err.message);
      return [];
    }
  },

  // Toggle Emergency Vehicle Preemption
  async toggleEmergency(signalId) {
    const res = await fetch(`${API_BASE}/traffic/emergency/${signalId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Simulate rush hour surge across the network
  async simulateRushHour() {
    const res = await fetch(`${API_BASE}/traffic/simulate-rush-hour`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Alerts
  async getAlerts() {
    try {
      const res = await fetch(`${API_BASE}/traffic/alerts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return await res.json();
    } catch (err) {
      console.warn('API getAlerts error:', err.message);
      return [];
    }
  },

  // Clear all alerts
  async clearAlerts() {
    const res = await fetch(`${API_BASE}/traffic/alerts`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Predictive Forecast (LSTM / AI-based)
  async getForecast() {
    try {
      const res = await fetch(`${API_BASE}/traffic/forecast`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return await res.json();
    } catch (err) {
      console.warn('API getForecast error:', err.message);
      return { forecast: [] };
    }
  },

  // Users management
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (err) {
      console.warn('API getUsers error, using fallback:', err.message);
      return null;
    }
  }
};

export default api;
