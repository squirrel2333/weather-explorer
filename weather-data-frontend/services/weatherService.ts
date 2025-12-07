
import { BatchRequest, BatchResponse } from '../types';

// In a real scenario, this would be your actual backend URL.
// For this demo, we assume the backend is running on the same host or proxied.
const API_BASE_URL = '';

export const fetchWeatherData = async (payload: BatchRequest): Promise<BatchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data: BatchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    throw error;
  }
};

// Mock data generator for fallback/demo purposes
export const generateMockResponse = (payload: BatchRequest): BatchResponse => {
  const steps = [];
  const startTime = new Date(payload.time);
  const stepCount = Math.floor(payload.hours / payload.interval);

  for (let i = 0; i <= stepCount; i++) {
    const t = new Date(startTime.getTime() + i * payload.interval * 60 * 60 * 1000);
    steps.push(t.toISOString());
  }

  const locations = payload.locations.map(loc => {
    const data = payload.vars.map(v => {
      // Determine base value and amplitude based on variable type
      let base = 10;
      let amp = 5;
      let unit = '';

      switch (v) {
        case 't2m':
            base = 293; // ~20C
            amp = 8;
            unit = 'K';
            break;
        case 'u10':
        case 'v10':
        case 'u100':
        case 'v100':
            base = 2;
            amp = 5;
            unit = 'm/s';
            break;
        case 'sp':
        case 'msl':
            base = 101325;
            amp = 500;
            unit = 'Pa';
            break;
        case 'tcc':
            base = 50;
            amp = 40;
            unit = '%';
            break;
        case 'ssr6h':
            base = 1000000;
            amp = 1000000; // Large diurnal cycle
            unit = 'J/m²';
            break;
        case 'tp6h':
            base = 0;
            amp = 5;
            unit = 'mm';
            break;
        default:
            base = 10;
            amp = 5;
            unit = '-';
      }

      const values = steps.map((_, idx) => {
        const noise = (Math.random() - 0.5) * (amp * 0.1);
        
        // Simple diurnal cycle simulation
        let diurnal = Math.sin((idx * payload.interval * 0.26) + loc.lat);
        
        if (v === 'ssr6h') {
            // Radiation is positive only during "day"
            diurnal = Math.max(0, diurnal);
        }

        let val = base + diurnal * amp + noise;

        // Constraints
        if (v === 'tcc') {
            val = Math.max(0, Math.min(100, val));
        } else if (v === 'tp6h' || v === 'ssr6h') {
            val = Math.max(0, val);
        }

        return val;
      });

      return {
        var: v,
        unit: unit,
        values: values
      };
    });

    return {
      id: loc.id,
      lat: loc.lat,
      lon: loc.lon,
      data: data,
      error: null
    };
  });

  return {
    start_time: payload.time,
    time_steps: steps,
    locations: locations
  };
};
