import React, { useState, useEffect } from 'react';
import { collection, getDocsFromServer, getDocsFromCache } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Participant } from '../types';
import { Database, Server, HardDrive, RefreshCw, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DiagnosticsProps {
  recalculateAllScores: () => Promise<void>;
}

export function Diagnostics({ recalculateAllScores }: DiagnosticsProps) {
  const [serverData, setServerData] = useState<Participant[] | null>(null);
  const [cacheData, setCacheData] = useState<Participant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    if (recalculating) return;
    setRecalculating(true);
    try {
      await recalculateAllScores();
      await fetchData();
    } catch (e: any) {
      toast.error(`Recalculation error: ${e.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const serverSnap = await getDocsFromServer(collection(db, 'participants'));
      const serverParticipants = serverSnap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setServerData(serverParticipants);

      try {
        const cacheSnap = await getDocsFromCache(collection(db, 'participants'));
        const cacheParticipants = cacheSnap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
        setCacheData(cacheParticipants);
      } catch (e) {
        console.warn("Cache fetch failed or empty", e);
        setCacheData([]);
      }
      
      toast.success("Diagnostic data fetched");
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            System Diagnostics
          </h2>
          <p className="text-slate-500 mt-1">Compare local offline cache with live server data.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
          >
            <ShieldAlert className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate Scores
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostic
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">Offline Cache Disabled</p>
          <p>We have explicitly disabled Firestore's offline persistent cache. Your browser will now always fetch live data directly from the server. If your connection drops, the app will wait for a connection rather than showing stale (old) data.</p>
          <p className="mt-2 text-xs opacity-80">Note: The memory cache only persists during your current session. You should no longer see old data on reload.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Live Server State</h3>
            <span className="ml-auto text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">getDocsFromServer</span>
          </div>
          <div className="p-0 overflow-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-semibold text-slate-600">User</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Points</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Days Logged (Length)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serverData?.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono">{p.dailyPoints}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono">{p.dailyScores?.length || 0}</td>
                  </tr>
                ))}
                {!serverData && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading server data...</td></tr>
                )}
                {serverData?.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No participants found on the live server.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cache Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800">Local Cache State</h3>
            <span className="ml-auto text-xs font-mono bg-amber-100 text-amber-700 px-2 py-1 rounded-full">getDocsFromCache</span>
          </div>
          <div className="p-0 overflow-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-semibold text-slate-600">User</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Points</th>
                  <th className="px-4 py-2 font-semibold text-slate-600">Days Logged (Length)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cacheData?.map(p => {
                  const serverP = serverData?.find(s => s.id === p.id);
                  const isMismatch = serverP && (serverP.dailyScores?.length !== p.dailyScores?.length || serverP.dailyPoints !== p.dailyPoints);
                  
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 ${isMismatch ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-2 font-medium text-slate-800 flex items-center gap-2">
                        {isMismatch && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {p.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600 font-mono">{p.dailyPoints}</td>
                      <td className="px-4 py-2 text-slate-600 font-mono">{p.dailyScores?.length || 0}</td>
                    </tr>
                  )
                })}
                {!cacheData && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading cache data...</td></tr>
                )}
                {cacheData?.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No cache found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
