import React from 'react';
import { Wrench } from 'lucide-react';

export function MaintenanceView() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-12 font-sans">
      <div className="text-center space-y-6 max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
            <Wrench className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">System Maintenance</h1>
        <p className="text-lg text-slate-400 font-medium">
          We are currently updating the system to bring you the latest features and data. Please check back shortly.
        </p>
      </div>
    </div>
  );
}
