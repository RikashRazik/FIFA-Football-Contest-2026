import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Question, QuestionType, Participant, Answer } from '../types';
import { Plus, CheckCircle2, Trash2, Calendar, AlertCircle, ChevronDown, ChevronUp, Edit2, Save, X, Link as LinkIcon, Users, Share2, RotateCcw } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { getDynamicQuestionStatus } from '../utils';
import { ShareLinkModal } from '../components/ShareLinkModal';

interface QuestionsPortalProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => void;
  deleteQuestion: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  onNavigateToEvaluate?: () => void;
}

export function QuestionsPortal({ questions, participants, answers, addQuestion, updateQuestion, deleteQuestion, isAddModalOpen, setIsAddModalOpen, onNavigateToEvaluate }: QuestionsPortalProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<QuestionType>('daily');
  const [points, setPoints] = useState(1);
  const [shareModalConfig, setShareModalConfig] = useState<{ isOpen: boolean; defaultType: 'active' | 'date' | 'leaderboard' | 'question'; date?: string; questionId?: string }>({
    isOpen: false,
    defaultType: 'active'
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualInputCount, setManualInputCount] = useState(1);
  const [manualInputPlaceholders, setManualInputPlaceholders] = useState<string[]>(['']);
  const [maxSelections, setMaxSelections] = useState(2);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [columns, setColumns] = useState(2);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isAddMultiple, setIsAddMultiple] = useState(false);
  const [tempQuestions, setTempQuestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatEndTime = (endTimeString: string) => {
    if (!endTimeString) return '';
    try {
      const dateObj = new Date(endTimeString);
      if (isNaN(dateObj.getTime())) return endTimeString;
      
      const today = new Date().toISOString().split('T')[0];
      const isToday = endTimeString.startsWith(today);
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      return isToday ? `${timeStr} Today` : `${timeStr} on ${dateObj.toLocaleDateString()}`;
    } catch {
      return endTimeString;
    }
  };

  const getInitialQuestionStatus = (dateString: string): 'active' | 'past' | 'upcoming' => {
    const today = new Date().toISOString().split('T')[0];
    if (dateString > today) return 'upcoming';
    return 'active';
  };

  const formatQuestionText = (rawText: string) => {
    let formatted = rawText.trim();
    if (!formatted) return '';
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    // Add question mark if it doesn't end with punctuation
    if (!/[.?!]$/.test(formatted)) {
      formatted += '?';
    } else if (formatted.endsWith('.')) {
      // Often users type a dot instead of a question mark for questions
      formatted = formatted.slice(0, -1) + '?';
    }
    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && tempQuestions.length === 0) return;
    
    const qsToSave = [...tempQuestions];
    
    if (text.trim()) {
      const formattedText = formatQuestionText(text);
      const validOptions = options.filter(opt => opt.trim() !== '');
      
      const newQ: any = {
        text: formattedText, 
        title: title.trim() || '',
        type, 
        points: isMultipleChoice ? maxSelections : points, 
        date, 
        status: getInitialQuestionStatus(date),
        isManualInput,
        isMultipleChoice,
        columns: isMultipleChoice ? columns : 2
      };
      if (isManualInput) {
        newQ.manualInputCount = manualInputCount;
        if (manualInputPlaceholders.some(p => p.trim() !== '')) {
          newQ.manualInputPlaceholders = manualInputPlaceholders.map(p => p.trim());
        }
      }
      if (isMultipleChoice) {
        newQ.maxSelections = maxSelections;
      }
      if (!isManualInput && validOptions.length > 0) newQ.options = validOptions;
      if (startTime) newQ.startTime = startTime;
      if (endTime) newQ.endTime = endTime;
      
      qsToSave.push(newQ);
    }

    if (qsToSave.length > 1) {
      const groupId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
      qsToSave.forEach((q, i) => {
        q.groupId = groupId;
        q.createdAt = Date.now() + i;
        q.date = date;
        if (startTime) q.startTime = startTime;
        if (endTime) q.endTime = endTime;
        q.status = getInitialQuestionStatus(date);
      });
    } else if (qsToSave.length === 1) {
      qsToSave[0].createdAt = Date.now();
      qsToSave[0].date = date;
      if (startTime) qsToSave[0].startTime = startTime;
      if (endTime) qsToSave[0].endTime = endTime;
      qsToSave[0].status = getInitialQuestionStatus(date);
    }

    try {
      setIsSubmitting(true);
      await Promise.all(qsToSave.map(q => addQuestion(q)));
      
      setText('');
      setTitle('');
      setOptions(['', '', '']);
      setStartTime('');
      setEndTime('');
      setIsManualInput(false);
      setManualInputPlaceholders(['']);
      setIsMultipleChoice(false);
      setColumns(2);
      setType('daily');
      setPoints(1);
      setManualInputCount(1);
      setMaxSelections(2);
      setIsAddMultiple(false);
      setTempQuestions([]);
      setIsAddModalOpen(false);
      toast.success(qsToSave.length > 1 ? `Added ${qsToSave.length} questions` : 'Added question');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToList = () => {
    if (!text.trim()) return;
    
    const formattedText = formatQuestionText(text);
    const validOptions = options.filter(opt => opt.trim() !== '');
    
    const newQ: any = {
      text: formattedText, 
      title: title.trim() || '',
      type, 
      points: isMultipleChoice ? maxSelections : points, 
      date, 
      status: getInitialQuestionStatus(date),
      isManualInput,
      isMultipleChoice,
      columns: isMultipleChoice ? columns : 2
    };
    if (isManualInput) {
      newQ.manualInputCount = manualInputCount;
      if (manualInputPlaceholders.some(p => p.trim() !== '')) {
        newQ.manualInputPlaceholders = manualInputPlaceholders.map(p => p.trim());
      }
    }
    if (isMultipleChoice) {
      newQ.maxSelections = maxSelections;
    }
    if (!isManualInput && validOptions.length > 0) newQ.options = validOptions;
    if (startTime) newQ.startTime = startTime;
    if (endTime) newQ.endTime = endTime;
    
    setTempQuestions([...tempQuestions, newQ]);
    
    setText('');
    setTitle('');
    setOptions(['', '', '']);
    setIsManualInput(false);
    setManualInputPlaceholders(['']);
    setIsMultipleChoice(false);
    setColumns(2);
    setManualInputCount(1);
    setMaxSelections(2);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOptionField = () => {
    setOptions([...options, '']);
  };

  const removeOptionField = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    setType(newType);
    setPoints(newType === 'daily' ? 1 : newType === 'bonus' ? 3 : 5);
  };

  const dailyQuestions = questions.filter(q => q.type === 'daily');
  const bonusQuestions = questions.filter(q => (q.type === 'bonus' || q.type === 'special' || q.type === 'multiple_choice') && getDynamicQuestionStatus(q) !== 'active');
  const bumperQuestions = questions.filter(q => q.type === 'bumper' && getDynamicQuestionStatus(q) !== 'active');

  const activeQuestions = dailyQuestions.filter(q => getDynamicQuestionStatus(q) === 'active');
  const pastQuestions = dailyQuestions.filter(q => getDynamicQuestionStatus(q) === 'past');
  const upcomingQuestions = dailyQuestions.filter(q => getDynamicQuestionStatus(q) === 'upcoming');

  const SectionAccordion: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultExpanded?: boolean; count: number }> = ({ title, children, defaultExpanded = false, count }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div 
          className="bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 m-0">
            {title} ({count})
          </h3>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-slate-200 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  };

  const getDayNumber = (dateString: string) => {
    const start = new Date('2026-06-11T00:00:00Z');
    const target = new Date(dateString + 'T00:00:00Z');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const QuestionCard: React.FC<{ q: Question }> = ({ q }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(q.text);
    const [editTitle, setEditTitle] = useState(q.title || '');
    const [editOptions, setEditOptions] = useState<string[]>(q.options || []);
    const [editEndTime, setEditEndTime] = useState(q.endTime || '');
    const [editStartTime, setEditStartTime] = useState(q.startTime || '');
    const [editCorrectAnswer, setEditCorrectAnswer] = useState(q.correctAnswer || '');
    const [editManualInputCount, setEditManualInputCount] = useState(q.manualInputCount || 1);
    const [editManualInputPlaceholders, setEditManualInputPlaceholders] = useState<string[]>(q.manualInputPlaceholders || Array(q.manualInputCount || 1).fill(''));
    const [editMaxSelections, setEditMaxSelections] = useState(q.maxSelections || 2);
    const [editType, setEditType] = useState<QuestionType>(q.type);

    const handleSave = () => {
      const formattedText = formatQuestionText(editText);
      const validOptions = editOptions.filter(opt => opt.trim() !== '');
      
      const updatedFields: any = {
        text: formattedText,
        title: editTitle.trim(),
        type: editType
      };
      
      if (!q.isManualInput && validOptions.length > 0) {
        updatedFields.options = validOptions;
      }

      if (q.isManualInput) {
        updatedFields.manualInputCount = editManualInputCount;
        if (editManualInputPlaceholders.some(p => p.trim() !== '')) {
          updatedFields.manualInputPlaceholders = editManualInputPlaceholders.map(p => p.trim());
        } else {
          updatedFields.manualInputPlaceholders = []; // clear if empty
        }
      }
      
      if (q.type === 'multiple_choice' || q.isMultipleChoice) {
        updatedFields.maxSelections = editMaxSelections;
        updatedFields.points = editMaxSelections;
      }
      
      if (editEndTime) {
        updatedFields.endTime = editEndTime;
      } else {
        updatedFields.endTime = '';
      }

      if (editStartTime) {
        updatedFields.startTime = editStartTime;
      } else {
        updatedFields.startTime = '';
      }

      if (editCorrectAnswer) {
        updatedFields.correctAnswer = editCorrectAnswer;
      } else {
        updatedFields.correctAnswer = '';
      }
      
      updateQuestion(q.id, updatedFields);
      setIsEditing(false);
    };

    const handleEditOptionChange = (index: number, value: string) => {
      const newOptions = [...editOptions];
      newOptions[index] = value;
      setEditOptions(newOptions);
    };

    const addEditOption = () => {
      setEditOptions([...editOptions, '']);
    };

    const removeEditOption = (index: number) => {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    };

    if (isEditing) {
      return (
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-200 flex flex-col gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Question Title</label>
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-semibold mb-2 bg-white"
                placeholder="E.g., Match 1 Stadium (Optional)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Question Text</label>
              <textarea 
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-24 bg-white"
                placeholder="Edit question..."
              />
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-32 sm:shrink-0">Start Date & Time:</label>
                <input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-full max-w-xs text-sm bg-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-32 sm:shrink-0">End Date & Time:</label>
                <input
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-full max-w-xs text-sm bg-white"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-32 sm:shrink-0">Question Type:</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as QuestionType)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-full max-w-xs text-sm bg-white"
              >
                <option value="daily">Daily</option>
                <option value="bonus">Bonus</option>
                <option value="bumper">Bumper</option>
                <option value="special">Special</option>
                <option value="multiple_choice">Multiple Choice</option>
              </select>
            </div>

            {q.isManualInput && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-32 sm:shrink-0">Boxes Count:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editManualInputCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setEditManualInputCount(val);
                      setEditManualInputPlaceholders(prev => {
                        const arr = [...prev];
                        while(arr.length < val) arr.push('');
                        return arr.slice(0, val);
                      });
                    }}
                    className="w-full max-w-[120px] px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700">Custom Box Text (Optional Placeholder)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: editManualInputCount }).map((_, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Placeholder for Box ${idx + 1}`}
                        value={editManualInputPlaceholders[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditManualInputPlaceholders(prev => {
                            const newArr = [...prev];
                            newArr[idx] = val;
                            return newArr;
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(q.type === 'multiple_choice' || q.isMultipleChoice) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-32 sm:shrink-0">Max Selections:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editMaxSelections}
                  onChange={(e) => setEditMaxSelections(parseInt(e.target.value) || 1)}
                  className="w-full max-w-[120px] px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
                />
              </div>
            )}
            
            {!q.isManualInput && q.type !== 'multiple_choice' && !q.isMultipleChoice && (
              <div className="space-y-3">
                {editOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => handleEditOptionChange(i, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder={`Option ${i + 1}`}
                    />
                    <button 
                      onClick={() => removeEditOption(i)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addEditOption}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
            )}

            {(q.type === 'multiple_choice' || q.isMultipleChoice) && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Bulk Options (one per line)</label>
                  <textarea
                    value={editOptions.join('\n')}
                    onChange={(e) => setEditOptions(e.target.value.split('\n'))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y min-h-[120px] text-sm"
                    placeholder="Option A&#10;Option B&#10;Option C..."
                  />
                </div>
                {editOptions.filter(o => o.trim()).length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Parsed Options Preview ({editOptions.filter(o => o.trim()).length})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
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

            {getDynamicQuestionStatus(q) === 'past' && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-indigo-100">
                <label className="text-sm font-medium text-slate-700">Correct Answer:</label>
                {editOptions.length > 0 && q.type !== 'multiple_choice' ? (
                  <select
                    value={editCorrectAnswer}
                    onChange={(e) => setEditCorrectAnswer(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Select correct answer...</option>
                    {editOptions.map((opt, i) => (
                      <option key={i} value={opt}>Option {String.fromCharCode(65 + i)} - {opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editCorrectAnswer}
                    onChange={(e) => setEditCorrectAnswer(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="Enter correct answer..."
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 group relative hover:border-slate-300 transition-colors"
      >
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              q.type === 'daily' ? 'bg-blue-100 text-blue-700' :
              q.type === 'bonus' ? 'bg-purple-100 text-purple-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {q.type}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              getDynamicQuestionStatus(q) === 'active' ? 'bg-emerald-100 text-emerald-700' :
              getDynamicQuestionStatus(q) === 'past' ? 'bg-slate-100 text-slate-600' :
              'bg-amber-100 text-amber-700'
            }`}>
              {getDynamicQuestionStatus(q) === 'active' ? 'Active' : getDynamicQuestionStatus(q) === 'past' ? 'Closed' : 'Pending'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {q.date} (Day {getDayNumber(q.date)})
            </span>
            {q.startTime && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="font-extrabold uppercase text-[8px] tracking-wider text-emerald-500">Start:</span> {formatEndTime(q.startTime)}
              </span>
            )}
            {q.endTime && (
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="font-extrabold uppercase text-[8px] tracking-wider text-rose-500">End:</span> {formatEndTime(q.endTime)}
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-700 ml-1">{q.points} pts</span>
          </div>
          {q.title && (
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block">
              {q.title}
            </div>
          )}
          <p className="text-slate-800 font-medium text-sm md:text-base leading-snug">{q.text}</p>
          {q.options && q.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {q.options.map((opt, i) => (
                <div key={i} className={`bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-700 flex items-center gap-2 ${
                  q.correctAnswer === opt ? 'border-emerald-300 ring-1 ring-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-100'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    q.correctAnswer === opt ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {(q.type === 'multiple_choice' || q.isMultipleChoice) ? i + 1 : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 truncate">{opt}</span>
                  {q.correctAnswer === opt && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>
          )}
          {q.correctAnswer && (!q.options || !q.options.includes(q.correctAnswer)) && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-800 flex items-center gap-2">
              <span className="font-bold shrink-0">Correct:</span> <span className="flex-1 truncate">{q.correctAnswer}</span>
              <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />
            </div>
          )}
          {q.isEvaluated && q.correctAnswer && (
            <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2">
              {participants.map(p => {
                const answer = answers.find(a => a.participantId === p.id && a.questionId === q.id);
                if (!answer) return null;
                const isCorrect = answer.answer === q.correctAnswer;
                return (
                  <div key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex items-center gap-1 ${
                    isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className="truncate max-w-[60px]">{p.name}</span>
                    <span className="font-bold">{isCorrect ? `+${q.points}` : '0'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100">
          {getDynamicQuestionStatus(q) === 'past' && (
            <button 
              onClick={() => {
                updateQuestion(q.id, { isEvaluated: false, status: 'active', correctAnswer: '' });
                toast.success('Question moved to Evaluate tab');
                if (onNavigateToEvaluate) onNavigateToEvaluate();
              }}
              className="p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors"
              title="Move to Evaluate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={() => setShareModalConfig({
              isOpen: true,
              defaultType: 'question',
              questionId: q.id
            })}
            className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
            title="Share this specific question"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setQuestionToDelete(q)}
            className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  const ShareLinkButton: React.FC<{ date?: string, isActive?: boolean }> = ({ date, isActive }) => {
    return (
      <button 
        onClick={() => setShareModalConfig({
          isOpen: true,
          defaultType: isActive ? 'active' : 'date',
          date: date
        })}
        title="Share Predictions Link"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-colors"
      >
        <Share2 className="w-4 h-4" />
      </button>
    );
  };

  const DayAccordion: React.FC<{ date: string; questions: Question[] }> = ({ date, questions }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Calculate points per user for this specific day
    const userPoints = participants.map(p => {
      let points = 0;
      let hasAnswers = false;
      questions.forEach(q => {
        const answer = answers.find(a => a.participantId === p.id && a.questionId === q.id);
        if (answer) {
          hasAnswers = true;
          if (q.isEvaluated && q.correctAnswer && answer.answer === q.correctAnswer) {
            points += q.points;
          }
        }
      });
      return { ...p, currentDayPoints: points, hasAnswers };
    }).filter(p => p.hasAnswers).sort((a, b) => b.currentDayPoints - a.currentDayPoints);

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white opacity-80 hover:opacity-100 transition-all shadow-sm">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-slate-800 text-lg uppercase tracking-wider">Day {getDayNumber(date)}</span>
            <span className="text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded ml-2 font-medium text-sm">
              {date}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <ShareLinkButton date={date} />
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="mb-6 space-y-3">
              {questions.map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
            
            {userPoints.length > 0 && (
              <div className="border-t border-slate-200 pt-4 mt-2">
                <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-indigo-500" /> Day {getDayNumber(date)} Scores
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {userPoints.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      <span className="font-medium text-slate-800 text-sm">{p.name}</span>
                      <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 rounded">{p.currentDayPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Questions Portal</h2>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-3.5 sm:p-6 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="hidden xs:flex w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center text-indigo-600 shrink-0">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800">Add New Question</h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Day {getDayNumber(date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddMultiple(!isAddMultiple)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all shadow-sm ${
                    isAddMultiple 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="xs:inline hidden">Batch Mode</span>
                  <span className="xs:hidden inline">Batch</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAddMultiple ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Question Text</label>
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-24 text-sm shadow-sm"
                      placeholder="E.g., Which stadium will host the opening match?"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm"
                        placeholder="E.g., Match 1 Stadium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">Category</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['daily', 'bonus', 'bumper'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setType(cat as any);
                              setPoints(cat === 'daily' ? 1 : cat === 'bonus' ? 3 : 5);
                            }}
                            className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg capitalize transition-all ${
                              type === cat
                                ? 'bg-white shadow-sm text-indigo-700'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                {/* Question Type Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">Answer Format:</span>
                    <div className="flex bg-slate-200 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setIsManualInput(false)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          !isManualInput
                            ? 'bg-white shadow-sm text-indigo-700 font-extrabold'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Multiple Choice
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsManualInput(true); setIsMultipleChoice(false); }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          isManualInput
                            ? 'bg-white shadow-sm text-indigo-700 font-extrabold'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Manual Input
                      </button>
                    </div>
                  </div>
                  
                  {!isManualInput && (
                    <label className="flex items-center gap-1.5 cursor-pointer group select-none bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm transition-colors self-start sm:self-auto">
                      <input 
                        type="checkbox" 
                        checked={isMultipleChoice} 
                        onChange={(e) => setIsMultipleChoice(e.target.checked)} 
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                      />
                      <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors">Multi-select</span>
                    </label>
                  )}
                </div>

                {/* Dynamic Configuration based on Type */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
                  {!isManualInput ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-800">Answer Options</label>
                        <span className="text-xs font-medium text-slate-500">{options.length} options</span>
                      </div>
                      <div className="space-y-2.5">
                        {options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                              {String.fromCharCode(65 + i)}
                            </div>
                            <input 
                              type="text" 
                              value={opt} 
                              onChange={(e) => handleOptionChange(i, e.target.value)} 
                              placeholder={`Option ${String.fromCharCode(65 + i)}`} 
                              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 px-1 outline-none font-medium text-slate-700" 
                            />
                            <button 
                              type="button"
                              onClick={() => removeOptionField(i)} 
                              disabled={options.length <= 2}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button"
                        onClick={addOptionField} 
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors w-full justify-center border border-dashed border-indigo-200"
                      >
                        <Plus className="w-4 h-4" /> Add Another Option
                      </button>

                      {isMultipleChoice && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 mt-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Selections Allowed</label>
                            <input
                              type="number"
                              min="1"
                              max={options.length}
                              value={maxSelections}
                              onChange={(e) => setMaxSelections(parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Grid Columns</label>
                            <select
                              value={columns}
                              onChange={(e) => setColumns(parseInt(e.target.value) || 2)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-sm shadow-sm"
                            >
                              <option value={1}>1 Column</option>
                              <option value={2}>2 Columns</option>
                              <option value={3}>3 Columns</option>
                              <option value={4}>4 Columns</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Number of Input Fields</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={manualInputCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setManualInputCount(val);
                            setManualInputPlaceholders(prev => {
                              const newArr = [...prev];
                              while(newArr.length < val) newArr.push('');
                              return newArr.slice(0, val);
                            });
                          }}
                          className="w-full max-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm bg-white"
                        />
                      </div>
                      {manualInputCount > 0 && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-sm font-semibold text-slate-800 mb-1.5">Custom Box Placeholders (Optional)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Array.from({ length: manualInputCount }).map((_, idx) => (
                              <input
                                key={idx}
                                type="text"
                                placeholder={`Placeholder for Box ${idx + 1}`}
                                value={manualInputPlaceholders[idx] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setManualInputPlaceholders(prev => {
                                    const newArr = [...prev];
                                    newArr[idx] = val;
                                    return newArr;
                                  });
                                }}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Points</label>
                    <input 
                      type="number" 
                      min="1"
                      value={isMultipleChoice ? maxSelections : points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      disabled={isMultipleChoice}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {isMultipleChoice && <p className="text-[10px] text-slate-500 mt-1">1 pt per selection</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Start Date & Time</label>
                    <input 
                      type="datetime-local" 
                      step="1"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">End Date & Time</label>
                    <input 
                      type="datetime-local" 
                      step="1"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>
                
                {tempQuestions.length > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Batch Preview ({tempQuestions.length})</h4>
                    <div className="space-y-1.5">
                      {tempQuestions.map((q, idx) => (
                        <div key={idx} className="text-sm bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate font-medium text-slate-700">{q.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 justify-end">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white hover:border-slate-300 transition-all text-sm w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  {isAddMultiple && (
                    <button 
                      type="button"
                      onClick={handleAddToList}
                      disabled={!text.trim()}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Next
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : (isAddMultiple && tempQuestions.length > 0 ? `Save All (${text.trim() ? tempQuestions.length + 1 : tempQuestions.length})` : 'Save Question')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {upcomingQuestions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Questions ({upcomingQuestions.length})
            </h3>
            <div className="space-y-8">
              {Array.from(new Set(upcomingQuestions.map(q => q.date)))
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                .map(date => {
                  const dayQuestions = upcomingQuestions.filter(q => q.date === date);
                  return (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" /> 
                          Day {getDayNumber(date)}
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2 font-medium text-xs">
                            {date}
                          </span>
                        </h4>
                        <ShareLinkButton date={date} />
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {dayQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}



        <SectionAccordion 
          title={<><AlertCircle className="w-5 h-5 text-slate-500" /> Past Questions</>} 
          count={pastQuestions.length}
        >
          {pastQuestions.length === 0 ? (
            <p className="text-slate-500 italic">No past questions yet.</p>
          ) : (
            <div className="space-y-4">
              {Array.from(new Set(pastQuestions.map(q => q.date)))
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map(date => {
                  const dayQuestions = pastQuestions.filter(q => q.date === date);
                  return <DayAccordion key={date} date={date} questions={dayQuestions} />;
                })}
            </div>
          )}
        </SectionAccordion>

        <SectionAccordion 
          title={<><AlertCircle className="w-5 h-5 text-indigo-500" /> Bonus Questions</>} 
          count={bonusQuestions.length}
        >
          {bonusQuestions.length === 0 ? (
            <p className="text-slate-500 italic">No bonus questions yet.</p>
          ) : (
            <div className="space-y-3">
              {bonusQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          )}
        </SectionAccordion>

        <SectionAccordion 
          title={<><AlertCircle className="w-5 h-5 text-amber-500" /> Bumper Questions</>} 
          count={bumperQuestions.length}
        >
          {bumperQuestions.length === 0 ? (
            <p className="text-slate-500 italic">No bumper questions yet.</p>
          ) : (
            <div className="space-y-3">
              {bumperQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          )}
        </SectionAccordion>
      </div>

      <ConfirmModal 
        isOpen={!!questionToDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={() => {
          if (questionToDelete) {
            deleteQuestion(questionToDelete.id);
            setQuestionToDelete(null);
            toast.success('Question deleted successfully!');
          }
        }}
        onCancel={() => setQuestionToDelete(null)}
      />

      <ShareLinkModal 
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig({ ...shareModalConfig, isOpen: false })}
        defaultType={shareModalConfig.defaultType}
        date={shareModalConfig.date}
        questionId={shareModalConfig.questionId}
        questions={questions}
      />
    </div>
  );
}
