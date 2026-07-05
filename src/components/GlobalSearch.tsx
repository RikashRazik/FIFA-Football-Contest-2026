import React, { useState, useEffect, useRef } from 'react';
import { Search, User, HelpCircle, MessageSquare } from 'lucide-react';
import { Participant, Question, Answer } from '../types';

interface GlobalSearchProps {
  participants: Participant[];
  questions: Question[];
  answers: Answer[];
  onParticipantClick: (participant: Participant) => void;
  onQuestionClick: (question: Question) => void;
}

export function GlobalSearch({ participants, questions, answers, onParticipantClick, onQuestionClick }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = {
    participants: [] as Participant[],
    questions: [] as Question[],
    answers: [] as Answer[]
  };

  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    
    results.participants = participants.filter(p => 
      p.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    results.questions = questions.filter(q => 
      q.text.toLowerCase().includes(lowerQuery) || 
      (q.title && q.title.toLowerCase().includes(lowerQuery)) ||
      (q.type && q.type.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);

    results.answers = answers.filter(a => 
      a.answer.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }

  const totalResults = results.participants.length + results.questions.length + results.answers.length;

  return (
    <div className="relative w-full max-w-xs md:max-w-md" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-700/50 rounded-full leading-5 bg-slate-800/40 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-slate-800/60 focus:ring-1 focus:ring-slate-600 focus:border-slate-600 sm:text-sm transition-all"
          placeholder="Search users, questions, answers..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute mt-1 w-full bg-[#0a1128] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="max-h-96 overflow-y-auto">
            {totalResults === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {results.participants.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 border-y border-slate-800/50">
                      Users
                    </div>
                    {results.participants.map(p => (
                      <button
                        key={`user-${p.id}`}
                        onClick={() => {
                          onParticipantClick(p);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate">Participant ID: {p.uniqueId}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.questions.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 border-y border-slate-800/50 mt-2">
                      Questions
                    </div>
                    {results.questions.map(q => (
                      <button
                        key={`q-${q.id}`}
                        onClick={() => {
                          onQuestionClick(q);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800/50 flex items-start gap-3 transition-colors"
                      >
                        <div className="mt-0.5 shrink-0 text-indigo-400 bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-400/30">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200 line-clamp-1">{q.title || q.text}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{q.type} • Day {q.date ? new Date(q.date).getDate() : '?'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.answers.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50 border-y border-slate-800/50 mt-2">
                      Answers
                    </div>
                    {results.answers.map((a, i) => {
                      const participant = participants.find(p => p.id === a.participantId);
                      const question = questions.find(q => q.id === a.questionId);
                      return (
                        <button
                          key={`a-${a.id || i}`}
                          onClick={() => {
                            if (participant) onParticipantClick(participant);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-800/50 flex items-start gap-3 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0 text-emerald-400 bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-400/30">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-300 line-clamp-2">"{a.answer}"</p>
                            <p className="text-[10px] text-slate-500 truncate mt-1">
                              by <span className="font-medium text-indigo-400">{participant?.name || 'Unknown'}</span> {question ? `on ${question.title || question.type}` : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
