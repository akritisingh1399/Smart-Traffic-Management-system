import React from 'react';
import MapView from '../components/MapView';

function MapViewPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Interactive Map</h1>
        <p className="text-gray-400">City-wide traffic visualization and monitoring</p>
      </div>

      <MapView />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Traffic Flow</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">North Zone</span>
                <span className="text-emerald-400">Good</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-3/4"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">South Zone</span>
                <span className="text-yellow-400">Moderate</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 w-1/2"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">East Zone</span>
                <span className="text-red-400">Heavy</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-4/5"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Active Cameras</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">12/15</div>
            <p className="text-gray-400 text-sm">Cameras Online</p>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Operational</span>
              <span className="text-emerald-400">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Maintenance</span>
              <span className="text-yellow-400">2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Offline</span>
              <span className="text-red-400">1</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Signal Status</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">48/50</div>
            <p className="text-gray-400 text-sm">Signals Active</p>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active</span>
              <span className="text-emerald-400">48</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-400">1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Error</span>
              <span className="text-red-400">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapViewPage;