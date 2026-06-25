import { LayoutDashboard, Trophy, HelpCircle, Users, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'questions', label: 'Questions Portal', icon: HelpCircle },
    { id: 'users', label: 'User Management', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0 text-slate-300 h-full">
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

      <div className="p-6 bg-slate-950 mt-auto">
        <div className="flex items-center gap-3 text-left w-full">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-medium">Admin</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">System Manager</div>
            <div className="text-xs text-slate-400">Logged in</div>
          </div>
          <Settings className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
    </aside>
  );
}
