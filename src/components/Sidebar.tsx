import { LayoutDashboard, Trophy, HelpCircle, Users, LogOut, ChevronUp, Activity } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [showLogout, setShowLogout] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Leaderboard', shortLabel: 'Ranks', icon: Trophy },
    { id: 'questions', label: 'Questions Portal', shortLabel: 'Questions', icon: HelpCircle },
    { id: 'users', label: 'User Management', shortLabel: 'Users', icon: Users },
    { id: 'active-questions', label: 'Active Questions', shortLabel: 'Active', icon: Activity },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col flex-shrink-0 text-slate-300 h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">WC</div>
          <span className="text-white font-bold tracking-tight">FIFA 2026 ADMIN</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto">
          {showLogout && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          <div 
            className="p-6 bg-slate-950 cursor-pointer hover:bg-slate-900 transition-colors flex items-center gap-3 w-full"
            onClick={() => setShowLogout(!showLogout)}
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm text-white font-medium">A</div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white">System Manager</div>
              <div className="text-xs text-slate-400">Logged in</div>
            </div>
            <ChevronUp className={`w-5 h-5 text-slate-400 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] pb-[env(safe-area-inset-bottom)] px-2 pt-2 flex items-center justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-14 relative ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
              )}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-500'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              </div>
              <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
