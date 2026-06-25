import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Leaderboard } from './views/Leaderboard';
import { QuestionsPortal } from './views/QuestionsPortal';
import { UserManager } from './views/UserManager';
import { ActiveQuestions } from './views/ActiveQuestions';
import { PublicQuestionsView } from './views/PublicQuestionsView';
import { PublicLeaderboardView } from './views/PublicLeaderboardView';
import { LoginView } from './views/LoginView';
import { useAppStore } from './hooks/useAppStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-[72px] md:pb-0 relative">
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate pr-2">Contest Admin</h1>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="hidden sm:inline">Live Update Active</span>
              <span className="sm:hidden">Live</span>
            </div>
            <button 
              onClick={handleLogout}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
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
              addQuestion={store.addQuestion}
              updateQuestion={store.updateQuestion}
              deleteQuestion={store.deleteQuestion}
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
            />
          )}
        </div>
      </main>
    </div>
  );
}

