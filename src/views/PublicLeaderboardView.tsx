import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';
import { Trophy, Medal, ChevronDown, ChevronUp } from 'lucide-react';

interface PublicLeaderboardViewProps {
  participants: Participant[];
}

export const PublicLeaderboardView: React.FC<PublicLeaderboardViewProps> = ({ participants }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const maxDays = participants.reduce((max, p) => Math.max(max, p.dailyScores?.length || 0), 0);

  useEffect(() => {
    if (tableContainerRef.current) {
      requestAnimationFrame(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
        }
      });
    }
  }, [participants]);

  const sorted = [...participants].map(p => ({
    ...p,
    totalPoints: p.dailyPoints + p.bonusPoints + p.bumperPoints
  })).sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  const ranked = sorted.map((p, index) => {
    if (index > 0 && p.totalPoints < sorted[index - 1].totalPoints) {
      currentRank++;
    }
    return { ...p, rank: currentRank };
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex justify-center">
            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase px-2">
            World Cup 2026 Contest
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium">
            Official Leaderboard
          </p>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto" ref={tableContainerRef}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="py-5 px-4 font-semibold w-[80px] min-w-[80px] sticky left-0 z-20 bg-slate-950 text-center">Rank</th>
                  <th className="py-5 px-6 font-semibold min-w-[160px] sticky left-[80px] z-20 bg-slate-950 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)]">Participant</th>
                  {Array.from({ length: maxDays }).map((_, i) => (
                    <th key={i} className="py-5 px-4 font-semibold text-center whitespace-nowrap">Day {i + 1}</th>
                  ))}
                  <th className="py-5 px-4 font-semibold text-center text-amber-500/80">Bonus</th>
                  <th className="py-5 px-4 font-semibold text-center text-purple-500/80">Bumper</th>
                  <th className="py-5 px-6 font-bold text-white text-right">Total</th>
                  <th className="py-5 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ranked.map((p) => {
                  const isTop3 = p.rank <= 3;
                  const isExpanded = expandedRows[p.id];
                  
                  return (
                    <React.Fragment key={p.id}>
                      <tr 
                        className={`group transition-colors cursor-pointer ${p.rank === 1 ? 'bg-amber-900/20 hover:bg-amber-900/40' : 'bg-slate-900 hover:bg-slate-800'}`}
                        onClick={() => toggleRow(p.id)}
                      >
                        <td className={`py-4 px-4 w-[80px] min-w-[80px] sticky left-0 z-10 transition-colors ${p.rank === 1 ? 'bg-[#292015] group-hover:bg-[#382613]' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                          <div className={`mx-auto flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm ${
                            p.rank === 1 ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-slate-900 border border-yellow-200' :
                            p.rank === 2 ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-900 border border-slate-100' :
                            p.rank === 3 ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-slate-900 border border-orange-200' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {p.rank}
                          </div>
                        </td>
                        <td className={`py-4 px-6 min-w-[160px] sticky left-[80px] z-10 transition-colors shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] ${p.rank === 1 ? 'bg-[#292015] group-hover:bg-[#382613]' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                          <span className={`font-medium ${isTop3 ? 'text-white font-bold' : 'text-slate-300'}`}>
                            {p.name}
                          </span>
                        </td>
                        
                        {Array.from({ length: maxDays }).map((_, dayIndex) => {
                          const pts = (p.dailyScores && p.dailyScores.length > dayIndex) ? p.dailyScores[dayIndex] : '-';
                          return (
                            <td key={dayIndex} className="py-4 px-4 text-center">
                              <span className="text-slate-400 font-mono text-sm">{pts}</span>
                            </td>
                          );
                        })}

                        <td className="py-4 px-4 text-center">
                          <span className="text-amber-500/80 font-mono text-sm">{p.bonusPoints}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-purple-500/80 font-mono text-sm">{p.bumperPoints}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-mono text-lg font-bold ${
                            p.rank === 1 ? 'text-amber-400' : 'text-white'
                          }`}>
                            {p.totalPoints}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-500">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-900/80 border-b border-slate-800">
                          <td colSpan={maxDays + 5} className="py-6 px-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                              <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                  <Medal className={`w-6 h-6 ${isTop3 ? 'text-amber-400' : 'text-slate-500'}`} />
                                </div>
                                <div className="truncate">
                                  <h4 className="text-white font-bold truncate">{p.name}</h4>
                                  <p className="text-slate-500 text-sm">Rank #{p.rank} • {p.totalPoints} Total Points</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto">
                                <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Daily</span>
                                  <span className="font-mono font-bold text-indigo-400 text-base sm:text-lg">{p.dailyPoints}</span>
                                </div>
                                <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Bonus</span>
                                  <span className="font-mono font-bold text-amber-500 text-base sm:text-lg">{p.bonusPoints}</span>
                                </div>
                                <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Bumper</span>
                                  <span className="font-mono font-bold text-purple-500 text-base sm:text-lg">{p.bumperPoints}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
