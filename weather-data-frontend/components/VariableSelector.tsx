
import React from 'react';
import { SURFACE_VARIABLES } from '../constants';

interface VariableSelectorProps {
  selectedVars: string[];
  onChange: (vars: string[]) => void;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({ selectedVars, onChange }) => {
  // Helper: Categorize variables
  // We use a fixed order for categories based on the requirements: Wind, Temp, Cloud/Rad, Precip, Pressure
  const categoryOrder = ['风速', '气温', '云与辐射', '降水', '气压'];
  
  // Ensure we only show categories that actually exist in the data (though we know they do)
  const availableCategories = Array.from(new Set(SURFACE_VARIABLES.map(v => v.category)));
  const sortedCategories = categoryOrder.filter(c => availableCategories.includes(c));

  const isSelected = (code: string) => selectedVars.includes(code);

  const toggleVar = (code: string) => {
    if (isSelected(code)) {
      onChange(selectedVars.filter(v => v !== code));
    } else {
      onChange([...selectedVars, code]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">气象要素选择</h3>
        <span className="text-xs text-slate-400">已选: {selectedVars.length}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {sortedCategories.map(cat => (
          <div key={cat} className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 border-b border-slate-100 pb-1 mb-2 flex items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{cat}</span>
            </h4>
            <div className="flex flex-col gap-2">
              {SURFACE_VARIABLES.filter(v => v.category === cat).map(variable => (
                <label 
                  key={variable.code} 
                  className={`
                    flex items-center justify-between p-2 rounded cursor-pointer transition-all text-sm border
                    ${isSelected(variable.code) 
                      ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm' 
                      : 'hover:bg-slate-50 border-transparent bg-white text-slate-600 border-slate-100'}
                  `}
                >
                  <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        checked={isSelected(variable.code)}
                        onChange={() => toggleVar(variable.code)}
                      />
                      <span className="font-medium">{variable.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">{variable.unit}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
