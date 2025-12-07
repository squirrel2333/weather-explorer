
import { BatchRequest, BatchResponse } from '../types';

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
