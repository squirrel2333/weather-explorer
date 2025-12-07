
import { SurfaceVariableDef } from './types';

// 气象参数定义
export const SURFACE_VARIABLES: SurfaceVariableDef[] = [
  // 风速
  { code: 'u10', label: '10米 U-风速', unit: 'm/s', category: '风速' },
  { code: 'v10', label: '10米 V-风速', unit: 'm/s', category: '风速' },
  { code: 'u100', label: '100米 U-风速', unit: 'm/s', category: '风速' },
  { code: 'v100', label: '100米 V-风速', unit: 'm/s', category: '风速' },
  
  // 气温
  { code: 't2m', label: '2米气温 (T2M)', unit: 'K', category: '气温' },
  
  // 云与辐射
  { code: 'tcc', label: '总云量', unit: '%', category: '云与辐射' },
  { code: 'ssr6h', label: '6小时短波辐射', unit: 'J/m²', category: '云与辐射' },
  
  // 降水F
  { code: 'tp6h', label: '6小时降水量', unit: 'mm', category: '降水' },
  
  // 气压
  { code: 'sp', label: '地面气压 (SP)', unit: 'Pa', category: '气压' },
  { code: 'msl', label: '海平面气压 (MSL)', unit: 'Pa', category: '气压' },
];

export const DEFAULT_LOCATIONS = [
  { id: 'loc_1', lat: 30.5, lon: 120.5 },
];

// Default selected variables
export const DEFAULT_VARS = ['t2m', 'tp6h'];

// Helper to get label for a variable code
export const getVariableLabel = (code: string) => {
  const surfaceVar = SURFACE_VARIABLES.find(v => v.code === code);
  if (surfaceVar) return { label: surfaceVar.label, unit: surfaceVar.unit };
  return { label: code, unit: '-' };
};
