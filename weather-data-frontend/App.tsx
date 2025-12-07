
import React, { useState } from 'react';
import LocationManager from './components/LocationManager';
import { VariableSelector } from './components/VariableSelector';
import ResultsCharts from './components/ResultsCharts';
import { WeatherLocationInput, BatchRequest, BatchResponse } from './types';
import { DEFAULT_LOCATIONS, DEFAULT_VARS } from './constants';
import { fetchWeatherData } from './services/weatherService';

const App: React.FC = () => {
  // State
  // Default to the specific start time required: 2025-06-01T00:00
  const [locations, setLocations] = useState<WeatherLocationInput[]>(DEFAULT_LOCATIONS);
  const [startTime, setStartTime] = useState<string>('2025-06-01T00:00');
  const [duration, setDuration] = useState<number>(24);
  const [interval, setInterval] = useState<number>(1);
  const [selectedVars, setSelectedVars] = useState<string[]>(DEFAULT_VARS);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);

  // Constants for time constraints
  const MIN_TIME = "2025-06-01T00:00";
  // 265 hours after start is approx 11 days and 1 hour -> June 12th 01:00
  const MAX_TIME = "2025-06-12T01:00"; 

  // Handlers
  const handleQuery = async () => {
    if (locations.length === 0) {
      setError("请至少添加一个位置。");
      return;
    }
    if (selectedVars.length === 0) {
      setError("请至少选择一个气象变量。");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Format time to strictly YYYY-MM-DDTHH:mm:ss (Naive time, no Z, no offset)
    // The input type="datetime-local" value is usually "YYYY-MM-DDTHH:mm"
    let formattedTime = startTime;
    if (formattedTime.length === 16) {
        // Append seconds if missing
        formattedTime += ":00";
    }

    const payload: BatchRequest = {
      locations,
      time: formattedTime, 
      vars: selectedVars,
      hours: duration,
      interval: interval
    };

    try {
        // Try Fetching real data
        const data = await fetchWeatherData(payload);
        setResult(data);
    } catch (err) {
      setError("发生了意外错误。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">MetData Explorer</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">气象数据可视化平台</p>
             </div>
          </div>
          <div className="flex items-center space-x-6">
             <button 
                onClick={handleQuery}
                disabled={loading}
                className={`
                    flex items-center px-5 py-2.5 rounded-lg font-medium shadow-md text-white transition-all transform active:scale-95
                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 hover:shadow-lg'}
                `}
             >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        数据加载中...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        开始分析
                    </>
                )}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Error Message */}
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Top Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Locations */}
            <div className="lg:col-span-1 h-full">
                <LocationManager locations={locations} setLocations={setLocations} />
            </div>

            {/* Right: Settings & Variables */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Time & Duration Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        时间设置
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">起始时间</label>
                            <input 
                                type="datetime-local" 
                                min={MIN_TIME}
                                max={MAX_TIME}
                                className="w-full rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm p-2 border"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              有效范围: 6/1 00:00 - 6/12 01:00 (265h)
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">预测时长 (小时)</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="168"
                                className="w-full rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm p-2 border"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 24)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">时间间隔 (小时)</label>
                            <select 
                                className="w-full rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm p-2 border"
                                value={interval}
                                onChange={(e) => setInterval(parseInt(e.target.value))}
                            >
                                <option value={1}>1 小时</option>
                                <option value={3}>3 小时</option>
                                <option value={6}>6 小时</option>
                                <option value={12}>12 小时</option>
                                <option value={24}>24 小时</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Variable Selector */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
                     <VariableSelector selectedVars={selectedVars} onChange={setSelectedVars} />
                </div>
            </div>
        </div>

        {/* Results Area */}
        {result && (
            <div className="mt-8 animate-fade-in">
                <div className="flex items-center justify-between mb-4 border-l-4 border-blue-500 pl-4">
                    <h2 className="text-2xl font-bold text-slate-800">分析结果</h2>
                    <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        起始: {result.start_time.replace('T', ' ')} | 位置数: {result.locations.length}
                    </span>
                </div>
                <ResultsCharts data={result} selectedVars={selectedVars} />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
