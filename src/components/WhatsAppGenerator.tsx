import React, { useState } from 'react';
import { MessageSquare, Copy, Check, X } from 'lucide-react';
import { Question, Participant } from '../types';
import { toast } from 'react-hot-toast';

interface WhatsAppGeneratorProps {
  questions: Question[];
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppGenerator({ questions, participants, isOpen, onClose }: WhatsAppGeneratorProps) {
  const [template, setTemplate] = useState<'active_questions' | 'leaderboard'>('active_questions');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const getActiveQuestionsText = () => {
    const activeQuestions = questions.filter(q => q.status === 'active' || q.isActivatedNow);
    if (activeQuestions.length === 0) return 'No active questions right now.';

    let text = '📢 *FIFA 2026 Admin - Active Questions* 📢\n\n';
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    activeQuestions.forEach((q, i) => {
      text += `*Q${i + 1}.* ${q.text}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, j) => {
          text += `${String.fromCharCode(65 + j)}. ${opt}\n`;
        });
      }
      text += `💰 Points: ${q.points}\n`;
      if (q.endTime) {
        text += `⏰ Ends at: ${new Date(q.endTime).toLocaleString()}\n`;
      }
      text += '\n';
    });
    
    text += `👉 *Answer here:* ${origin}${pathname}?active=true\n`;
    
    return text;
  };

  const getLeaderboardText = () => {
    const participantsWithTotals = participants.map(p => ({
      ...p,
      total: p.dailyPoints + p.bonusPoints + p.bumperPoints
    })).sort((a, b) => b.total - a.total);

    const top10 = participantsWithTotals.slice(0, 10);

    let text = '🏆 *FIFA 2026 Admin - Leaderboard* 🏆\n\n';
    top10.forEach((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅';
      text += `${medal} ${i + 1}. ${p.name} - ${p.total} pts\n`;
    });

    const origin = window.location.origin;
    text += `\n👉 *View full leaderboard:* ${origin}/?view=leaderboard\n`;

    return text;
  };

  const generatedText = template === 'active_questions' ? getActiveQuestionsText() : getLeaderboardText();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> WhatsApp Announcement
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-white shadow-sm border border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1 overflow-hidden">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTemplate('active_questions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                template === 'active_questions' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 border' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Active Questions
            </button>
            <button
              onClick={() => setTemplate('leaderboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                template === 'leaderboard' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 border' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Top 10 Leaderboard
            </button>
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 relative min-h-[200px] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-slate-700">
            {generatedText}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            Close
          </button>
          <button onClick={handleCopy} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
