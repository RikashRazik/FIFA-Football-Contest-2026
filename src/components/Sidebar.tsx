import { LayoutDashboard, Trophy, HelpCircle, Users, LogOut, ChevronUp, Activity, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  activeCount?: number;
  evaluateCount?: number;
}

export function Sidebar({ activeTab, onTabChange, onLogout, activeCount, evaluateCount }: SidebarProps) {
  const [showLogout, setShowLogout] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Leaderboard', shortLabel: 'Ranks', icon: Trophy },
    { id: 'questions', label: 'Questions Portal', shortLabel: 'Questions', icon: HelpCircle },
    { id: 'active-questions', label: 'Active Questions', shortLabel: 'Active', icon: Activity, count: activeCount },
    { id: 'evaluate', label: 'Evaluate Answers', shortLabel: 'Evaluate', icon: CheckCircle, count: evaluateCount },
    { id: 'diagnostics', label: 'Diagnostics', shortLabel: 'Tools', icon: Activity },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-[#0a1128] border-r border-slate-800 flex-col flex-shrink-0 text-slate-400 h-full">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/50">
          <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-8 h-8 object-contain rounded" referrerPolicy="no-referrer" />
          <span className="text-white text-sm font-bold tracking-widest uppercase">SFWC 2026</span>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-blue-500/10 text-blue-400 shadow-sm shadow-blue-500/5' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="flex-1 text-left whitespace-nowrap truncate">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto p-3 border-t border-slate-800/50">
          {showLogout && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0a1128] rounded-md shadow-xl border border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => {
                  onTabChange('users');
                  setShowLogout(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors border-b border-slate-800/50"
              >
                <Users className="w-3.5 h-3.5" />
                User Management
              </button>
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-slate-800/50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
          <div 
            className="p-3 rounded-md bg-slate-900/50 border border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-3 w-full"
            onClick={() => setShowLogout(!showLogout)}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium">
              A
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-xs font-medium text-slate-300 truncate">System Manager</div>
              <div className="text-[10px] text-slate-500">Logged in</div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a1128] border-t border-slate-800/80 z-[60] pb-[env(safe-area-inset-bottom)] px-2 pt-2 flex items-center justify-around shadow-[0_-8px_20px_-1px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-14 relative transition-colors duration-200 ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute -top-2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              )}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-transparent text-slate-400'} relative`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-sm' : ''} transition-transform`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0a1128]">
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
