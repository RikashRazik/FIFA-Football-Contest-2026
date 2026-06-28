import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Share2, Calendar, Trophy, Zap, MessageSquare, Mail, ExternalLink, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'active' | 'date' | 'leaderboard' | 'question';
  date?: string;
  questionId?: string;
  questions?: import('../types').Question[];
}

export function ShareLinkModal({ 
  isOpen, 
  onClose, 
  defaultType = 'active', 
  date: initialDate, 
  questionId, 
  questions 
}: ShareLinkModalProps) {
  const [shareType, setShareType] = useState<'active' | 'date' | 'leaderboard' | 'question'>(defaultType);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(questionId || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  // Sync state if defaultType changes
  useEffect(() => {
    if (isOpen) {
      setShareType(defaultType);
      if (initialDate) {
        setSelectedDate(initialDate);
      }
      if (questionId) {
        setSelectedQuestionId(questionId);
      } else if (questions && questions.length > 0) {
        setSelectedQuestionId(questions[0].id);
      }
    }
  }, [isOpen, defaultType, initialDate, questionId, questions]);

  if (!isOpen) return null;

  // Generate perfect, clean URL
  const getCleanUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    if (shareType === 'active') {
      return `${origin}${pathname}?active=true`;
    } else if (shareType === 'leaderboard') {
      return `${origin}${pathname}?view=leaderboard`;
    } else if (shareType === 'question') {
      return `${origin}${pathname}?questionId=${selectedQuestionId}`;
    } else {
      return `${origin}${pathname}?date=${selectedDate}`;
    }
  };

  const shareUrl = getCleanUrl();

  // QR Code URL (using reliable, free, and secure QR Code generator API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&margin=10&color=31-38-112`;

  // Find active selected question text
  const activeQuestion = questions?.find(q => q.id === selectedQuestionId);
  const qText = activeQuestion ? activeQuestion.text : 'FIFA Prediction Question';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Professional invite templates
  const getWhatsAppMessage = () => {
    if (shareType === 'active') {
      return `⚽ *SFWC 2026 Prediction League* ⚽\n\nNew active prediction questions are live! Tap the link below to enter your answers and secure your points:\n\n👉 ${shareUrl}\n\nGood luck! 🏆`;
    } else if (shareType === 'leaderboard') {
      return `🏆 *SFWC 2026 Leaderboard* 🏆\n\nThe rankings have been updated! Check out the official standings and see where you rank:\n\n👉 ${shareUrl}\n\nKeep predicting! ⚽`;
    } else if (shareType === 'question') {
      return `⚽ *SFWC 2026 Prediction Challenger* ⚽\n\nCan you predict this? Check out this featured prediction question and submit your answer:\n\n💬 *"${qText}"*\n\n👉 ${shareUrl}\n\nShow your football wisdom! 🏆`;
    } else {
      const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      return `📅 *SFWC 2026 Predictions (${formattedDate})* 📅\n\nPredictions for ${formattedDate} are available now. Make sure to submit your inputs before kickoff:\n\n👉 ${shareUrl}\n\nLet's go! 🌟`;
    }
  };

  const getSlackMessage = () => {
    if (shareType === 'active') {
      return `⚽ *SFWC 2026 Prediction League* ⚽\nNew active prediction questions are live! Tap the link to enter your answers and secure your points:\n👉 ${shareUrl}\nGood luck! 🏆`;
    } else if (shareType === 'leaderboard') {
      return `🏆 *SFWC 2026 Leaderboard* 🏆\nThe rankings have been updated! Check out the official standings and see where you rank:\n👉 ${shareUrl}`;
    } else if (shareType === 'question') {
      return `⚽ *SFWC 2026 Prediction Challenger* ⚽\nFeatured question: *"${qText}"*\nSubmit your answer here: 👉 ${shareUrl}`;
    } else {
      const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      return `📅 *SFWC 2026 Predictions (${formattedDate})* 📅\nPredictions for ${formattedDate} are available. Submit your inputs before kickoff:\n👉 ${shareUrl}`;
    }
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopiedWhatsApp(true);
    toast.success('WhatsApp template copied!');
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const handleCopySlack = () => {
    navigator.clipboard.writeText(getSlackMessage());
    setCopiedSlack(true);
    toast.success('Slack template copied!');
    setTimeout(() => setCopiedSlack(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Refined Share Link Generator</h3>
              <p className="text-xs text-slate-500 font-medium">Create clean, trustworthy prediction links for your players</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Share Target Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1. Choose what to share
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Active Questions */}
              <button
                type="button"
                onClick={() => setShareType('active')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 ${
                  shareType === 'active'
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm ring-1 ring-indigo-500/25'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className={`w-4 h-4 ${shareType === 'active' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">Active Qs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Shows only live, non-expired prediction questions right now.
                  </p>
                </div>
              </button>

              {/* Specific Question */}
              <button
                type="button"
                onClick={() => setShareType('question')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 ${
                  shareType === 'question'
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm ring-1 ring-indigo-500/25'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <HelpCircle className={`w-4 h-4 ${shareType === 'question' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">One Question</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Focus on a single prediction card for target engagement.
                  </p>
                </div>
              </button>

              {/* Specific Day */}
              <button
                type="button"
                onClick={() => setShareType('date')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 ${
                  shareType === 'date'
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm ring-1 ring-indigo-500/25'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className={`w-4 h-4 ${shareType === 'date' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">Match Day</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Lock to a chosen match day's full set of predictions.
                  </p>
                </div>
              </button>

              {/* Leaderboard */}
              <button
                type="button"
                onClick={() => setShareType('leaderboard')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 ${
                  shareType === 'leaderboard'
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm ring-1 ring-indigo-500/25'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className={`w-4 h-4 ${shareType === 'leaderboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">Leaderboard</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Let players track standings, point margins, and history.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Question Selector (only if 'question' type is selected) */}
          {shareType === 'question' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select Featured Prediction Question
              </label>
              {questions && questions.length > 0 ? (
                <select
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800"
                >
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.type.toUpperCase()}] {q.text.length > 80 ? `${q.text.slice(0, 80)}...` : q.text} ({q.date})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-500">No questions available to share. Create some questions first!</p>
              )}
            </div>
          )}

          {/* Date Picker (only if 'date' type is selected) */}
          {shareType === 'date' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select Prediction Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800"
              />
            </div>
          )}

          {/* Link Preview & QR code Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
            
            {/* Link Preview and Invite Actions */}
            <div className="md:col-span-3 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Generated Link Preview
                </label>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 group">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent border-none text-slate-700 font-mono text-xs select-all outline-none pl-2 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-semibold pl-2">
                  <span>🔒 Safe HTTPS Domain</span>
                  <span>•</span>
                  <span>No redirects or intermediate tracker ads</span>
                </div>
              </div>

              {/* Social Template Share Box */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  3. Share Pre-formatted templates
                </label>
                
                {/* WhatsApp */}
                <button
                  onClick={handleCopyWhatsApp}
                  className="w-full flex items-center justify-between p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 text-emerald-900 rounded-xl transition-all group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">Copy WhatsApp Message</span>
                      <span className="block text-xs text-emerald-600/90 font-medium">Clean, emojis, and game description formatting</span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </div>
                </button>

                {/* Slack/Discord */}
                <button
                  onClick={handleCopySlack}
                  className="w-full flex items-center justify-between p-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-indigo-950 rounded-xl transition-all group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">Copy Slack / Discord Text</span>
                      <span className="block text-xs text-indigo-600 font-medium">Structured notification ideal for workspace groups</span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    {copiedSlack ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </div>
                </button>
              </div>
            </div>

            {/* QR Code Segment */}
            <div className="md:col-span-2 flex flex-col items-center justify-center border border-slate-100 rounded-2xl bg-slate-50/50 p-5 text-center shadow-inner relative group">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <a 
                  href={shareUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 inline-block"
                  title="Test Link in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-200/60 mb-3 hover:scale-105 transition-transform duration-300">
                <img 
                  src={qrCodeUrl} 
                  alt="Prediction Game QR Code" 
                  className="w-36 h-36 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Print or Scan QR Code
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-[180px]">
                Perfect for projecting on office screens, stadiums, or prints.
              </p>
              <button
                onClick={() => {
                  window.open(qrCodeUrl, '_blank');
                }}
                className="mt-3.5 px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 text-[10px] font-bold rounded-lg shadow-sm transition-all"
              >
                Open Fullscreen QR
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Secure SSL Endpoint</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
