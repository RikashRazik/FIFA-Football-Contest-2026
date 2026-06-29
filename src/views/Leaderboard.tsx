import React, { useState } from 'react';
import { Participant } from '../types';
import { Trophy, Medal, ChevronDown, ChevronUp, Edit2, Check, Plus, Minus, Download, X, FileSpreadsheet, FileImage, FileText } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface LeaderboardProps {
  participants: Participant[];
  updateScore: (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number, dayIndex?: number) => void;
  onParticipantClick?: (participant: Participant) => void;
}

export function Leaderboard({ participants, updateScore, onParticipantClick }: LeaderboardProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isEditingAll, setIsEditingAll] = useState(false);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDay, setExportDay] = useState<string>('all');
  const [includeBonus, setIncludeBonus] = useState(true);
  const [includeBumper, setIncludeBumper] = useState(true);

  const maxDays = participants.reduce((max, p) => Math.max(max, p.dailyScores?.length || 0), 0);

  const getExportData = () => {
    let data = [...participants].map(p => {
      let dailyPts = 0;
      let dayBreakdown: number[] = [];
      
      if (exportDay === 'all') {
        dailyPts = p.dailyPoints;
        for (let i = 0; i < maxDays; i++) {
          dayBreakdown.push((p.dailyScores && p.dailyScores.length > i) ? p.dailyScores[i] : 0);
        }
      } else {
        const dayIdx = parseInt(exportDay, 10);
        dailyPts = (p.dailyScores && p.dailyScores.length > dayIdx) ? p.dailyScores[dayIdx] : 0;
        dayBreakdown = [dailyPts];
      }

      const bonusPts = includeBonus ? p.bonusPoints : 0;
      const bumperPts = includeBumper ? p.bumperPoints : 0;
      const totalPts = dailyPts + bonusPts + bumperPts;

      return {
        id: p.id,
        name: p.name,
        dailyPts,
        dayBreakdown,
        bonusPts,
        bumperPts,
        totalPts
      };
    });

    data.sort((a, b) => b.totalPts - a.totalPts);

    let currentRank = 1;
    let prevPts = data[0]?.totalPts;
    return data.map((p, index) => {
      if (index > 0 && p.totalPts < prevPts) {
        currentRank++;
        prevPts = p.totalPts;
      }
      return { ...p, rank: currentRank };
    });
  };

  const exportCSV = () => {
    const data = getExportData();
    let header = 'Rank,Participant';
    if (exportDay === 'all') {
      for (let i = 0; i < maxDays; i++) {
        header += `,Day ${i + 1}`;
      }
    } else {
      header += `,Day ${parseInt(exportDay) + 1}`;
    }
    
    if (includeBonus) header += ',Bonus';
    if (includeBumper) header += ',Bumper';
    header += ',Total\n';

    let csv = header;
    data.forEach(p => {
      csv += `${p.rank},"${p.name}"`;
      p.dayBreakdown.forEach(pts => {
        csv += `,${pts}`;
      });
      if (includeBonus) csv += `,${p.bonusPts}`;
      if (includeBumper) csv += `,${p.bumperPts}`;
      csv += `,${p.totalPts}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaderboard-${exportDay === 'all' ? 'all' : 'day' + (parseInt(exportDay)+1)}.csv`);
    link.click();
    setIsExportModalOpen(false);
  };

  const exportExcel = () => {
    const data = getExportData();
    let table = `<table border="1">
      <tr>
        <th>Rank</th>
        <th>Participant</th>`;
        
    if (exportDay === 'all') {
      for (let i = 0; i < maxDays; i++) {
        table += `<th>Day ${i + 1}</th>`;
      }
    } else {
      table += `<th>Day ${parseInt(exportDay) + 1}</th>`;
    }
        
    table += `
        ${includeBonus ? '<th>Bonus Points</th>' : ''}
        ${includeBumper ? '<th>Bumper Points</th>' : ''}
        <th>Total Points</th>
      </tr>`;
      
    data.forEach(p => {
      table += `<tr>
        <td>${p.rank}</td>
        <td>${p.name}</td>`;
        
      p.dayBreakdown.forEach(pts => {
        table += `<td>${pts}</td>`;
      });
        
      table += `
        ${includeBonus ? `<td>${p.bonusPts}</td>` : ''}
        ${includeBumper ? `<td>${p.bumperPts}</td>` : ''}
        <td>${p.totalPts}</td>
      </tr>`;
    });
    table += '</table>';
    
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaderboard-${exportDay === 'all' ? 'all' : 'day' + (parseInt(exportDay)+1)}.xls`);
    link.click();
    setIsExportModalOpen(false);
  };

  const exportJPG = async () => {
    const element = document.getElementById('export-preview-table');
    if (element) {
      // Temporarily remove hidden classes for image generation if we were hiding it
      element.style.display = 'block';
      
      try {
        const dataUrl = await htmlToImage.toJpeg(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
        element.style.display = 'none';
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUrl);
        link.setAttribute('download', `leaderboard-${exportDay === 'all' ? 'all' : 'day' + (parseInt(exportDay)+1)}.jpg`);
        link.click();
        setIsExportModalOpen(false);
      } catch (err) {
        console.error('Failed to export image', err);
        element.style.display = 'none';
      }
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  const ScoreControl = ({ value, onDecrease, onIncrease }: { value: number, onDecrease: () => void, onIncrease: () => void }) => (
    <div className="flex items-center justify-center gap-2">
      <button 
        onClick={(e) => { e.stopPropagation(); onDecrease(); }} 
        disabled={value === 0}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          value === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
        }`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-6 text-center font-mono font-medium text-slate-700">{value}</span>
      <button 
        onClick={(e) => { e.stopPropagation(); onIncrease(); }} 
        className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Leaderboard</h2>
          <p className="text-slate-500 mt-1">Official standings for the SFWC 2026 Contest.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'leaderboard');
              navigator.clipboard.writeText(url.toString());
              const target = e.currentTarget;
              const originalHtml = target.innerHTML;
              target.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M20 6 9 17l-5-5"/></svg>';
              setTimeout(() => target.innerHTML = originalHtml, 2000);
            }}
            title="Share Link"
            className="flex items-center justify-center p-2.5 md:p-3 rounded-lg transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            title="Export"
            className="flex items-center justify-center p-2.5 md:p-3 rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsEditingAll(!isEditingAll)}
            title={isEditingAll ? 'Done Editing' : 'Edit Scores'}
            className={`flex items-center justify-center p-2.5 md:p-3 rounded-lg transition-colors shadow-sm ${
              isEditingAll 
                ? 'bg-green-600 hover:bg-green-700 text-white border border-green-600' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            {isEditingAll ? <Check className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="py-4 px-6 font-medium w-24">Rank</th>
                <th className="py-4 px-6 font-medium">Participant</th>
                <th className="py-4 px-6 font-medium text-center">Daily</th>
                <th className="py-4 px-6 font-medium text-center">Bonus</th>
                <th className="py-4 px-6 font-medium text-center">Bumper</th>
                <th className="py-4 px-6 font-bold text-slate-900 text-right">Total Pts</th>
                <th className="py-4 px-6 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((p) => {
                const isTop3 = p.rank <= 3;
                const isExpanded = expandedRows[p.id];
                
                return (
                  <React.Fragment key={p.id}>
                    <tr 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${p.rank === 1 ? 'bg-amber-50/30' : ''}`}
                      onClick={() => toggleRow(p.id)}
                    >
                      <td className="py-4 px-6">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm ${
                          p.rank === 1 ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-white border-2 border-yellow-200 ring-2 ring-yellow-500/20' :
                          p.rank === 2 ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-white border-2 border-slate-100 ring-2 ring-slate-400/20' :
                          p.rank === 3 ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-white border-2 border-orange-200 ring-2 ring-orange-500/20' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {p.rank}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onParticipantClick) onParticipantClick(p);
                          }}
                          className={`font-medium hover:text-indigo-600 hover:underline ${isTop3 ? 'text-slate-900 font-bold' : 'text-slate-700'}`}
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isEditingAll ? (
                          <ScoreControl 
                            value={p.dailyPoints}
                            onDecrease={() => updateScore(p.id, 'dailyPoints', -1)}
                            onIncrease={() => updateScore(p.id, 'dailyPoints', 1)}
                          />
                        ) : (
                          <span className="text-slate-600 font-mono text-sm">{p.dailyPoints}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isEditingAll ? (
                          <ScoreControl 
                            value={p.bonusPoints}
                            onDecrease={() => updateScore(p.id, 'bonusPoints', -1)}
                            onIncrease={() => updateScore(p.id, 'bonusPoints', 1)}
                          />
                        ) : (
                          <span className="text-slate-600 font-mono text-sm">{p.bonusPoints}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isEditingAll ? (
                          <ScoreControl 
                            value={p.bumperPoints}
                            onDecrease={() => updateScore(p.id, 'bumperPoints', -1)}
                            onIncrease={() => updateScore(p.id, 'bumperPoints', 1)}
                          />
                        ) : (
                          <span className="text-slate-600 font-mono text-sm">{p.bumperPoints}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-mono text-lg font-bold ${
                          p.rank === 1 ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {p.totalPoints}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <td colSpan={7} className="py-4 px-6">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {p.dailyScores && p.dailyScores.length > 0 ? (
                              p.dailyScores.map((score, dayIndex) => (
                                <div key={dayIndex} className="flex flex-col items-center bg-white border border-slate-200 rounded-md p-2 min-w-[3rem] shadow-sm">
                                  <span className="text-xs text-slate-500 font-medium mb-1">D{dayIndex + 1}</span>
                                  {isEditingAll ? (
                                    <ScoreControl 
                                      value={score}
                                      onDecrease={() => updateScore(p.id, 'dailyPoints', -1, dayIndex)}
                                      onIncrease={() => updateScore(p.id, 'dailyPoints', 1, dayIndex)}
                                    />
                                  ) : (
                                    <span className={`font-mono font-bold ${score > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{score}</span>
                                  )}
                                </div>
                              ))
                            ) : (
                              !isEditingAll && <span className="text-slate-500 text-sm italic">No daily breakdown available.</span>
                            )}
                            {isEditingAll && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateScore(p.id, 'dailyPoints', 0, p.dailyScores?.length || 0);
                                }}
                                className="flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-md p-2 min-w-[3rem] h-full min-h-[52px] shadow-sm transition-colors group cursor-pointer"
                                title="Add Day"
                              >
                                <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-indigo-500 mt-0.5">Add</span>
                              </button>
                            )}
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

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Export Leaderboard</h3>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Day</label>
                <select
                  value={exportDay}
                  onChange={(e) => setExportDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                >
                  <option value="all">All Days (Current Total)</option>
                  {Array.from({ length: maxDays }).map((_, i) => (
                    <option key={i} value={i}>Day {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Include Additional Points</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeBonus}
                      onChange={(e) => setIncludeBonus(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">Bonus Questions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeBumper}
                      onChange={(e) => setIncludeBumper(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">Bumper Questions</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-3">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={exportExcel}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Excel</span>
                  </button>
                  <button 
                    onClick={exportCSV}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <FileText className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">CSV</span>
                  </button>
                  <button 
                    onClick={exportJPG}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                  >
                    <FileImage className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700">Image (JPG)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Table for JPG Export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="export-preview-table" className="bg-[#0a1128] p-8 w-[1200px] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="text-center mb-6">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">SFWC 2026</h2>
            <div className="inline-block bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500 rounded-full px-8 py-2">
              <span className="text-xl font-bold text-yellow-400 tracking-wider">
                {exportDay === 'all' ? `DAY 1 - ${maxDays} POINT TABLE` : `DAY ${parseInt(exportDay) + 1} POINT TABLE`}
              </span>
            </div>
          </div>
          
          <table className="w-full text-center border-collapse border border-blue-900/50">
            <thead>
              <tr className="bg-[#050b14] border-b-2 border-blue-600 text-blue-200 text-sm">
                <th className="py-3 px-2 border-r border-blue-900/50 font-bold">RANK</th>
                <th className="py-3 px-4 text-left border-r border-blue-900/50 font-bold">PLAYER NAME</th>
                {exportDay === 'all' ? (
                  Array.from({ length: maxDays }).map((_, i) => (
                    <th key={i} className="py-3 px-2 border-r border-blue-900/50 font-bold">DAY {i + 1}</th>
                  ))
                ) : (
                  <th className="py-3 px-2 border-r border-blue-900/50 font-bold">DAY {parseInt(exportDay) + 1}</th>
                )}
                {includeBonus && <th className="py-3 px-2 border-r border-blue-900/50 font-bold">BONUS</th>}
                {includeBumper && <th className="py-3 px-2 border-r border-blue-900/50 font-bold">BUMPER</th>}
                <th className="py-3 px-4 text-white font-bold bg-blue-900/30">TOTAL<br/>POINTS</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold">
              {getExportData().map((p, i) => {
                const isGold = p.rank === 1;
                const isSilver = p.rank === 2;
                const isBronze = p.rank === 3;
                const isPodium = isGold || isSilver || isBronze;
                
                let rowBg = i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]';
                if (isGold) rowBg = 'bg-[#fcbf49]';
                else if (isSilver) rowBg = 'bg-[#cbd5e1]';
                else if (isBronze) rowBg = 'bg-[#e28743]';

                let rankStyle = '';
                if (isPodium) rankStyle = 'text-slate-900 font-bold';
                else rankStyle = 'text-slate-400';

                return (
                  <tr key={p.id} className={`${rowBg} border-b border-blue-900/30`}>
                    <td className={`py-2 px-2 border-r border-blue-900/50 text-base ${rankStyle}`}>
                      {isGold ? '🥇 ' + p.rank : isSilver ? '🥈 ' + p.rank : isBronze ? '🥉 ' + p.rank : '-'}
                    </td>
                    <td className={`py-2 px-4 text-left border-r border-blue-900/50 text-base ${isPodium ? 'text-slate-900 font-bold' : 'text-slate-200'}`}>
                      {p.name}
                    </td>
                    
                    {p.dayBreakdown.map((pts, idx) => (
                      <td key={idx} className={`py-2 px-2 border-r border-blue-900/50 text-base ${isPodium ? 'text-slate-900 font-bold' : 'text-slate-300'}`}>
                        {pts}
                      </td>
                    ))}
                    
                    {includeBonus && <td className={`py-2 px-2 border-r border-blue-900/50 text-base ${isPodium ? 'text-slate-900 font-bold' : 'text-slate-300'}`}>{p.bonusPts}</td>}
                    {includeBumper && <td className={`py-2 px-2 border-r border-blue-900/50 text-base ${isPodium ? 'text-slate-900 font-bold' : 'text-slate-300'}`}>{p.bumperPts}</td>}
                    
                    <td className={`py-2 px-4 font-black text-xl bg-black/10 ${isPodium ? 'text-slate-900' : 'text-white'}`}>
                      {p.totalPts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
