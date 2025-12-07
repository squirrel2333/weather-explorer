
import React, { useState } from 'react';
import { WeatherLocationInput } from '../types';

interface LocationManagerProps {
  locations: WeatherLocationInput[];
  setLocations: (locs: WeatherLocationInput[]) => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ locations, setLocations }) => {
  const [newLat, setNewLat] = useState<string>('');
  const [newLon, setNewLon] = useState<string>('');

  const addLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(newLat);
    const lon = parseFloat(newLon);

    if (!isNaN(lat) && !isNaN(lon)) {
      const newLoc: WeatherLocationInput = {
        id: `loc_${Date.now()}`,
        lat,
        lon
      };
      setLocations([...locations, newLoc]);
      setNewLat('');
      setNewLon('');
    }
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        查询点位管理
      </h3>

      {/* List */}
      <div className="space-y-3 mb-6 flex-grow overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
        {locations.map((loc, index) => (
          <div key={loc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm group hover:border-blue-200 transition-colors">
            <div className="flex flex-col">
              <span className="font-medium text-slate-700">位置 {index + 1}</span>
              <span className="text-slate-500 text-xs font-mono">Lat: {loc.lat}, Lon: {loc.lon}</span>
            </div>
            <button 
              onClick={() => removeLocation(loc.id)}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
              title="删除此位置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">
            暂无位置，请在下方添加
          </div>
        )}
      </div>

      {/* Add Form */}
      <form onSubmit={addLocation} className="grid grid-cols-5 gap-2 items-end pt-4 border-t border-slate-100 mt-auto">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">纬度 (Lat)</label>
          <input
            type="number"
            step="0.01"
            placeholder="30.5"
            className="w-full rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm p-2 border"
            value={newLat}
            onChange={(e) => setNewLat(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">经度 (Lon)</label>
          <input
            type="number"
            step="0.01"
            placeholder="120.5"
            className="w-full rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm p-2 border"
            value={newLon}
            onChange={(e) => setNewLon(e.target.value)}
            required
          />
        </div>
        <div className="col-span-1">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md shadow-sm transition-colors flex items-center justify-center h-[38px]"
            title="添加位置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationManager;
