import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Clock } from 'lucide-react';

const CountdownTimer: React.FC<{ endTime: string, date: string }> = ({ endTime, date }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!endTime) return '';
      const now = new Date();
      let targetTime;
      if (endTime.includes('T')) {
        targetTime = new Date(endTime);
      } else {
        const timeStr = endTime.length === 5 ? `${endTime}:00` : endTime;
        targetTime = new Date(`${date}T${timeStr}`);
      }
      
      const diff = targetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        return 'Expired';
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, date]);

  if (!timeLeft) return null;

  const isExpired = timeLeft === 'Expired';

  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
      isExpired ? 'bg-red-900/50 text-red-300 border border-red-700/50' : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      {isExpired ? 'Time is up' : `${timeLeft} left`}
    </span>
  );
};

interface PublicQuestionsViewProps {
  date: string;
  questions: Question[];
  participants: import('../types').Participant[];
  addAnswer: (questionId: string, participantId: string, answer: string) => void;
}

export function PublicQuestionsView({ date, questions, participants, addAnswer }: PublicQuestionsViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [uniqueId, setUniqueId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInParticipant, setLoggedInParticipant] = useState<import('../types').Participant | null>(null);

  const getDayNumber = (dateString: string) => {
    const start = new Date('2026-06-11T00:00:00Z');
    const target = new Date(dateString + 'T00:00:00Z');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (uniqueId.length !== 4) {
      setError('Please enter a valid 4-digit ID.');
      return;
    }
    const participant = participants.find(p => p.uniqueId === uniqueId);
    if (!participant) {
      setError('Invalid Unique ID. Please check and try again.');
      return;
    }
    setLoggedInParticipant(participant);
    setIsAuthenticated(true);
    setError('');
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
        <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-4 text-center">SFWC 2026</h1>
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-blue-900/50 max-w-md w-full text-center">
          <p className="text-xl font-bold text-slate-400 mb-2">No Questions Found</p>
          <p className="text-slate-500">There are no questions scheduled for this day.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-500/30">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center mb-4">
              <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              SFWC 2026
            </h1>
            <div className="inline-block bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500 rounded-full px-6 py-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span className="text-lg font-bold text-yellow-400 tracking-wider">
                DAY {getDayNumber(date)}
              </span>
            </div>
          </div>
          
          <div className="bg-[#0f172a] p-8 rounded-2xl border border-blue-900/50 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Participant Login</h2>
            <p className="text-slate-400 text-sm text-center mb-6">Enter your 4-digit unique ID to answer today's questions.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter 4-digit ID"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  maxLength={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-center text-xl tracking-[0.5em]"
                />
              </div>
              {error && <p className="text-red-400 text-sm font-medium bg-red-900/20 p-3 rounded-lg border border-red-900/50 text-center">{error}</p>}
              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all"
              >
                Access Questions
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Find the earliest active end time to display at the top
  const activeQuestionsWithTime = questions.filter(q => q.status === 'active' && q.endTime);
  let globalEndTime = null;
  if (activeQuestionsWithTime.length > 0) {
    globalEndTime = activeQuestionsWithTime.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.endTime!.length === 5 ? a.endTime + ':00' : a.endTime}`).getTime();
      const timeB = new Date(`${b.date}T${b.endTime!.length === 5 ? b.endTime + ':00' : b.endTime}`).getTime();
      return timeA - timeB;
    })[0];
  }

  return (
    <div className="min-h-screen bg-[#0a1128] text-slate-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            SFWC 2026
          </h1>
          <div className="inline-block bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500 rounded-full px-8 py-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-xl font-bold text-yellow-400 tracking-wider">
              DAY {getDayNumber(date)} QUESTIONS
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 mt-4">
            <p className="text-slate-300 font-medium">Welcome, <span className="text-white font-bold">{loggedInParticipant?.name}</span></p>
            {globalEndTime && !isSubmitted && (
              <div className="mt-2 inline-flex flex-col items-center bg-[#0f172a] px-6 py-3 rounded-2xl border border-amber-900/50 shadow-lg">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Time Remaining</span>
                <CountdownTimer endTime={globalEndTime.endTime!} date={globalEndTime.date} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="bg-[#0f172a] rounded-2xl border border-blue-900/50 overflow-hidden shadow-xl transition-all hover:border-blue-700/50">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    q.type === 'daily' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' :
                    q.type === 'bonus' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' :
                    'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                  }`}>
                    {q.type} Question
                  </span>
                  <span className="text-sm font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                    {q.points} Points
                  </span>
                  {q.endTime && q.status === 'active' && <CountdownTimer endTime={q.endTime} date={q.date} />}
                </div>
                
                <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
                  <span className="text-blue-500 mr-2">Q{qIndex + 1}.</span> {q.text}
                </h2>

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {q.options.map((opt, i) => {
                      const isSelected = selectedOptions[q.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => handleOptionSelect(q.id, i)}
                          disabled={isSubmitted}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                              : 'border-slate-800 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isSubmitted ? (
          <div className="bg-[#0f172a] rounded-2xl border border-blue-900/50 p-6 md:p-8 mt-8 shadow-xl text-center">
            <h3 className="text-xl font-bold text-white mb-4">Ready to Submit?</h3>
            <p className="text-slate-400 mb-6">Double-check your answers before submitting. You cannot change them later.</p>
            <button 
              onClick={() => {
                setError('');
                if (Object.keys(selectedOptions).length !== questions.length) {
                  setError('Please answer all questions before submitting.');
                  return;
                }
                
                // Submit answers
                Object.entries(selectedOptions).forEach(([qId, optIdx]) => {
                  const question = questions.find(q => q.id === qId);
                  const optionIndex = optIdx as number;
                  if (question && question.options && loggedInParticipant) {
                    addAnswer(qId, loggedInParticipant.id, question.options[optionIndex]);
                  }
                });
                setIsSubmitted(true);
              }}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all whitespace-nowrap"
            >
              Submit All Answers
            </button>
            {error && <p className="text-red-400 mt-4 text-sm font-medium bg-red-900/20 p-3 rounded-lg border border-red-900/50 text-center">{error}</p>}
          </div>
        ) : (
          <div className="bg-emerald-900/20 border border-emerald-500/50 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)] mt-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">Answers Submitted Successfully!</h3>
            <p className="text-emerald-200/70">Your responses have been recorded, {loggedInParticipant?.name}. Best of luck!</p>
          </div>
        )}
      </div>
    </div>
  );
}
