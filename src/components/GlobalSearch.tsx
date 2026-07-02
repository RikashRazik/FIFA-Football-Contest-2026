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
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
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
        <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto">
            {totalResults === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {results.participants.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
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
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate">Participant ID: {p.uniqueId}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.questions.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
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
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3 transition-colors"
                      >
                        <div className="mt-0.5 shrink-0 text-slate-400">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{q.title || q.text}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{q.type} • Day {q.date ? new Date(q.date).getDate() : '?'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.answers.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-t border-slate-100">
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
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0 text-slate-400">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-900 line-clamp-2">"{a.answer}"</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              by {participant?.name || 'Unknown'} {question ? `on ${question.title || question.type}` : ''}
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
