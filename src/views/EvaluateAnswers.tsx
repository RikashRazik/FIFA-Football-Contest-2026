import React, { useState, useEffect } from 'react';
import { Question, Participant, Answer } from '../types';
import { CheckCircle, AlertCircle, ChevronRight, Check, Settings2, Zap } from 'lucide-react';
import { isQuestionTimedOut } from '../utils';

interface EvaluateAnswersProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  updateParticipantScore: (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number) => void;
  updateQuestion: (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => void;
}

export function EvaluateAnswers({ questions, participants, answers, updateParticipantScore, updateQuestion }: EvaluateAnswersProps) {
  const evaluableQuestions = questions.filter(q => (q.status === 'active' || q.status === 'past') && !q.isEvaluated && isQuestionTimedOut(q));
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Manual evaluation state
  const [evaluationMode, setEvaluationMode] = useState<'auto' | 'manual'>('auto');
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState('');
  const [participantPoints, setParticipantPoints] = useState<Record<string, number>>({});

  // When a question is selected
  const handleSelectQuestion = (q: Question) => {
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      setManualCorrectAnswer('');
      setParticipantPoints({});
      return;
    }
    
    setSelectedQuestion(q);
    setSelectedAnswer(null);
    setManualCorrectAnswer('');
    setParticipantPoints({});
    if (!q.options || q.options.length === 0) {
      setEvaluationMode('manual');
    } else {
      setEvaluationMode('auto');
    }
  };

  // Get matching answers
  const matchingAnswers = selectedQuestion && selectedAnswer 
    ? answers.filter(a => a.questionId === selectedQuestion.id && a.answer === selectedAnswer)
    : [];
    
  const matchedParticipants = participants.filter(p => 
    matchingAnswers.some(a => a.participantId === p.id)
  );

  const handleUpdateLeaderboard = async () => {
    if (!selectedQuestion || isUpdating) return;
    if (evaluationMode === 'auto' && !selectedAnswer) return;
    setIsUpdating(true);
    
    try {
      // Map question type to points category
      const categoryMap = {
        'daily': 'dailyPoints',
        'bonus': 'bonusPoints',
        'bumper': 'bumperPoints'
      } as const;
      
      const category = categoryMap[selectedQuestion.type];
      
      if (evaluationMode === 'auto') {
        // Update score for each matched participant
        for (const p of matchedParticipants) {
          await updateParticipantScore(p.id, category, selectedQuestion.points);
        }
        await updateQuestion(selectedQuestion.id, { 
          status: 'past', 
          isEvaluated: true,
          correctAnswer: selectedAnswer 
        });
      } else {
        // Manual mode
        for (const [pId, pts] of Object.entries(participantPoints)) {
          if (Number(pts) > 0) {
            await updateParticipantScore(pId, category, Number(pts));
          }
        }
        await updateQuestion(selectedQuestion.id, { 
          status: 'past', 
          isEvaluated: true,
          correctAnswer: manualCorrectAnswer || undefined
        });
      }
      
      // Reset state
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      setManualCorrectAnswer('');
      setParticipantPoints({});
    } catch (error) {
      console.error("Error updating leaderboard", error);
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Evaluate Answers</h2>
          <p className="text-slate-500 mt-1">Submit correct answers for pending questions and update the leaderboard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Active Questions List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800">Pending Evaluation</h3>
            <p className="text-xs text-slate-500">{evaluableQuestions.length} pending question(s)</p>
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            {evaluableQuestions.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No questions pending evaluation.</p>
              </div>
            ) : (
              evaluableQuestions.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedQuestion?.id === q.id 
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.text}</p>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${selectedQuestion?.id === q.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      {q.type}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {q.points} pts
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Evaluation Panel */}
        <div className="lg:col-span-2">
          {selectedQuestion ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                    {selectedQuestion.type} Question
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                    {selectedQuestion.points} Points
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedQuestion.text}</h3>
              </div>

              <div className="p-6">
                {/* Mode Switcher */}
                <div className="flex items-center gap-2 mb-6 bg-slate-50 p-1.5 rounded-lg border border-slate-200 inline-flex">
                  <button
                    onClick={() => setEvaluationMode('auto')}
                    disabled={!selectedQuestion.options || selectedQuestion.options.length === 0}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                      evaluationMode === 'auto' 
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' 
                        : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Automatic Match
                  </button>
                  <button
                    onClick={() => setEvaluationMode('manual')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                      evaluationMode === 'manual' 
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Settings2 className="w-4 h-4" />
                    Manual Review
                  </button>
                </div>

                {evaluationMode === 'auto' ? (
                  <>
                    <h4 className="font-semibold text-slate-800 mb-4">1. Select Correct Answer</h4>
                    {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {selectedQuestion.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedAnswer(prev => prev === opt ? null : opt)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              selectedAnswer === opt 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{opt}</span>
                              {selectedAnswer === opt && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-8 p-4 bg-amber-50 rounded-lg flex gap-3 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">This question has no specific options defined. Evaluation cannot be performed automatically.</p>
                      </div>
                    )}

                    {selectedAnswer && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="border-t border-slate-100 pt-6">
                          <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                            <span>2. Matched Participants</span>
                            <span className="text-sm font-normal text-slate-500">
                              <strong className="text-emerald-600">{matchedParticipants.length}</strong> correct answer(s)
                            </span>
                          </h4>
                          
                          {matchedParticipants.length > 0 ? (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[200px] overflow-y-auto">
                              <ul className="space-y-2">
                                {matchedParticipants.map(p => (
                                  <li key={p.id} className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                                    <span className="font-medium text-slate-800">{p.name}</span>
                                    <span className="text-xs font-mono text-slate-400">ID: {p.uniqueId}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                              No participants submitted the correct answer.
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-6 flex justify-end">
                          <button
                            onClick={handleUpdateLeaderboard}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                              isUpdating 
                                ? 'bg-emerald-400 text-white cursor-wait' 
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isUpdating ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Finalize & Update Leaderboard
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-2">Correct Answer (Optional)</label>
                      <input
                        type="text"
                        value={manualCorrectAnswer}
                        onChange={(e) => setManualCorrectAnswer(e.target.value)}
                        placeholder="Enter the official correct answer..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
                      />
                      <p className="text-xs text-slate-500 mt-2">This will be saved as the correct answer for reference.</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
                        <span>Participant Responses</span>
                        <span className="text-sm font-normal text-slate-500">
                          {answers.filter(a => a.questionId === selectedQuestion.id).length} answer(s)
                        </span>
                      </h4>
                      
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 max-h-[400px] overflow-y-auto">
                        <ul className="space-y-2">
                          {participants.map(p => {
                            const ans = answers.find(a => a.questionId === selectedQuestion.id && a.participantId === p.id);
                            return (
                              <li key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100 gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-800">{p.name}</span>
                                    {!ans && <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">No Answer</span>}
                                  </div>
                                  {ans && <div className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">{ans.answer}</div>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                  <label className="text-xs font-medium text-slate-500">Points:</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={participantPoints[p.id] ?? 0}
                                    onChange={(e) => setParticipantPoints(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                                    className="w-16 px-2 py-1.5 text-center text-sm rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={() => setParticipantPoints(prev => ({ ...prev, [p.id]: selectedQuestion.points }))}
                                    className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1.5 rounded font-medium transition-colors"
                                  >
                                    Mark Full
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-end">
                      <button
                        onClick={handleUpdateLeaderboard}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                          isUpdating 
                            ? 'bg-emerald-400 text-white cursor-wait' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isUpdating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Finalize & Update Leaderboard
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <div className="text-center text-slate-500 max-w-sm px-6">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Select a Question</h3>
                <p className="text-sm text-slate-500">Choose a pending question from the list to evaluate the answers and update the leaderboard.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
