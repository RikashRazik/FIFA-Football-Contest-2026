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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening in the contest today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Participants</p>
            <p className="text-3xl font-bold text-slate-900">{participants.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Points Awarded</p>
            <p className="text-3xl font-bold text-slate-900">{totalPointsAwarded}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Questions</p>
            <p className="text-3xl font-bold text-slate-900">{activeQuestions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
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
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
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
                {questions.filter(q => q.type === 'daily').slice(0, 4).map(q => (
                  <div key={q.id} className="flex items-start gap-3">
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
                {questions.filter(q => q.type === 'bonus').slice(0, 4).map(q => (
                  <div key={q.id} className="flex items-start gap-3">
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
                {questions.filter(q => q.type === 'bumper').slice(0, 4).map(q => (
                  <div key={q.id} className="flex items-start gap-3">
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
