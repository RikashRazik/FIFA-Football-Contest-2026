import React, { useState, useEffect, useMemo } from 'react';
import { Question, Participant, Answer } from '../types';
import { Clock, Users, Activity, Trash2, Link as LinkIcon, CheckCircle2, Pencil, X, Calendar, Plus, Save, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isQuestionTimedOut, getDynamicQuestionStatus } from '../utils';
import { ShareLinkModal } from '../components/ShareLinkModal';

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
    <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shrink-0 ${
      isExpired ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
    }`}>
      <Clock className="w-3 h-3" />
      {isExpired ? 'Time is up' : `${timeLeft} left`}
    </span>
  );
};

interface ActiveQuestionsProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  deleteParticipantAnswers: (answerIds: string[]) => void;
  updateQuestion: (id: string, fields: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
}

export function ActiveQuestions({ 
  questions, 
  participants, 
  answers, 
  deleteParticipantAnswers,
  updateQuestion,
  deleteQuestion
}: ActiveQuestionsProps) {
  const [submissionToDelete, setSubmissionToDelete] = useState<{participantId: string, answers: Answer[]} | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedQuestionIdForShare, setSelectedQuestionIdForShare] = useState<string | undefined>(undefined);
  const [shareModalType, setShareModalType] = useState<'active' | 'question'>('active');

  // Editing state variables
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'daily' | 'bonus' | 'bumper' | 'special' | 'multiple_choice'>('daily');
  const [editPoints, setEditPoints] = useState(1);
  const [editDate, setEditDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editIsMultipleChoice, setEditIsMultipleChoice] = useState(false);
  const [editIsManualInput, setEditIsManualInput] = useState(false);
  const [editMaxSelections, setEditMaxSelections] = useState(2);
  const [editManualInputCount, setEditManualInputCount] = useState(1);
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');

  const getDayNumber = (dateString: string) => {
    if (!dateString) return 1;
    const start = new Date('2026-06-11T00:00:00Z');
    const target = new Date(dateString + 'T00:00:00Z');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const startEditing = (q: Question) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setEditTitle(q.title || '');
    setEditType(q.type === 'multiple_choice' ? 'daily' : q.type); // map multiple_choice type to standard categories for display
    setEditPoints(q.points);
    setEditDate(q.date);
    setEditEndTime(q.endTime || '');
    setEditIsMultipleChoice(q.type === 'multiple_choice' || !!q.isMultipleChoice);
    setEditIsManualInput(!!q.isManualInput);
    setEditMaxSelections(q.maxSelections || 2);
    setEditManualInputCount(q.manualInputCount || 1);
    setEditOptions(q.options || ['', '', '']);
    setEditCorrectAnswer(q.correctAnswer || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!editText.trim()) {
      toast.error('Question text is required');
      return;
    }

    const formattedText = editText.trim().replace(/\s+/g, ' ');
    const validOptions = editOptions.map(o => o.trim()).filter(Boolean);

    const updatedFields: any = {
      text: formattedText,
      title: editTitle.trim(),
      type: editType,
      points: editPoints,
      date: editDate,
      endTime: editEndTime || '',
      isMultipleChoice: editIsMultipleChoice,
      isManualInput: editIsManualInput,
    };

    if (editIsMultipleChoice) {
      updatedFields.type = 'multiple_choice';
      updatedFields.maxSelections = editMaxSelections;
      updatedFields.points = editMaxSelections;
      updatedFields.options = validOptions;
    } else if (editIsManualInput) {
      updatedFields.manualInputCount = editManualInputCount;
      updatedFields.options = [];
      updatedFields.correctAnswer = '';
    } else {
      updatedFields.options = validOptions;
    }

    if (editCorrectAnswer) {
      updatedFields.correctAnswer = editCorrectAnswer;
    } else {
      updatedFields.correctAnswer = '';
    }

    updateQuestion(editingQuestion.id, updatedFields);
    setEditingQuestion(null);
    toast.success('Question updated successfully!');
  };

  const ShareLinkButton: React.FC = () => {
    return (
      <button
        onClick={() => {
          setShareModalType('active');
          setSelectedQuestionIdForShare(undefined);
          setIsShareModalOpen(true);
        }}
        className="flex items-center gap-2 text-sm font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl border border-indigo-500 shadow-md hover:bg-indigo-700 transition-all active:scale-95 hover:shadow-lg hover:border-indigo-600"
        title="Open Share Link Generator"
      >
        <Share2 className="w-4 h-4" />
        <span>Share Predictions Link</span>
      </button>
    );
  };

  const activeQuestions = useMemo(() => {
    return questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !isQuestionTimedOut(q));
  }, [questions]);

  const submissions = useMemo(() => {
    if (activeQuestions.length === 0) return [];

    const questionIds = activeQuestions.map(q => q.id);
    const relevantAnswers = answers.filter(a => questionIds.includes(a.questionId));
    
    // Group by participant
    const byParticipant: Record<string, {
      participantId: string;
      answers: Answer[];
      latestTimestamp: Date;
    }> = {};

    relevantAnswers.forEach(ans => {
      if (!byParticipant[ans.participantId]) {
        byParticipant[ans.participantId] = {
          participantId: ans.participantId,
          answers: [],
          latestTimestamp: new Date(ans.timestamp)
        };
      }
      byParticipant[ans.participantId].answers.push(ans);
      const ansDate = new Date(ans.timestamp);
      if (ansDate > byParticipant[ans.participantId].latestTimestamp) {
        byParticipant[ans.participantId].latestTimestamp = ansDate;
      }
    });

    const result = Object.values(byParticipant).map(sub => {
      const p = participants.find(part => part.id === sub.participantId);
      return {
        participant: p,
        ...sub
      };
    }).filter(sub => sub.participant);

    // Sort by timestamp (oldest first - first come first serve)
    result.sort((a, b) => a.latestTimestamp.getTime() - b.latestTimestamp.getTime());

    return result;
  }, [activeQuestions, answers, participants]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Active Questions</h2>
          <p className="text-slate-500 mt-1">Monitor real-time participant responses</p>
        </div>
        {activeQuestions.length > 0 && (
          <ShareLinkButton isActive={true} />
        )}
      </div>

      {activeQuestions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Active Questions Found</h3>
          <p className="text-slate-500">There are no currently active questions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeQuestions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Q{qIndex + 1}</span>
                    {q.endTime && <CountdownTimer endTime={q.endTime} date={q.date} />}
                  </div>
                  {q.title && (
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded mb-1.5 inline-block">
                      {q.title}
                    </div>
                  )}
                  <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-3">{q.text}</h4>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4">
                    <span className="uppercase tracking-wider">{q.type} • {q.points} pts</span>
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" />
                      {answers.filter(a => a.questionId === q.id).length} / {participants.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setSelectedQuestionIdForShare(q.id);
                        setShareModalType('question');
                        setIsShareModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                      title="Share this specific question"
                    >
                      <Share2 className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => startEditing(q)}
                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-indigo-100/50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Question
                    </button>
                    <button 
                      onClick={() => setQuestionToDelete(q)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center mt-6">
              <Activity className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Submissions Yet</h3>
              <p className="text-slate-500">Wait for participants to submit their answers.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-6 flex flex-wrap items-center gap-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Live Submissions Ranking
                </h3>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-200 px-2.5 py-1 rounded-full ml-auto">
                  <Users className="w-4 h-4" />
                  {submissions.length} / {participants.length} Answered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-6 font-semibold w-20 text-center">Rank</th>
                      <th className="py-3 px-6 font-semibold">Participant</th>
                      <th className="py-3 px-6 font-semibold">Answers</th>
                      <th className="py-3 px-6 font-semibold text-right">Submission Time</th>
                      <th className="py-3 px-6 font-semibold text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub, index) => (
                      <tr key={sub.participantId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6 text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto shadow-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {sub.participant!.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{sub.participant!.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {sub.participant!.uniqueId || '---'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex flex-wrap gap-1.5 max-w-xs sm:max-w-md lg:max-w-lg">
                            {activeQuestions.map((q, idx) => {
                              const ans = sub.answers.find(a => a.questionId === q.id);
                              if (!ans) return null;
                              
                              let displayVal = '';
                              if (q.type === 'multiple_choice' || q.isMultipleChoice) {
                                const parts = ans.answer.split(' | ');
                                const formattedParts = parts.map(part => {
                                  const optionIdx = q.options?.indexOf(part) ?? -1;
                                  return optionIdx >= 0 ? `${optionIdx + 1}. ${part}` : part;
                                });
                                displayVal = formattedParts.join(', ');
                              } else {
                                const optIndex = q.options?.findIndex(opt => opt === ans.answer) ?? -1;
                                displayVal = optIndex >= 0 ? `${String.fromCharCode(65 + optIndex)}. ${ans.answer}` : ans.answer;
                              }
                              
                              return (
                                <div 
                                  key={q.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100/80 max-w-full"
                                  title={`Question: ${q.text}`}
                                >
                                  {activeQuestions.length > 1 && (
                                    <span className="text-[9px] text-indigo-500 bg-indigo-100/60 px-1 py-0.5 rounded font-mono shrink-0">
                                      Q{idx + 1}
                                    </span>
                                  )}
                                  <span className="truncate max-w-[180px] sm:max-w-[240px]" title={displayVal}>
                                    {displayVal}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="text-sm font-medium text-slate-600">
                            {sub.latestTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => setSubmissionToDelete({ participantId: sub.participantId, answers: sub.answers })}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Response"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-xl font-bold text-slate-800">Edit Question</h3>
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day {getDayNumber(editDate)}
                </div>
              </div>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-3 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Question Category</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {['daily', 'bonus', 'bumper'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setEditType(cat as any);
                          setEditPoints(cat === 'daily' ? 1 : cat === 'bonus' ? 3 : 5);
                        }}
                        className={`py-2 px-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all capitalize ${
                          editType === cat
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Question Title (Optional)</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm mb-1 bg-white font-semibold"
                    placeholder="E.g., Match 1 Stadium, Group B prediction, etc."
                  />
                </div>

                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Question Text</label>
                  <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-16 sm:h-20 mb-1 text-sm"
                    placeholder="E.g., Which stadium will host the opening match?"
                  />
                </div>

                <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-4 mb-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsMultipleChoice}
                      onChange={(e) => {
                        setEditIsMultipleChoice(e.target.checked);
                        if (e.target.checked) {
                          setEditIsManualInput(false);
                          if (editOptions.length === 0) {
                            setEditOptions(['', '', '']);
                          }
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Multiple Choice</span>
                      <span className="block text-xs text-slate-500">Allow multiple selections</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsManualInput}
                      onChange={(e) => {
                        setEditIsManualInput(e.target.checked);
                        if (e.target.checked) {
                          setEditIsMultipleChoice(false);
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Manual Input</span>
                      <span className="block text-xs text-slate-500">Freeform text entry</span>
                    </div>
                  </label>
                </div>

                {editIsMultipleChoice && (
                  <div className="col-span-2 md:col-span-4 space-y-4 border-l-4 border-indigo-500 pl-4 py-1 animate-in slide-in-from-left-2 duration-200">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Max Selections</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editMaxSelections}
                        onChange={(e) => setEditMaxSelections(parseInt(e.target.value) || 1)}
                        className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700">Bulk Options (one per line)</label>
                      <textarea
                        value={editOptions.join('\n')}
                        onChange={(e) => setEditOptions(e.target.value.split('\n'))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y min-h-[100px] text-sm font-sans"
                        placeholder="Option 1&#10;Option 2&#10;Option 3..."
                      />
                    </div>
                    {editOptions.filter(o => o.trim()).length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700">
                          Parsed Options Preview ({editOptions.filter(o => o.trim()).length})
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                          {editOptions.filter(o => o.trim()).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                              </span>
                              <span className="truncate" title={opt}>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {editIsManualInput && (
                  <div className="col-span-2 md:col-span-4 space-y-4 border-l-4 border-indigo-500 pl-4 py-1 animate-in slide-in-from-left-2 duration-200">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Boxes Count</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editManualInputCount}
                        onChange={(e) => setEditManualInputCount(parseInt(e.target.value) || 1)}
                        className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {!editIsMultipleChoice && !editIsManualInput && (
                  <div className="col-span-2 md:col-span-4 space-y-2.5">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700">Answer Options</label>
                    {editOptions.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2 animate-in fade-in duration-150">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...editOptions];
                            newOptions[index] = e.target.value;
                            setEditOptions(newOptions);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => setEditOptions(editOptions.filter((_, i) => i !== index))}
                          disabled={editOptions.length <= 2}
                          className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditOptions([...editOptions, ''])}
                      className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>
                )}

                <div className="col-span-2 md:col-span-4 grid grid-cols-3 gap-3 pt-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Points</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editIsMultipleChoice ? editMaxSelections : editPoints}
                      onChange={(e) => setEditPoints(Number(e.target.value))}
                      disabled={editIsMultipleChoice}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
                    <input 
                      type="datetime-local" 
                      step="1"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {!editIsManualInput && editOptions.filter(o => o.trim()).length > 0 && (
                  <div className="col-span-2 md:col-span-4 pt-2">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Correct Answer (Optional)</label>
                    <select
                      value={editCorrectAnswer}
                      onChange={(e) => setEditCorrectAnswer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-sm"
                    >
                      <option value="">Select correct answer...</option>
                      {editOptions.filter(o => o.trim()).map((opt, i) => (
                        <option key={i} value={opt}>Option {String.fromCharCode(65 + i)} - {opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal */}
      {submissionToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Delete Submission?</h3>
              <p className="text-slate-500 text-center mb-6 text-sm">
                Are you sure you want to delete this response? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSubmissionToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteParticipantAnswers(submissionToDelete.answers.map(a => a.id));
                    setSubmissionToDelete(null);
                    toast.success('Submission deleted successfully!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Delete Question?</h3>
              <p className="text-slate-500 text-center mb-6 text-sm">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{questionToDelete.text}"</span>? This will permanently delete the question and all associated participant answers.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setQuestionToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteQuestion(questionToDelete.id);
                    setQuestionToDelete(null);
                    toast.success('Question deleted successfully!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareLinkModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        defaultType={shareModalType}
        questionId={selectedQuestionIdForShare}
        questions={questions}
      />
    </div>
  );
}
