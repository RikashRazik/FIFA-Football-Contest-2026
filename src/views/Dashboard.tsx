import { Participant, Question } from '../types';
import { Users, Trophy, HelpCircle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  participants: Participant[];
  questions: Question[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({ participants, questions, onNavigate }: DashboardProps) {
  const activeQuestions = questions.filter(q => q.status === 'active').length;
  
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-[#0a1128] to-[#1a2b5e] p-6 md:p-8 rounded-2xl shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-2xl relative z-10" referrerPolicy="no-referrer" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">Dashboard Overview</h2>
          <p className="text-blue-200 mt-1 md:mt-2 text-sm md:text-base">Welcome back. Here's what's happening in the contest today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 md:gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shrink-0 relative z-10">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-indigo-700" />
          </div>
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Total Participants</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">{participants.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 md:gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0 relative z-10">
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-emerald-700" />
          </div>
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Points Awarded</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">{totalPointsAwarded}</p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 md:gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 relative z-10">
            <HelpCircle className="w-6 h-6 md:w-7 md:h-7 text-amber-700" />
          </div>
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">Active Questions</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">{activeQuestions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Top 3 Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Current Top 3</h3>
            <button 
              onClick={() => onNavigate('leaderboard')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View Full <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center gap-4">
            {top3.map((p, i) => (
              <div key={`top-${p.id || i}-${i}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                  i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500' : 
                  i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : 
                  'bg-gradient-to-br from-orange-300 to-orange-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-sm text-slate-500">{p.total} Total Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Daily Questions Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Recent Daily Questions</h3>
            <button 
              onClick={() => onNavigate('questions')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1">
            {questions.filter(q => q.type === 'daily').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-200 mb-3" />
                <p>No daily questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.filter(q => q.type === 'daily').reverse().slice(0, 4).map((q, i) => (
                  <div key={`daily-${q.id || i}-${i}`} className="flex items-start gap-3">
                    <span className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                      Day {getDayNumber(q.date)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{q.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{q.date} • {q.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bonus Questions Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Recent Bonus Questions</h3>
            <button 
              onClick={() => onNavigate('questions')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1">
            {questions.filter(q => q.type === 'bonus').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-200 mb-3" />
                <p>No bonus questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.filter(q => q.type === 'bonus').reverse().slice(0, 4).map((q, i) => (
                  <div key={`bonus-${q.id || i}-${i}`} className="flex items-start gap-3">
                    <span className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                      Day {getDayNumber(q.date)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{q.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{q.date} • {q.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bumper Questions Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Recent Bumper Questions</h3>
            <button 
              onClick={() => onNavigate('questions')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 flex-1">
            {questions.filter(q => q.type === 'bumper').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-200 mb-3" />
                <p>No bumper questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.filter(q => q.type === 'bumper').reverse().slice(0, 4).map((q, i) => (
                  <div key={`bumper-${q.id || i}-${i}`} className="flex items-start gap-3">
                    <span className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Day {getDayNumber(q.date)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{q.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{q.date} • {q.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
