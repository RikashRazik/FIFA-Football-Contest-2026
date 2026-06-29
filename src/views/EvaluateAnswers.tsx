import React, { useState, useEffect } from 'react';
import { Question, Participant, Answer } from '../types';
import { CheckCircle, AlertCircle, ChevronRight, Check, Settings2, Zap, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isQuestionTimedOut, getDynamicQuestionStatus } from '../utils';

interface EvaluateAnswersProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  updateParticipantScore: (id: string, category: 'dailyPoints' | 'bonusPoints' | 'bumperPoints', delta: number, dayIndex?: number) => void;
  updateQuestion: (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => void;
  addAnswer: (questionId: string, participantId: string, answer: string) => void;
}

export function EvaluateAnswers({ questions, participants, answers, updateParticipantScore, updateQuestion, addAnswer }: EvaluateAnswersProps) {
  const evaluableQuestions = questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !q.isEvaluated && isQuestionTimedOut(q));
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Manual evaluation state
  const [evaluationMode, setEvaluationMode] = useState<'auto' | 'manual'>('auto');
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState('');
  const [participantPoints, setParticipantPoints] = useState<Record<string, number>>({});
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [editingAnswerUserId, setEditingAnswerUserId] = useState<string | null>(null);
  const [editedAnswerValue, setEditedAnswerValue] = useState<string>('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssignValue, setBulkAssignValue] = useState<string>('');

  const handleParseBulk = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    let matchedCount = 0;
    const newPoints = { ...participantPoints };
    
    for (const line of lines) {
        if (!line.trim()) continue;
        const cleanLine = line.replace(/^\d+[\.\)]?\s*/, '').trim();
        const numMatch = cleanLine.match(/\d+$/);
        if (numMatch) {
            const score = parseInt(numMatch[0], 10);
            let namePart = cleanLine.substring(0, numMatch.index).replace(/[-\.:\s]+$/, '').trim();
            const participant = participants.find(p => p.name.toLowerCase() === namePart.toLowerCase() || p.name.toLowerCase().includes(namePart.toLowerCase()) || namePart.toLowerCase().includes(p.name.toLowerCase()));
            if (participant) {
                newPoints[participant.id] = score;
                matchedCount++;
            }
        }
    }
    setParticipantPoints(newPoints);
    setBulkFeedback(`Successfully matched ${matchedCount} participants! Please review the preview below before finalizing.`);
    toast.success(`Successfully matched ${matchedCount} participants!`);
  };

  // When a question is selected
  const handleSelectQuestion = (q: Question) => {
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      setSelectedMultipleAnswers([]);
      setManualCorrectAnswer('');
      setParticipantPoints({});
      setBulkText('');
      setBulkFeedback('');
      setShowBulkPaste(false);
      return;
    }
    
    setSelectedQuestion(q);
    setSelectedAnswer(null);
    setSelectedMultipleAnswers([]);
    setManualCorrectAnswer('');
    setParticipantPoints({});
    setBulkText('');
    setBulkFeedback('');
    setShowBulkPaste(false);
    setShowBulkAssign(false);
    setBulkAssignValue('');
    setEditingAnswerUserId(null);
    setEditedAnswerValue('');
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

  const isMC = selectedQuestion ? (selectedQuestion.type === 'multiple_choice' || !!selectedQuestion.isMultipleChoice) : false;

  // Multiple Choice matching logic
  const multipleChoiceScores: Record<string, number> = {};
  if (isMC && selectedQuestion) {
    participants.forEach(p => {
      const pAnswer = answers.find(a => a.questionId === selectedQuestion.id && a.participantId === p.id);
      if (pAnswer) {
        const pChoices = pAnswer.answer.split(' | ');
        let score = 0;
        pChoices.forEach(choice => {
          if (selectedMultipleAnswers.includes(choice)) {
            score += 1;
          }
        });
        if (score > 0) {
          multipleChoiceScores[p.id] = score;
        }
      }
    });
  }

  const handleUpdateLeaderboard = async () => {
    if (!selectedQuestion || isUpdating) return;
    if (evaluationMode === 'auto' && !isMC && !selectedAnswer) return;
    if (evaluationMode === 'auto' && isMC && selectedMultipleAnswers.length === 0) return;
    setIsUpdating(true);
    
    try {
      // Map question type to points category
      const categoryMap: Record<string, 'dailyPoints' | 'bonusPoints' | 'bumperPoints'> = {
        'daily': 'dailyPoints',
        'bonus': 'bonusPoints',
        'bumper': 'bumperPoints',
        'special': 'bonusPoints',
        'multiple_choice': 'bonusPoints'
      };
      
      const category = categoryMap[selectedQuestion.type] || 'dailyPoints';
      
      const getDayIndex = (dateString: string) => {
        const start = new Date('2026-06-11T00:00:00Z');
        const target = new Date(dateString + 'T00:00:00Z');
        return Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      };
      const dayIdx = getDayIndex(selectedQuestion.date);
      
      if (evaluationMode === 'auto') {
        if (isMC) {
          for (const [pId, score] of Object.entries(multipleChoiceScores)) {
            await updateParticipantScore(pId, category, score, dayIdx);
          }
          await updateQuestion(selectedQuestion.id, { 
            status: 'past', 
            isEvaluated: true,
            correctAnswer: selectedMultipleAnswers.join(' | ')
          });
        } else {
          // Update score for each matched participant
          for (const p of matchedParticipants) {
            await updateParticipantScore(p.id, category, selectedQuestion.points, dayIdx);
          }
          await updateQuestion(selectedQuestion.id, { 
            status: 'past', 
            isEvaluated: true,
            correctAnswer: selectedAnswer 
          });
        }
      } else {
        // Manual mode
        for (const [pId, pts] of Object.entries(participantPoints)) {
          if (Number(pts) > 0) {
            await updateParticipantScore(pId, category, Number(pts), dayIdx);
          }
        }
        const updateData: any = { 
          status: 'past', 
          isEvaluated: true
        };
        if (manualCorrectAnswer) {
          updateData.correctAnswer = manualCorrectAnswer;
        }
        await updateQuestion(selectedQuestion.id, updateData);
      }
      
      // Reset state
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      setManualCorrectAnswer('');
      setParticipantPoints({});
      setBulkText('');
      setBulkFeedback('');
      setShowBulkPaste(false);
      toast.success('Leaderboard updated successfully!');
    } catch (error) {
      console.error("Error updating leaderboard", error);
      toast.error('Failed to update leaderboard.');
    } finally {
      setIsUpdating(false);
    }
  };


  const handleSkipEvaluation = async () => {
    if (!selectedQuestion || isUpdating) return;

    let answerToSave = '';
    if (evaluationMode === 'auto') {
      if (isMC) {
        if (selectedMultipleAnswers.length === 0) {
          alert("Please select at least one correct answer to save before skipping evaluation.");
          return;
        }
        answerToSave = selectedMultipleAnswers.join(' | ');
      } else {
        if (!selectedAnswer) {
          alert("Please select a correct answer to save before skipping evaluation.");
          return;
        }
        answerToSave = selectedAnswer;
      }
    } else {
      if (!manualCorrectAnswer) {
        alert("Please provide or select a correct answer to save before skipping evaluation.");
        return;
      }
      answerToSave = manualCorrectAnswer;
    }

    setIsUpdating(true);
    
    try {
      await updateQuestion(selectedQuestion.id, { 
        status: 'past', 
        isEvaluated: true,
        correctAnswer: answerToSave
      });
      
      // Reset state
      setSelectedQuestion(null);
      setSelectedAnswer(null);
      setManualCorrectAnswer('');
      setParticipantPoints({});
      setBulkText('');
      setBulkFeedback('');
      setShowBulkPaste(false);
      toast.success('Evaluation skipped and marked as evaluated!');
    } catch (error) {
      console.error("Error skipping evaluation", error);
      toast.error('Failed to skip evaluation.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportUserAnswers = () => {
    // Generate CSV for all participants and their answers
    // Only use questions that are either 'active' or 'past' 
    const relevantQuestions = questions.filter(q => q.status !== 'upcoming');
    const header = ['User', ...relevantQuestions.map(q => q.title || `Q${q.id.substring(0,4)}`)];
    const rows = participants.map(p => {
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        ...relevantQuestions.map(q => {
          const ans = answers.find(a => a.questionId === q.id && a.participantId === p.id);
          let text = ans ? ans.answer : 'No Answer';
          if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            text = `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
      ];
    });

    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_answers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Evaluate Answers</h2>
          <p className="text-slate-500 mt-1">Submit correct answers for pending questions and update the leaderboard.</p>
        </div>
        <button
          onClick={handleExportUserAnswers}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Export All Answers
        </button>
      </div>

      <div className="space-y-4">
        {evaluableQuestions.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">All caught up!</h3>
            <p className="text-slate-500">No questions pending evaluation.</p>
          </div>
        ) : (
          evaluableQuestions.map(q => {
            const isSelected = selectedQuestion?.id === q.id;
            
            return (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                <button
                  onClick={() => handleSelectQuestion(q)}
                  className={`w-full text-left p-4 sm:p-6 transition-colors ${
                    isSelected ? 'bg-indigo-50/50 border-b border-indigo-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {q.title && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-100/50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {q.title}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {q.type} Question
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {q.points} pts
                        </span>
                      </div>
                      <h3 className={`text-lg font-bold line-clamp-2 ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>{q.text}</h3>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isSelected ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>
                
                {isSelected && (
                  <div className="p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-300 border-t border-slate-100 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Evaluation Options</h4>
                      <button
                        onClick={handleSkipEvaluation}
                        disabled={isUpdating}
                        className="shrink-0 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Skip & Mark Evaluated
                      </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex items-center gap-2 mb-6 bg-slate-50 p-1.5 rounded-lg border border-slate-200 inline-flex self-start shrink-0">
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
                    <h4 className="font-semibold text-slate-800 mb-4">1. Select Correct Answer{isMC ? 's' : ''}</h4>
                    {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {selectedQuestion.options.map((opt, i) => {
                          const isSelected = isMC 
                            ? selectedMultipleAnswers.includes(opt)
                            : selectedAnswer === opt;
                            
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                if (isMC) {
                                  setSelectedMultipleAnswers(prev => 
                                    prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
                                  );
                                } else {
                                  setSelectedAnswer(prev => prev === opt ? null : opt);
                                }
                              }}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' 
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{opt}</span>
                                {isSelected && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mb-8 p-4 bg-amber-50 rounded-lg flex gap-3 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">This question has no specific options defined. Evaluation cannot be performed automatically.</p>
                      </div>
                    )}

                    {(isMC ? selectedMultipleAnswers.length > 0 : selectedAnswer) && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="border-t border-slate-100 pt-6">
                          <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                            <span>2. Matched Participants</span>
                            {!isMC && (
                              <span className="text-sm font-normal text-slate-500">
                                <strong className="text-emerald-600">{matchedParticipants.length}</strong> correct answer(s)
                              </span>
                            )}
                          </h4>
                          
                          {isMC ? (
                            Object.keys(multipleChoiceScores).length > 0 ? (
                              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-y-visible">
                                <ul className="space-y-2">
                                  {Object.entries(multipleChoiceScores).map(([pId, score]) => {
                                    const p = participants.find(part => part.id === pId);
                                    return (
                                      <li key={pId} className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                                        <div>
                                          <span className="font-medium text-slate-800">{p?.name || 'Unknown'}</span>
                                          <span className="ml-2 text-xs font-mono text-slate-400">ID: {p?.uniqueId}</span>
                                        </div>
                                        <span className="font-bold text-emerald-600">+{score} pts</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                                No participants submitted any of the correct answers.
                              </div>
                            )
                          ) : (
                            matchedParticipants.length > 0 ? (
                              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-y-visible">
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
                            )
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
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 flex-1 flex flex-col">
                    <div className="shrink-0">
                      <label className="block font-semibold text-slate-800 mb-2">Correct Answer (Optional)</label>
                      {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                        <div className="relative">
                          <select
                            value={manualCorrectAnswer}
                            onChange={(e) => setManualCorrectAnswer(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow appearance-none bg-white"
                          >
                            <option value="">Select the correct option...</option>
                            {selectedQuestion.options.map((opt, i) => (
                              <option key={i} value={opt}>Option {isMC ? i + 1 : String.fromCharCode(65 + i)} - {opt}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={manualCorrectAnswer}
                          onChange={(e) => setManualCorrectAnswer(e.target.value)}
                          placeholder="Enter the official correct answer..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
                        />
                      )}
                      <p className="text-xs text-slate-500 mt-2">This will be saved as the correct answer for reference.</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex-1 flex flex-col min-h-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 shrink-0">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>Participant Responses</span>
                          <span className="text-sm font-normal text-slate-500">
                            {answers.filter(a => a.questionId === selectedQuestion.id).length} answer(s)
                          </span>
                        </h4>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button
                            onClick={() => {
                              setShowBulkAssign(!showBulkAssign);
                              setShowBulkPaste(false);
                            }}
                            className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${showBulkAssign ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {showBulkAssign ? 'Hide Bulk Assign' : 'Bulk Assign Missing Answers'}
                          </button>
                          <button
                            onClick={() => {
                              setShowBulkPaste(!showBulkPaste);
                              setShowBulkAssign(false);
                            }}
                            className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${showBulkPaste ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {showBulkPaste ? 'Hide Bulk Paste' : 'Bulk Paste Marks'}
                          </button>
                        </div>
                      </div>

                      {showBulkAssign && (
                        <div className="mb-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 shrink-0">
                          <label className="block text-sm font-semibold text-indigo-900 mb-2">Assign Answer to All Missing Participants</label>
                          <p className="text-xs text-indigo-700/70 mb-3">This will submit the selected answer for all participants who have "No Answer" for this question.</p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                                isMC ? (
                                  <div className="flex flex-wrap gap-2 text-sm">
                                    {selectedQuestion.options.map((opt, i) => {
                                      const isChecked = bulkAssignValue.split(' | ').includes(opt);
                                      return (
                                        <label key={i} className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                                          <input 
                                            type="checkbox" 
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const currentAnswers = bulkAssignValue ? bulkAssignValue.split(' | ').filter(Boolean) : [];
                                              if (e.target.checked) {
                                                setBulkAssignValue([...currentAnswers, opt].join(' | '));
                                              } else {
                                                setBulkAssignValue(currentAnswers.filter(a => a !== opt).join(' | '));
                                              }
                                            }}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <span className="text-slate-700">{opt}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <select
                                    value={bulkAssignValue}
                                    onChange={(e) => setBulkAssignValue(e.target.value)}
                                    className="w-full text-sm px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                  >
                                    <option value="" disabled>Select an option...</option>
                                    {selectedQuestion.options.map((opt, i) => (
                                      <option key={i} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                )
                              ) : (
                                <input
                                  type="text"
                                  value={bulkAssignValue}
                                  onChange={(e) => setBulkAssignValue(e.target.value)}
                                  placeholder="Enter answer for all missing participants..."
                                  className="w-full text-sm px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (!bulkAssignValue.trim()) return;
                                let count = 0;
                                participants.forEach(p => {
                                  const ans = answers.find(a => a.questionId === selectedQuestion.id && a.participantId === p.id);
                                  if (!ans) {
                                    addAnswer(selectedQuestion.id, p.id, bulkAssignValue.trim());
                                    count++;
                                  }
                                });
                                toast.success(`Assigned answer to ${count} participants!`);
                                setBulkAssignValue('');
                                setShowBulkAssign(false);
                              }}
                              disabled={!bulkAssignValue.trim()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              Assign to Missing
                            </button>
                          </div>
                        </div>
                      )}

                      {showBulkPaste && (
                        <div className="mb-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 shrink-0">
                          <label className="block text-sm font-semibold text-indigo-900 mb-2">Paste Marks</label>
                          <p className="text-xs text-indigo-700/70 mb-3">Format: Name followed by points (e.g. "1. John Doe - 2"). The system will extract the name and the last number on each line.</p>
                          <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="1. Shani - 1&#10;2. Shemeed - 2&#10;3. Askar - 2"
                            className="w-full h-32 px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-mono mb-3"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleParseBulk}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Parse & Apply
                            </button>
                            {bulkFeedback && (
                              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" />
                                {bulkFeedback}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 overflow-y-visible">
                        <ul className="space-y-2">
                          {participants.map(p => {
                            const ans = answers.find(a => a.questionId === selectedQuestion.id && a.participantId === p.id);
                            return (
                              <li key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100 gap-3">
                                <div className="flex-1 w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-slate-800">{p.name}</span>
                                    {!ans && editingAnswerUserId !== p.id && <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">No Answer</span>}
                                    {editingAnswerUserId !== p.id && (
                                      <button 
                                        onClick={() => {
                                          setEditingAnswerUserId(p.id);
                                          setEditedAnswerValue(ans ? ans.answer : '');
                                        }}
                                        className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded uppercase transition-colors ml-2"
                                      >
                                        {ans ? 'Edit Answer' : 'Add Answer'}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {editingAnswerUserId === p.id ? (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 w-full">
                                      <div className="flex-1 w-full">
                                        {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                                          isMC ? (
                                            <div className="flex flex-wrap gap-2 text-sm">
                                              {selectedQuestion.options.map((opt, i) => {
                                                const isChecked = editedAnswerValue.split(' | ').includes(opt);
                                                return (
                                                  <label key={i} className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded cursor-pointer hover:bg-slate-100">
                                                    <input 
                                                      type="checkbox" 
                                                      checked={isChecked}
                                                      onChange={(e) => {
                                                        const currentAnswers = editedAnswerValue ? editedAnswerValue.split(' | ').filter(Boolean) : [];
                                                        if (e.target.checked) {
                                                          setEditedAnswerValue([...currentAnswers, opt].join(' | '));
                                                        } else {
                                                          setEditedAnswerValue(currentAnswers.filter(a => a !== opt).join(' | '));
                                                        }
                                                      }}
                                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-slate-700">{opt}</span>
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <select
                                              value={editedAnswerValue}
                                              onChange={(e) => setEditedAnswerValue(e.target.value)}
                                              className="w-full text-sm px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                              <option value="" disabled>Select an option...</option>
                                              {selectedQuestion.options.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          )
                                        ) : (
                                          <input
                                            type="text"
                                            value={editedAnswerValue}
                                            onChange={(e) => setEditedAnswerValue(e.target.value)}
                                            placeholder="Enter answer..."
                                            className="w-full text-sm px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                                        <button
                                          onClick={() => {
                                            if (editedAnswerValue.trim()) {
                                              addAnswer(selectedQuestion.id, p.id, editedAnswerValue.trim());
                                              toast.success('Answer saved!');
                                            }
                                            setEditingAnswerUserId(null);
                                          }}
                                          className="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingAnswerUserId(null)}
                                          className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    ans && (
                                      <div className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                                        {(() => {
                                          if (selectedQuestion.options) {
                                            if (isMC) {
                                              const parts = ans.answer.split(' | ');
                                              const indices = parts.map(part => {
                                                const idx = selectedQuestion.options?.indexOf(part);
                                                return idx !== undefined && idx !== -1 ? `${idx + 1}` : '';
                                              }).filter(Boolean);
                                              return indices.length > 0 ? `Option(s) ${indices.join(', ')} - ${ans.answer}` : ans.answer;
                                            } else {
                                              const optIndex = selectedQuestion.options.indexOf(ans.answer);
                                              if (optIndex !== -1) {
                                                return `Option ${String.fromCharCode(65 + optIndex)} - ${ans.answer}`;
                                              }
                                            }
                                          }
                                          return ans.answer;
                                        })()}
                                      </div>
                                    )
                                  )}
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
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
