import React, { useRef } from 'react';
import { Upload, Download, Wrench, RefreshCw, Cloud, CloudOff, Loader2, LogOut, ChevronUp, ChevronDown, Settings, Users, Shield, ShieldOff, MessageSquare } from 'lucide-react';

interface AdminMenuProps {
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  isMaintenanceMode: boolean;
  onToggleMaintenance: () => void;
  isLeaderboardLive: boolean;
  onToggleLeaderboard: () => void;
  isSyncing: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onUsers: () => void;
  onWhatsAppAnnounce: () => void;
}

export function AdminMenuItems({ onImport, onExport, isMaintenanceMode, onToggleMaintenance, isLeaderboardLive, onToggleLeaderboard, isSyncing, isOnline, isSlowConnection, onRefresh, onLogout, onUsers, onWhatsAppAnnounce }: AdminMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="py-1">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json"
        onChange={onImport}
      />
      
      <button 
        onClick={onWhatsAppAnnounce}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors lg:hidden"
      >
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        WhatsApp Announce
      </button>

      <button 
        onClick={onUsers}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Users className="w-4 h-4 text-slate-400" />
        User Management
      </button>

      <div className="h-px bg-slate-800 my-1" />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Upload className="w-4 h-4 text-slate-400" />
        Import JSON State
      </button>
      <button
        onClick={onExport}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Download className="w-4 h-4 text-slate-400" />
        Export JSON State
      </button>
      <div className="h-px bg-slate-800 my-1" />
      <button
        onClick={onToggleLeaderboard}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-3">
          {isLeaderboardLive ? (
            <Shield className="w-4 h-4 text-emerald-500" />
          ) : (
            <ShieldOff className="w-4 h-4 text-amber-500" />
          )}
          Leaderboard Live
        </div>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${isLeaderboardLive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isLeaderboardLive ? 'left-4' : 'left-0.5'}`} />
        </div>
      </button>
      <button
        onClick={onToggleMaintenance}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-3">
          <Wrench className={`w-4 h-4 ${isMaintenanceMode ? 'text-amber-500' : 'text-slate-400'}`} />
          Maintenance Mode
        </div>
        <div className={`w-8 h-4 rounded-full relative transition-colors ${isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isMaintenanceMode ? 'left-4' : 'left-0.5'}`} />
        </div>
      </button>
      <button
        onClick={onRefresh}
        disabled={isSyncing || !isOnline}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
        Force Refresh
      </button>
      <div className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300">
        {!isOnline ? (
          <CloudOff className="w-4 h-4 text-red-500" />
        ) : isSlowConnection ? (
          <Cloud className="w-4 h-4 animate-pulse text-amber-500" />
        ) : isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        ) : (
          <Cloud className="w-4 h-4 text-emerald-500" />
        )}
        <span className={!isOnline ? "text-red-400" : isSlowConnection ? "text-amber-400" : isSyncing ? "text-amber-400" : "text-emerald-400"}>
          {!isOnline ? "Offline" : isSlowConnection ? "Slow Connection" : isSyncing ? "Syncing..." : "Online & Synced"}
        </span>
      </div>
      <div className="h-px bg-slate-800 my-1" />
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-800/50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
