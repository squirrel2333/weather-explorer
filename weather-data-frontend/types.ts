
export interface WeatherLocationInput {
  id: string;
  lat: number;
  lon: number;
}

export interface BatchRequest {
  locations: WeatherLocationInput[];
  time: string;
  vars: string[];
  hours: number;
  interval: number;
}

export interface VariableData {
  var: string;
  unit: string;
  values: number[];
}

export interface LocationResultData {
  id: string;
  lat: number;
  lon: number;
  data: VariableData[];
  error: string | null;
}

export interface BatchResponse {
  start_time: string;
  time_steps: string[];
  locations: LocationResultData[];
}

export interface SurfaceVariableDef {
  code: string;
  label: string;
  unit: string;
  category: string;
}
