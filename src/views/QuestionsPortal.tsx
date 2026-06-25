import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import { Plus, CheckCircle2, Trash2, Calendar, AlertCircle, ChevronDown, ChevronUp, Edit2, Save, X, Link as LinkIcon } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface QuestionsPortalProps {
  questions: Question[];
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, updatedFields: Partial<Omit<Question, 'id'>>) => void;
  deleteQuestion: (id: string) => void;
}

export function QuestionsPortal({ questions, addQuestion, updateQuestion, deleteQuestion }: QuestionsPortalProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionType>('daily');
  const [points, setPoints] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getQuestionStatus = (dateString: string): 'active' | 'past' | 'upcoming' => {
    const today = new Date().toISOString().split('T')[0];
    if (dateString < today) return 'past';
    if (dateString === today) return 'active';
    return 'upcoming';
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
    
    addQuestion({ 
      text: formattedText, 
      type, 
      points, 
      date, 
      status: getQuestionStatus(date), 
      options: validOptions.length > 0 ? validOptions : undefined,
      endTime: endTime || undefined
    });
    
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

  const activeQuestions = questions.filter(q => getQuestionStatus(q.date) === 'active');
  const pastQuestions = questions.filter(q => getQuestionStatus(q.date) === 'past');
  const upcomingQuestions = questions.filter(q => getQuestionStatus(q.date) === 'upcoming');

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

    const handleSave = () => {
      const formattedText = formatQuestionText(editText);
      const validOptions = editOptions.filter(opt => opt.trim() !== '');
      updateQuestion(q.id, { 
        text: formattedText, 
        options: validOptions.length > 0 ? validOptions : undefined 
      });
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
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 group">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
              q.type === 'daily' ? 'bg-blue-100 text-blue-700' :
              q.type === 'bonus' ? 'bg-purple-100 text-purple-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {q.type}
            </span>
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {q.date} (Day {getDayNumber(q.date)})
            </span>
            <span className="text-sm font-bold text-slate-700 ml-2">{q.points} pts</span>
            {q.endTime && q.status === 'active' && (
              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded ml-2 border border-amber-200">
                Ends at {q.endTime}
              </span>
            )}
          </div>
          <p className="text-slate-900 font-medium text-lg leading-snug">{q.text}</p>
          {q.options && q.options.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setQuestionToDelete(q)}
            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm'
        }`}
      >
        {copied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        {copied ? 'Copied' : 'Share Link'}
      </button>
    );
  };

  const DayAccordion: React.FC<{ date: string; questions: Question[] }> = ({ date, questions }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
            {questions.map(q => <QuestionCard key={q.id} q={q} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Questions Portal</h2>
          <p className="text-slate-500 mt-1">Manage daily, bonus, and bumper questions for the contest.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Question
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Add New Question</h3>
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day {getDayNumber(date)}
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Question Text</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-20 mb-3 text-sm"
                    placeholder="E.g., Which stadium will host the opening match?"
                  />
                  
                  <div className="space-y-2.5">
                    <label className="block text-sm font-medium text-slate-700">Answer Options</label>
                    {options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
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
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select 
                    value={type}
                    onChange={handleTypeChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="bonus">Bonus</option>
                    <option value="bumper">Bumper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Points</label>
                  <input 
                    type="number" 
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
                  <input 
                    type="time" 
                    step="1"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" /> Save Question
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
                        {dayQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
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
              {activeQuestions.map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 text-slate-400 border-t border-slate-200 pt-6">
            Past Questions ({pastQuestions.length})
          </h3>
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
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!questionToDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={() => {
          if (questionToDelete) {
            deleteQuestion(questionToDelete.id);
            setQuestionToDelete(null);
          }
        }}
        onCancel={() => setQuestionToDelete(null)}
      />
    </div>
  );
}
