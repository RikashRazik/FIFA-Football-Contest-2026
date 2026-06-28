import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../types';
import { Clock } from 'lucide-react';
import { isQuestionTimedOut, COUNTRIES } from '../utils';

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
  answers: import('../types').Answer[];
  addAnswer: (questionId: string, participantId: string, answer: string) => void;
  isActiveView?: boolean;
}

export function PublicQuestionsView({ date, questions, participants, answers, addAnswer, isActiveView }: PublicQuestionsViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number | string | string[]>>({});
  const [uniqueId, setUniqueId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInParticipant, setLoggedInParticipant] = useState<import('../types').Participant | null>(null);

  const getDayNumber = (dateString: string) => {
    const start = new Date('2026-06-11T00:00:00Z');
    const target = new Date(dateString + 'T00:00:00Z');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const handleOptionSelect = (questionId: string, optionValue: number | string | string[]) => {
    if (isSubmitted) return;
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionValue
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

    // Check if they already submitted
    const questionIds = questions.map(q => q.id);
    const hasSubmitted = answers.some(a => a.participantId === participant.id && questionIds.includes(a.questionId));
    if (hasSubmitted) {
      setIsSubmitted(true);
      const existingAnswers = answers.filter(a => a.participantId === participant.id && questionIds.includes(a.questionId));
      const newSelectedOptions: Record<string, number | string | string[]> = {};
      existingAnswers.forEach(ans => {
        const q = questions.find(q => q.id === ans.questionId);
        if (q) {
          if (q.isManualInput) {
            if (q.manualInputCount && q.manualInputCount > 1) {
              newSelectedOptions[q.id] = ans.answer.split(' | ');
            } else {
              newSelectedOptions[q.id] = ans.answer;
            }
          } else if (q.type === 'multiple_choice' && q.options) {
            const selectedTexts = ans.answer.split(' | ');
            const indices: number[] = [];
            selectedTexts.forEach(text => {
              const idx = q.options!.indexOf(text);
              if (idx !== -1) indices.push(idx);
            });
            newSelectedOptions[q.id] = indices;
          } else if (q.options) {
            const idx = q.options.indexOf(ans.answer);
            if (idx !== -1) {
              newSelectedOptions[q.id] = idx;
            }
          }
        }
      });
      setSelectedOptions(newSelectedOptions);
    }
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
      const timeA = new Date(a.endTime!.includes('T') ? a.endTime! : `${a.date}T${a.endTime!.length === 5 ? a.endTime + ':00' : a.endTime}`).getTime();
      const timeB = new Date(b.endTime!.includes('T') ? b.endTime! : `${b.date}T${b.endTime!.length === 5 ? b.endTime + ':00' : b.endTime}`).getTime();
      return timeA - timeB;
    })[0];
  }

  return (
    <div className="min-h-screen bg-[#0a1128] text-slate-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <datalist id="countries-list">
        {COUNTRIES.map((country) => (
          <option key={country} value={country} />
        ))}
      </datalist>
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
              {isActiveView ? 'ACTIVE QUESTIONS' : `DAY ${getDayNumber(date)} QUESTIONS`}
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
          {isSubmitted && (
            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-2xl p-4 text-center">
              <p className="text-emerald-400 font-medium">
                You have already submitted your answers for today. You are viewing your previous submission.
              </p>
            </div>
          )}
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

                {q.isManualInput ? (
                  <div className="pt-4 space-y-3">
                    {Array.from({ length: q.manualInputCount || 1 }).map((_, boxIndex) => {
                      const currentAns = Array.isArray(selectedOptions[q.id])
                        ? (selectedOptions[q.id] as string[])[boxIndex]
                        : (boxIndex === 0 ? (selectedOptions[q.id] as string) : '');
                      
                      return (
                        <input
                          key={boxIndex}
                          type="text"
                          list="countries-list"
                          placeholder={q.manualInputCount && q.manualInputCount > 1 ? `Answer ${boxIndex + 1}...` : "Type your answer here..."}
                          value={currentAns || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const newArr = Array.isArray(selectedOptions[q.id])
                              ? [...(selectedOptions[q.id] as string[])]
                              : [(selectedOptions[q.id] as string) || ''];
                            
                            while(newArr.length < (q.manualInputCount || 1)) {
                              newArr.push('');
                            }
                            newArr[boxIndex] = newValue;
                            handleOptionSelect(q.id, newArr);
                          }}
                          disabled={isSubmitted || isQuestionTimedOut(q)}
                          className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 outline-none transition-all text-white placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      );
                    })}
                  </div>
                ) : (
                  q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {q.options.map((opt, i) => {
                        const isMultipleChoice = q.type === 'multiple_choice';
                        const currentSelection = selectedOptions[q.id];
                        let isSelected = false;
                        
                        if (isMultipleChoice) {
                          isSelected = Array.isArray(currentSelection) && currentSelection.includes(i);
                        } else {
                          isSelected = currentSelection === i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (isMultipleChoice) {
                                const currentArr = Array.isArray(currentSelection) ? [...currentSelection as number[]] : [];
                                const maxSelections = q.maxSelections || 2;
                                
                                if (currentArr.includes(i)) {
                                  // Deselect
                                  handleOptionSelect(q.id, currentArr.filter(idx => idx !== i));
                                } else if (currentArr.length < maxSelections) {
                                  // Select
                                  handleOptionSelect(q.id, [...currentArr, i]);
                                }
                              } else {
                                handleOptionSelect(q.id, i);
                              }
                            }}
                            disabled={isSubmitted || isQuestionTimedOut(q)}
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
                              {q.type === 'multiple_choice' ? i + 1 : String.fromCharCode(65 + i)}
                            </span>
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-blue-900/50 p-6 md:p-8 mt-8 shadow-xl text-center">
          {isSubmitted ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-2">Answers Submitted!</h3>
              <p className="text-slate-400">You have already submitted your answers for today.</p>
              <button
                onClick={() => setShowSuccessModal(true)}
                className="px-8 py-3 bg-[#25D366] hover:bg-[#1ebd57] text-white rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center justify-center gap-3 mx-auto w-full sm:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Share Answers via WhatsApp
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-4">Ready to Submit?</h3>
              <p className="text-slate-400 mb-6">Double-check your answers before submitting. You cannot change them later.</p>
              <button 
                onClick={() => {
                  setError('');
                  if (Object.keys(selectedOptions).length !== questions.filter(q => !isQuestionTimedOut(q)).length) {
                    setError('Please answer all available questions before submitting.');
                    return;
                  }
                  
                  // Submit answers
                  Object.entries(selectedOptions).forEach(([qId, optValue]) => {
                    const question = questions.find(q => q.id === qId);
                    if (question && isQuestionTimedOut(question)) return;
                    
                    if (question && loggedInParticipant) {
                      if (question.isManualInput) {
                        const valString = Array.isArray(optValue) ? optValue.filter(Boolean).join(' | ') : String(optValue);
                        addAnswer(qId, loggedInParticipant.id, valString);
                      } else if (question.type === 'multiple_choice' && question.options) {
                        const indices = Array.isArray(optValue) ? optValue as number[] : [optValue as number];
                        const valString = indices.map(idx => question.options![idx]).join(' | ');
                        addAnswer(qId, loggedInParticipant.id, valString);
                      } else if (question.options) {
                        const optionIndex = optValue as number;
                        addAnswer(qId, loggedInParticipant.id, question.options[optionIndex]);
                      }
                    }
                  });
                  setIsSubmitted(true);
                  setShowSuccessModal(true);
                }}
                className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all whitespace-nowrap w-full sm:w-auto"
              >
                Submit All Answers
              </button>
              {error && <p className="text-red-400 mt-4 text-sm font-medium bg-red-900/20 p-3 rounded-lg border border-red-900/50 text-center">{error}</p>}
            </>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-emerald-500/30"
            >
              <div className="p-8 text-center bg-gradient-to-b from-emerald-900/20 to-transparent">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-3xl font-bold text-emerald-400 mb-3 tracking-tight">Success!</h3>
                <p className="text-emerald-100/80 mb-8 text-lg">Your responses have been recorded, <span className="font-bold text-white">{loggedInParticipant?.name}</span>. Best of luck!</p>
              
              <button
                onClick={() => {
                  let message = `*SFWC 26 Day ${getDayNumber(date)} - ${loggedInParticipant?.name}*\r\n\r\n`;
              
                  questions.forEach((q, qIndex) => {
                    const participantAnswers = answers.filter(a => a.participantId === loggedInParticipant?.id);
                    let answerForQ = participantAnswers.find(a => a.questionId === q.id)?.answer;
                    
                    if (!answerForQ) {
                      const selectedOpt = selectedOptions[q.id];
                      if (q.isManualInput) {
                        answerForQ = Array.isArray(selectedOpt) ? selectedOpt.filter(Boolean).join(' | ') : String(selectedOpt || '');
                      } else if (q.type === 'multiple_choice' && q.options && selectedOpt !== undefined) {
                        const indices = Array.isArray(selectedOpt) ? selectedOpt as number[] : [selectedOpt as number];
                        answerForQ = indices.map(idx => q.options![idx]).join(' | ');
                      } else if (q.options && selectedOpt !== undefined) {
                        answerForQ = q.options[selectedOpt as number];
                      }
                    }

                    if (q.isManualInput || q.type === 'multiple_choice') {
                      message += `*Q${qIndex + 1}* - ${answerForQ || 'No Answer'}\r\n`;
                    } else if (answerForQ && q.options) {
                      const optIndex = q.options.indexOf(answerForQ);
                      if (optIndex !== -1) {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        message += `*Q${qIndex + 1}* - Option ${optionLetter} - ${answerForQ}\r\n`;
                      } else {
                        message += `*Q${qIndex + 1}* - ${answerForQ}\r\n`;
                      }
                    } else {
                      message += `*Q${qIndex + 1}* - No Answer\r\n`;
                    }
                  });
              
                  const encodedMessage = encodeURIComponent(message.trim());
                  window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
                  setShowSuccessModal(false);
                }}
                className="w-full py-4 bg-[#25D366] hover:bg-[#1ebd57] text-white rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center justify-center gap-3 mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Share via WhatsApp
              </button>
              
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="text-slate-400 hover:text-white transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
