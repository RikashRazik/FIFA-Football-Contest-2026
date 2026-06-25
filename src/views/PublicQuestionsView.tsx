import React, { useState } from 'react';
import { Question } from '../types';

interface PublicQuestionsViewProps {
  date: string;
  questions: Question[];
}

export function PublicQuestionsView({ date, questions }: PublicQuestionsViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
        <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-4 text-center">World Cup 2026 Contest</h1>
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-blue-900/50 max-w-md w-full text-center">
          <p className="text-xl font-bold text-slate-400 mb-2">No Questions Found</p>
          <p className="text-slate-500">There are no questions scheduled for this day.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1128] text-slate-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            World Cup 2026 Contest
          </h1>
          <div className="inline-block bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border border-blue-500 rounded-full px-8 py-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-xl font-bold text-yellow-400 tracking-wider">
              DAY {getDayNumber(date)} QUESTIONS
            </span>
          </div>
          <p className="text-slate-400 font-medium">Select your answers below. Good luck!</p>
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
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
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

        {Object.keys(selectedOptions).length === questions.length && questions.length > 0 && (
          <div className="flex justify-center pt-8">
            <button className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all transform hover:-translate-y-1">
              Submit Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
