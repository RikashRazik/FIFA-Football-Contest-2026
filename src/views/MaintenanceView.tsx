import React from 'react';
import { Settings } from 'lucide-react';

export function MaintenanceView() {
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-4 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="text-center space-y-8 max-w-lg w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-10 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping duration-1000" />
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-900/50 to-slate-900 rounded-full flex items-center justify-center border border-indigo-500/30 relative z-10 shadow-lg shadow-indigo-900/20">
              <Settings className="w-12 h-12 text-indigo-400 animate-[spin_4s_linear_infinite]" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">System Update</h1>
          <p className="text-lg text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            We are currently optimizing the platform. Please check back shortly for the latest scores and features.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-indigo-400 uppercase tracking-widest px-1">
            <span>Maintenance in progress</span>
            <span>Standby</span>
          </div>
          
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-1/2 animate-[slide_2s_ease-in-out_infinite]">
              <style>{`
                @keyframes slide {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
              `}</style>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Estimated time: A few moments</p>
        </div>
      </div>
    </div>
  );
}
