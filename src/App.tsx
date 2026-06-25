import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Leaderboard } from './views/Leaderboard';
import { QuestionsPortal } from './views/QuestionsPortal';
import { UserManager } from './views/UserManager';
import { PublicQuestionsView } from './views/PublicQuestionsView';
import { useAppStore } from './hooks/useAppStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const store = useAppStore();

  const [publicDate, setPublicDate] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setPublicDate(dateParam);
    }
  }, []);

  if (publicDate) {
    const dayQuestions = store.questions.filter(q => q.date === publicDate);
    return <PublicQuestionsView date={publicDate} questions={dayQuestions} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-800">Contest Management</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Update Active
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
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
        </div>
      </main>
    </div>
  );
}

