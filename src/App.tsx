import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Cloud, CloudOff, CheckCircle2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Leaderboard } from './views/Leaderboard';
import { QuestionsPortal } from './views/QuestionsPortal';
import { UserManager } from './views/UserManager';
import { ActiveQuestions } from './views/ActiveQuestions';
import { EvaluateAnswers } from './views/EvaluateAnswers';
import { PublicQuestionsView } from './views/PublicQuestionsView';
import { PublicLeaderboardView } from './views/PublicLeaderboardView';
import { LoginView } from './views/LoginView';
import { useAppStore } from './hooks/useAppStore';
import { isQuestionTimedOut, getDynamicQuestionStatus } from './utils';
import { ParticipantProfileModal } from './components/ParticipantProfileModal';
import { Participant } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('fifa_admin_auth') === 'true';
  });
  const store = useAppStore();

  const handleParticipantClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsProfileModalOpen(true);
  };

  const [publicDate, setPublicDate] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('date');
  });

  const [publicQuestionId, setPublicQuestionId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('questionId');
  });
  
  const [isPublicActive, setIsPublicActive] = useState(() => {
    return new URLSearchParams(window.location.search).get('active') === 'true';
  });
  
  const [isPublicLeaderboard, setIsPublicLeaderboard] = useState(() => {
    return new URLSearchParams(window.location.search).get('view') === 'leaderboard';
  });

  useEffect(() => {
    // Keep this empty or remove if nothing else is needed here, 
    // since we initialized synchronously above.
  }, []);

  const handleLogin = () => {
    localStorage.setItem('fifa_admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fifa_admin_auth');
    setIsAuthenticated(false);
  };

  if (isPublicLeaderboard) {
    return <PublicLeaderboardView participants={store.participants} />;
  }

  if (publicQuestionId) {
    if (store.isLoading) {
      return (
        <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading prediction details...</p>
          </div>
        </div>
      );
    }
    const question = store.questions.find(q => q.id === publicQuestionId);
    if (question) {
      return (
        <PublicQuestionsView 
          date={question.date} 
          questions={[question]} 
          participants={store.participants} 
          answers={store.answers} 
          addAnswer={store.addAnswer} 
          isActiveView={false} 
          isLoading={store.isLoading}
          highlightedQuestionId={publicQuestionId}
        />
      );
    } else {
      return (
        <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-4 text-center">SFWC 2026</h1>
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-blue-900/50 max-w-md w-full text-center shadow-xl">
            <p className="text-xl font-bold text-red-400 mb-2">Question Not Available</p>
            <p className="text-slate-400 text-sm">This specific prediction is no longer active, has expired, or was removed by the administrator.</p>
            <a href="/" className="mt-6 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              Back to Safety
            </a>
          </div>
        </div>
      );
    }
  }

  if (isPublicActive) {
    const activeQuestions = store.questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !isQuestionTimedOut(q));
    const todayDate = new Date().toISOString().split('T')[0];
    return <PublicQuestionsView date={todayDate} questions={activeQuestions} participants={store.participants} answers={store.answers} addAnswer={store.addAnswer} isActiveView={true} isLoading={store.isLoading} />;
  }

  if (publicDate) {
    const dayQuestions = store.questions.filter(q => q.date === publicDate);
    return <PublicQuestionsView date={publicDate} questions={dayQuestions} participants={store.participants} answers={store.answers} addAnswer={store.addAnswer} isActiveView={false} isLoading={store.isLoading} />;
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const evaluateCount = store.questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !q.isEvaluated && isQuestionTimedOut(q)).length;
  const activeCount = store.questions.filter(q => getDynamicQuestionStatus(q) === 'active' && !isQuestionTimedOut(q)).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} activeCount={activeCount} evaluateCount={evaluateCount} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-[72px] md:pb-0 relative">
        <header className="h-16 bg-[#0a1128] border-b border-slate-800/80 flex items-center justify-between px-4 md:px-8 flex-shrink-0 md:bg-white md:border-slate-200">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-10 h-10 object-contain md:hidden" referrerPolicy="no-referrer" />
            <h1 className="text-lg md:text-xl font-bold text-white md:text-slate-800 tracking-wider uppercase md:normal-case md:tracking-normal truncate pr-2">SFWC Admin</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${store.isSyncing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} md:bg-opacity-100 bg-opacity-20`}>
              {store.isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden md:inline">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Synced</span>
                </>
              )}
            </div>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-400 md:bg-indigo-50 md:text-indigo-700' : 'text-slate-400 hover:text-white hover:bg-slate-800 md:bg-slate-100 md:text-slate-700 md:hover:bg-slate-200'}`}
              title="User Management"
            >
              <Users className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-lg"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // smooth easeOut
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  participants={store.participants} 
                  questions={store.questions}
                  answers={store.answers}
                  onNavigate={setActiveTab} 
                />
              )}
              {activeTab === 'leaderboard' && (
                <Leaderboard 
                  participants={store.participants} 
                  updateScore={store.updateParticipantScore}
                  onParticipantClick={handleParticipantClick}
                />
              )}
              {activeTab === 'questions' && (
                <QuestionsPortal 
                  questions={store.questions}
                  participants={store.participants}
                  answers={store.answers}
                  addQuestion={store.addQuestion}
                  updateQuestion={store.updateQuestion}
                  deleteQuestion={store.deleteQuestion}
                  isAddModalOpen={isAddModalOpen}
                  setIsAddModalOpen={setIsAddModalOpen}
                />
              )}
              {activeTab === 'users' && (
                <UserManager 
                  participants={store.participants}
                  addParticipant={store.addParticipant}
                  updateParticipantName={store.updateParticipantName}
                  updateParticipantDailyScore={store.updateParticipantDailyScore}
                  removeParticipantDailyScore={store.removeParticipantDailyScore}
                  deleteParticipant={store.deleteParticipant}
                  onParticipantClick={handleParticipantClick}
                />
              )}
              {activeTab === 'active-questions' && (
                <ActiveQuestions
                  questions={store.questions}
                  participants={store.participants}
                  answers={store.answers}
                  deleteParticipantAnswers={store.deleteParticipantAnswers}
                  updateQuestion={store.updateQuestion}
                  deleteQuestion={store.deleteQuestion}
                />
              )}
              {activeTab === 'evaluate' && (
                <EvaluateAnswers
                  questions={store.questions}
                  participants={store.participants}
                  answers={store.answers}
                  updateParticipantScore={store.updateParticipantScore}
                  updateQuestion={store.updateQuestion}
                  addAnswer={store.addAnswer}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {(activeTab === 'dashboard' || activeTab === 'questions') && (
          <button
            onClick={() => {
              if (activeTab !== 'questions') setActiveTab('questions');
              setIsAddModalOpen(true);
            }}
            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 group"
          >
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <ParticipantProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => {
            setIsProfileModalOpen(false);
            setTimeout(() => setSelectedParticipant(null), 300);
          }}
          participant={selectedParticipant}
          questions={store.questions}
          answers={store.answers}
        />
      </main>
    </div>
  );
}

