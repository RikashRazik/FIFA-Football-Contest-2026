import React, { useState } from 'react';
import { Participant, Question, Answer } from '../types';
import { Users, Trophy, HelpCircle, ArrowUpRight, Activity, Clock, X, CheckSquare, AlertCircle, Calendar, BarChart3, MessageSquare } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getDynamicQuestionStatus, isQuestionTimedOut } from '../utils';
import { PointsChart } from '../components/PointsChart';
import { WhatsAppGenerator } from '../components/WhatsAppGenerator';
import { ProgressRing } from '../components/ProgressRing';
import { Tooltip } from '../components/Tooltip';
import { Target, Edit2 } from 'lucide-react';

interface DashboardProps {
  participants: Participant[];
  questions: Question[];
  answers: Answer[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({ participants, questions, answers, onNavigate }: DashboardProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [selectedTargetQuestionId, setSelectedTargetQuestionId] = useState<string | null>(null);
  const [isEditingTargetQuestion, setIsEditingTargetQuestion] = useState(false);

  const exactActiveQuestion = questions.find(q => getDynamicQuestionStatus(q) === 'active' && !isQuestionTimedOut(q));
  const pendingEvaluationCount = questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !q.isEvaluated && isQuestionTimedOut(q)).length;
  const totalQuestionsAsked = questions.filter(q => getDynamicQuestionStatus(q) === 'past' || getDynamicQuestionStatus(q) === 'active').length;
  
  const activeQuestionId = exactActiveQuestion?.id;
  const targetQuestionId = selectedTargetQuestionId || activeQuestionId || questions[0]?.id;
  const targetQuestion = questions.find(q => q.id === targetQuestionId);

  const targetQuestionAnswers = targetQuestion ? answers.filter(a => a.questionId === targetQuestion.id) : [];
  const uniqueParticipantsForTarget = new Set(targetQuestionAnswers.map(a => a.participantId)).size;
  const totalParticipantsCount = participants.length;
  const targetProgress = totalParticipantsCount > 0 ? Math.min(100, Math.round((uniqueParticipantsForTarget / totalParticipantsCount) * 100)) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(2026, 5, 11); // June 11, 2026
  startDay.setHours(0, 0, 0, 0);
  const totalDays = Math.max(1, Math.floor((today.getTime() - startDay.getTime()) / (1000 * 3600 * 24)) + 1);

  const participantsWithTotals = participants.map(p => ({
    ...p,
    total: p.dailyPoints + p.bonusPoints + p.bumperPoints
  })).sort((a, b) => b.total - a.total);

  const top3 = participantsWithTotals.slice(0, 3);
  const totalPointsAwarded = participantsWithTotals.reduce((sum, p) => sum + p.total, 0);

  const getDayNumber = (dateString: string) => {
    const start = new Date('2026-06-11T00:00:00Z');
    const target = new Date(dateString + 'T00:00:00Z');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const recentAnswers = [...answers].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-[#0a1128] to-[#1a2b5e] p-6 md:p-8 rounded-2xl shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-center md:text-left relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 z-10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          
          <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-2xl relative z-10" referrerPolicy="no-referrer" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">Dashboard Overview</h2>
            <p className="text-blue-200 mt-1 md:mt-2 text-sm md:text-base">Welcome back. Here's what's happening in the contest today.</p>
          </div>
        </div>
        
        <div className="z-10 mt-4 md:mt-0">
          <button 
            onClick={() => setIsWaModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">WhatsApp</span> Announce
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        <Tooltip content="Total number of users registered for the contest." position="bottom">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden h-full w-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shrink-0 relative z-10">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-700" />
            </div>
            <div className="relative z-10 flex-1 min-w-0 text-left">
              <p className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 leading-tight">Total Participants</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{participants.length}</p>
            </div>
          </div>
        </Tooltip>

        <Tooltip content="The currently active question waiting for answers." position="bottom">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden h-full w-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0 relative z-10">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-700" />
            </div>
            <div className="relative z-10 flex-1 min-w-0 text-left">
              <p className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 leading-tight">Active Question</p>
              {exactActiveQuestion ? (
                <p className="text-sm font-bold text-emerald-700 truncate" title={exactActiveQuestion.text}>
                  {exactActiveQuestion.title ? `${exactActiveQuestion.title}: ` : ''}{exactActiveQuestion.text}
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-400">No active question</p>
              )}
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Questions that have timed out and require manual scoring." position="bottom">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden h-full w-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 relative z-10">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-700" />
            </div>
            <div className="relative z-10 flex-1 min-w-0 text-left">
              <p className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 leading-tight">Pending Evaluation</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{pendingEvaluationCount}</p>
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Total number of questions posted so far." position="bottom">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden h-full w-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 relative z-10">
              <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-700" />
            </div>
            <div className="relative z-10 flex-1 min-w-0 text-left">
              <p className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 leading-tight">Questions Asked</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{totalQuestionsAsked}</p>
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Number of days since the contest started on June 11, 2026." position="bottom">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden h-full w-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0 relative z-10">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-700" />
            </div>
            <div className="relative z-10 flex-1 min-w-0 text-left">
              <p className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5 leading-tight">Total Days</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{totalDays}</p>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Top 10 Analytics Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:col-span-2">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Top 10 Participants Growth</h3>
            </div>
          </div>
          <div className="p-6">
            <PointsChart data={participantsWithTotals.map(p => ({ 
              name: p.name, 
              points: p.total,
              daily: p.dailyPoints,
              bonus: p.bonusPoints,
              bumper: p.bumperPoints
            }))} />
          </div>
        </div>

        {/* Question Responses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative lg:col-span-1">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" /> Responses
            </h3>
            {isEditingTargetQuestion ? (
              <div className="flex items-center gap-2 max-w-[150px]">
                <select
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                  value={targetQuestionId || ''}
                  onChange={(e) => {
                    setSelectedTargetQuestionId(e.target.value);
                    setIsEditingTargetQuestion(false);
                  }}
                >
                  <option value="" disabled>Select Question</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title || q.text.substring(0, 20)}
                    </option>
                  ))}
                </select>
                <button onClick={() => setIsEditingTargetQuestion(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditingTargetQuestion(true)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Select Question">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-full text-center mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Question</p>
              <p className="text-sm font-bold text-slate-800 truncate px-2" title={targetQuestion?.text || 'No question selected'}>
                {targetQuestion?.title || targetQuestion?.text || 'No question selected'}
              </p>
            </div>
            <div className="relative flex items-center justify-center">
              <ProgressRing 
                radius={85} 
                stroke={12} 
                progress={targetProgress} 
                color={targetProgress >= 100 ? '#10b981' : '#6366f1'} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className="text-4xl font-black text-slate-800 leading-none">{uniqueParticipantsForTarget}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 bg-white/80 px-2 rounded-full">/ {totalParticipantsCount} Users</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 text-center mt-2 max-w-[80%] leading-relaxed">
              {targetProgress >= 100 
                ? 'All users have responded!'
                : `${totalParticipantsCount - uniqueParticipantsForTarget} user${totalParticipantsCount - uniqueParticipantsForTarget === 1 ? '' : 's'} yet to respond.`}
            </p>
          </div>
        </div>

        {/* Active & Upcoming Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:col-span-1 lg:row-span-1">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Active & Upcoming</h3>
            <button 
              onClick={() => onNavigate('questions')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {questions.filter(q => getDynamicQuestionStatus(q) !== 'past').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-200 mb-3" />
                <p>No active or upcoming questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.filter(q => getDynamicQuestionStatus(q) !== 'past').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5).map((q, i) => (
                  <div key={`active-${q.id || i}-${i}`} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getDynamicQuestionStatus(q) === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {getDynamicQuestionStatus(q) === 'active' ? 'Active' : 'Soon'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{q.title || q.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{q.date} • {q.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:col-span-2 lg:row-span-1">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Current Leaders</h3>
            </div>
            <button 
              onClick={() => onNavigate('leaderboard')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Ranks <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((p, i) => (
              <div key={`top-${p.id || i}-${i}`} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-colors">
                <div className={`absolute top-0 w-full h-1 left-0 ${
                  i === 0 ? 'bg-gradient-to-r from-amber-300 to-amber-500' : 
                  i === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' : 
                  'bg-gradient-to-r from-orange-300 to-orange-500'
                }`}></div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-white shadow-md ${
                  i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 ring-4 ring-amber-100' : 
                  i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 ring-4 ring-slate-100' : 
                  'bg-gradient-to-br from-orange-300 to-orange-500 ring-4 ring-orange-100'
                }`}>
                  {i + 1}
                </div>
                <div className="text-center w-full mt-2">
                  <p className="font-bold text-slate-900 truncate text-lg">{p.name}</p>
                  <p className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block mt-2">{p.total} pts</p>
                </div>
              </div>
            ))}
            {top3.length === 0 && (
              <div className="col-span-3 py-6 flex flex-col items-center justify-center text-center text-slate-500">
                <Trophy className="w-10 h-10 text-slate-200 mb-2" />
                <p>No leaders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <WhatsAppGenerator 
        isOpen={isWaModalOpen} 
        onClose={() => setIsWaModalOpen(false)} 
        questions={questions} 
        participants={participants} 
      />
    </div>
  );
}
