import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
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
import { isQuestionTimedOut } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('fifa_admin_auth') === 'true';
  });
  const store = useAppStore();

  const [publicDate, setPublicDate] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('date');
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

  if (publicDate) {
    const dayQuestions = store.questions.filter(q => q.date === publicDate);
    return <PublicQuestionsView date={publicDate} questions={dayQuestions} participants={store.participants} addAnswer={store.addAnswer} />;
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const evaluateCount = store.questions.filter(q => (q.status === 'active' || q.status === 'past') && !q.isEvaluated && isQuestionTimedOut(q)).length;
  const activeCount = store.questions.filter(q => q.status === 'active' && !isQuestionTimedOut(q)).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} activeCount={activeCount} evaluateCount={evaluateCount} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-[72px] md:pb-0 relative">
        <header className="h-16 bg-[#0a1128] border-b border-slate-800/80 flex items-center justify-between px-4 md:px-8 flex-shrink-0 md:bg-white md:border-slate-200">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-10 h-10 object-contain md:hidden" referrerPolicy="no-referrer" />
            <h1 className="text-lg md:text-xl font-bold text-white md:text-slate-800 tracking-wider uppercase md:normal-case md:tracking-normal truncate pr-2">SFWC Admin</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
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
          {activeTab === 'dashboard' && (
            <Dashboard 
              participants={store.participants} 
              questions={store.questions} 
              onNavigate={setActiveTab} 
            />
          )}
          {activeTab === 'leaderboard' && (
            <Leaderboard 
              participants={store.participants} 
              updateScore={store.updateParticipantScore}
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
            />
          )}
          {activeTab === 'active-questions' && (
            <ActiveQuestions
              questions={store.questions}
              participants={store.participants}
              answers={store.answers}
              deleteParticipantAnswers={store.deleteParticipantAnswers}
            />
          )}
          {activeTab === 'evaluate' && (
            <EvaluateAnswers
              questions={store.questions}
              participants={store.participants}
              answers={store.answers}
              updateParticipantScore={store.updateParticipantScore}
              updateQuestion={store.updateQuestion}
            />
          )}
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
      </main>
    </div>
  );
}

