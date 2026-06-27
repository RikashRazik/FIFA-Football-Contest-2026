import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Question, QuestionType, Participant, Answer } from '../types';
import { Plus, CheckCircle2, Trash2, Calendar, AlertCircle, ChevronDown, ChevronUp, Edit2, Save, X, Link as LinkIcon, Users } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { getDynamicQuestionStatus } from '../utils';

interface QuestionsPortalProps {
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => void;
  deleteQuestion: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
}

export function QuestionsPortal({ questions, participants, answers, addQuestion, updateQuestion, deleteQuestion, isAddModalOpen, setIsAddModalOpen }: QuestionsPortalProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionType>('daily');
  const [points, setPoints] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const formattedText = formatQuestionText(text);
    const validOptions = options.filter(opt => opt.trim() !== '');
    
    const newQ: any = {
      text: formattedText, 
      type, 
      points, 
      date, 
      status: getInitialQuestionStatus(date)
    };
    if (validOptions.length > 0) newQ.options = validOptions;
    if (endTime) newQ.endTime = endTime;

    addQuestion(newQ);
    
    setText('');
    setOptions(['', '', '']);
    setEndTime('');
    setIsAddModalOpen(false);
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
  const bonusQuestions = questions.filter(q => q.type === 'bonus');
  const bumperQuestions = questions.filter(q => q.type === 'bumper');

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
    const [editOptions, setEditOptions] = useState<string[]>(q.options || []);
    const [editEndTime, setEditEndTime] = useState(q.endTime || '');
    const [editCorrectAnswer, setEditCorrectAnswer] = useState(q.correctAnswer || '');

    const handleSave = () => {
      const formattedText = formatQuestionText(editText);
      const validOptions = editOptions.filter(opt => opt.trim() !== '');
      
      const updatedFields: any = {
        text: formattedText
      };
      
      if (validOptions.length > 0) {
        updatedFields.options = validOptions;
      }
      
      if (editEndTime) {
        updatedFields.endTime = editEndTime;
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
            <textarea 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-24"
              placeholder="Edit question..."
            />
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 w-24 shrink-0">End Time:</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            
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

            {getDynamicQuestionStatus(q) === 'past' && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-indigo-100">
                <label className="text-sm font-medium text-slate-700">Correct Answer:</label>
                {editOptions.length > 0 ? (
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
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {q.date} (Day {getDayNumber(q.date)})
            </span>
            <span className="text-[11px] font-bold text-slate-700 ml-1">{q.points} pts</span>
          </div>
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
                    {String.fromCharCode(65 + i)}
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

  const ShareLinkButton: React.FC<{ date: string }> = ({ date }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('date', date);
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button 
        onClick={handleCopyLink}
        title={copied ? 'Copied' : 'Share Link'}
        className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors ${
          copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm'
        }`}
      >
        {copied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-xl font-bold text-slate-800">Add New Question</h3>
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day {getDayNumber(date)}
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-3 sm:p-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Question Text</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-16 sm:h-20 mb-2 sm:mb-3 text-sm"
                    placeholder="E.g., Which stadium will host the opening match?"
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700">Answer Options</label>
                    {options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => removeOptionField(index)}
                          disabled={options.length <= 2}
                          className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Option
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Type</label>
                  <select 
                    value={type}
                    onChange={handleTypeChange}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="bonus">Bonus</option>
                    <option value="bumper">Bumper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Points</label>
                  <input 
                    type="number" 
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">End Time</label>
                  <input 
                    type="time" 
                    step="1"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex justify-end gap-2 sm:gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-all text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 sm:px-5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg sm:rounded-xl transition-colors shadow-sm flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" /> Save Question
                </button>
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
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Calendar className="w-4 h-4 text-indigo-500" /> 
                        Day {getDayNumber(date)}
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2 font-medium text-xs">
                          {date}
                        </span>
                      </h4>
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Active Questions ({activeQuestions.length})
            </h3>
            {activeQuestions.length > 0 && (
              <ShareLinkButton date={activeQuestions[0].date} />
            )}
          </div>
          {activeQuestions.length === 0 ? (
            <p className="text-slate-500 italic">No active questions currently.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activeQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
              </AnimatePresence>
            </div>
          )}
        </div>

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
    </div>
  );
}
