import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Loader2, Cloud, CloudOff, CheckCircle2, RefreshCw, LogOut, Wrench, Download, Upload, ChevronDown } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
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
import { Diagnostics } from './views/Diagnostics';
import { MaintenanceView } from './views/MaintenanceView';
import { useAppStore } from './hooks/useAppStore';
import { isQuestionTimedOut, getDynamicQuestionStatus } from './utils';
import { ParticipantProfileModal } from './components/ParticipantProfileModal';
import { Participant, Question } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

import { GlobalSearch } from './components/GlobalSearch';
import { AdminMenuItems } from './components/AdminMenu';
import { WhatsAppGenerator } from './components/WhatsAppGenerator';
import { MessageSquare, Bell, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('fifa_admin_auth') === 'true';
  });
  const store = useAppStore();

  const handleParticipantClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsProfileModalOpen(true);
  };

  const handleQuestionClick = (question: Question) => {
    setActiveTab(getDynamicQuestionStatus(question) === 'active' ? 'active-questions' : 'questions');
  };

  const [publicDate, setPublicDate] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('date');
  });

  const [publicQuestionId, setPublicQuestionId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('questionId');
  });
  
  const [publicGroupId, setPublicGroupId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('groupId');
  });

  const [isPublicActive, setIsPublicActive] = useState(() => {
    return new URLSearchParams(window.location.search).get('active') === 'true';
  });
  
  const [isPublicLeaderboard, setIsPublicLeaderboard] = useState(() => {
    return new URLSearchParams(window.location.search).get('view') === 'leaderboard';
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Keep this empty or remove if nothing else is needed here, 
    // since we initialized synchronously above.
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && store.lastSyncTime) {
        const diff = Date.now() - store.lastSyncTime;
        if (diff > 5 * 60 * 1000) {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-slate-800">Data might be stale</span>
              <span className="text-sm text-slate-600">Last sync was over 5 minutes ago.</span>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    store.forceRefresh();
                    toast.dismiss(t.id);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
                >
                  Refresh Now
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 10000, id: 'stale-data-warning' });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [store.lastSyncTime, isOnline, store]);

  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (store.isSyncing && isOnline) {
      timeout = setTimeout(() => {
        setIsSlowConnection(true);
      }, 3000);
    } else {
      setIsSlowConnection(false);
    }
    return () => clearTimeout(timeout);
  }, [store.isSyncing, isOnline]);

  const handleExportState = () => {
    try {
      const jsonStr = store.exportFullState();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fifa_admin_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Database exported successfully');
    } catch (e) {
      toast.error('Failed to export database');
    }
  };

  const handleImportState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        if (window.confirm('Are you sure you want to overwrite the current database with this JSON backup? This could affect live data.')) {
          await store.importFullState(content);
        }
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleLogin = () => {
    localStorage.setItem('fifa_admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fifa_admin_auth');
    setIsAuthenticated(false);
  };

  const isAnyPublicView = isPublicLeaderboard || publicGroupId || publicDate || publicQuestionId || isPublicActive;
  if (isAnyPublicView && store.appSettings?.isMaintenanceMode) {
    return <MaintenanceView />;
  }

  if (isPublicLeaderboard) {
    return <PublicLeaderboardView participants={store.participants} isEnabled={store.appSettings?.isPublicLeaderboardEnabled ?? true} />;
  }

  if (publicGroupId) {
    if (store.isLoading) {
      return (
        <div className="min-h-screen bg-[#0a1128] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading prediction group...</p>
          </div>
        </div>
      );
    }
    const groupQuestions = store.questions.filter(q => q.groupId === publicGroupId);
    if (groupQuestions.length > 0) {
      // Sort them by creation time or id
      groupQuestions.sort((a, b) => {
        if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
        return a.id.localeCompare(b.id);
      });
      return (
        <PublicQuestionsView 
          date={groupQuestions[0].date} 
          questions={groupQuestions} 
          participants={store.participants} 
          answers={store.answers} 
          addAnswer={store.addAnswer} 
          isActiveView={false} 
          isLoading={store.isLoading}
        />
      );
    }
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

  const recentActivities = [
    ...store.answers.map(a => ({
      id: a.id,
      type: 'answer',
      title: `${store.participants.find(p => p.id === a.participantId)?.name || 'Someone'} answered`,
      subtitle: store.questions.find(q => q.id === a.questionId)?.text || 'a question',
      timestamp: new Date(a.timestamp).getTime()
    })),
    ...store.questions.map(q => ({
      id: q.id + '-created',
      type: 'question',
      title: 'Question Updated',
      subtitle: q.text,
      timestamp: q.createdAt || Date.now() - 86400000
    }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  const adminMenuNode = (
    <AdminMenuItems 
      onImport={handleImportState}
      onExport={handleExportState}
      isMaintenanceMode={store.appSettings?.isMaintenanceMode ?? false}
      onToggleMaintenance={async () => {
        if (store.updateAppSettings) {
          const current = store.appSettings?.isMaintenanceMode ?? false;
          await store.updateAppSettings({ isMaintenanceMode: !current });
          toast.success(`Maintenance Mode ${!current ? 'Enabled' : 'Disabled'}`);
        }
      }}
      isLeaderboardLive={store.appSettings?.isPublicLeaderboardEnabled ?? true}
      onToggleLeaderboard={async () => {
        if (store.updateAppSettings) {
          const current = store.appSettings?.isPublicLeaderboardEnabled ?? true;
          await store.updateAppSettings({ isPublicLeaderboardEnabled: !current });
          toast.success(`Public Leaderboard ${!current ? 'Enabled' : 'Disabled'}`);
        }
      }}
      isSyncing={store.isSyncing}
      isOnline={isOnline}
      isSlowConnection={isSlowConnection}
      onRefresh={() => store.forceRefresh()}
      onLogout={handleLogout}
      onUsers={() => {
        setActiveTab('users');
        setIsMobileMenuOpen(false);
      }}
      onWhatsAppAnnounce={() => {
        setIsWaModalOpen(true);
        setIsMobileMenuOpen(false);
      }}
    />
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} activeCount={activeCount} evaluateCount={evaluateCount} adminMenuContent={adminMenuNode} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-[72px] md:pb-0 relative">
        <header className="h-16 bg-[#0a1128] border-b border-slate-800/80 flex items-center justify-between px-4 md:px-8 flex-shrink-0 shadow-md relative z-20">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/d/1ICYyiBiZbuE_gsUv3tqsH6pFXzEst_D3" alt="Logo" className="w-10 h-10 object-contain md:hidden" referrerPolicy="no-referrer" />
            
            <div className="hidden sm:block relative">
              <button 
                onClick={() => setIsActivityMenuOpen(!isActivityMenuOpen)}
                className={`flex items-center justify-center w-[38px] h-[38px] rounded-xl border transition-all ${isActivityMenuOpen ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-400' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}`}
                title="Recent Activity"
              >
                <div className="bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-400/30">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </button>

              {isActivityMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsActivityMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-72 bg-[#0a1128] rounded-xl shadow-2xl border border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-800/50">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Activity</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {recentActivities.length > 0 ? (
                        <div className="flex flex-col">
                          {recentActivities.map((activity, idx) => (
                            <div key={activity.id + idx} className="p-3 border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${activity.type === 'answer' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {activity.type === 'answer' ? <CheckCircle2 className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                              </div>
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="text-xs font-medium text-slate-200 truncate">{activity.title}</span>
                                <span className="text-[10px] text-slate-400 truncate">{activity.subtitle}</span>
                                <span className="text-[9px] text-slate-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 max-w-xl mx-4 flex justify-center">
            <GlobalSearch 
              participants={store.participants}
              questions={store.questions}
              answers={store.answers}
              onParticipantClick={handleParticipantClick}
              onQuestionClick={handleQuestionClick}
            />
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0 relative">
            {/* Desktop Engaging Stats Area */}
            <div className="hidden md:flex items-center gap-4 mr-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300 shadow-inner backdrop-blur-sm">
                <span className="relative flex h-2 w-2 mr-1">
                  {isOnline ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                  )}
                </span>
                {!isOnline ? "Offline" : isSlowConnection ? "Slow Connection" : store.isSyncing ? "Saving..." : "System Live"}
              </div>

              <div className="h-6 w-px bg-slate-700/50 hidden lg:block"></div>
              
              <div className="hidden lg:flex items-center gap-3 relative">
                <button 
                  onClick={() => setIsWaModalOpen(true)}
                  className="flex items-center justify-center w-[38px] h-[38px] rounded-xl border bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 transition-all"
                  title="WhatsApp Announce"
                >
                  <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-400/30">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </button>
                <div className="flex items-center gap-2.5 bg-slate-800/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 shadow-sm transition-all hover:bg-slate-800/60 text-white">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-400/30">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="flex flex-col pr-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">Active Players</span>
                    <span className="text-xs font-black text-white leading-none mt-1">{store.participants.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Profile Menu */}
            <div className="md:hidden relative">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium"
              >
                A
              </button>
              
              {isMobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a1128] rounded-xl shadow-2xl border border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-800/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium shrink-0">
                        A
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="text-xs font-medium text-slate-300 truncate">System Manager</div>
                        <div className="text-[10px] text-slate-500">Logged in</div>
                      </div>
                    </div>
                    {adminMenuNode}
                  </div>
                </>
              )}
            </div>
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
              <ErrorBoundary>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    participants={store.participants} 
                    questions={store.questions}
                    answers={store.answers}
                    onNavigate={setActiveTab}
                    appSettings={store.appSettings}
                    updateAppSettings={store.updateAppSettings}
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
                    onNavigateToEvaluate={() => setActiveTab('evaluate')}
                  />
                )}
                {activeTab === 'users' && (
                  <UserManager 
                    participants={store.participants}
                    addParticipant={store.addParticipant}
                    updateParticipantName={store.updateParticipantName}
                    updateParticipantDailyScore={store.updateParticipantDailyScore}
                    batchUpdateParticipantScores={store.batchUpdateParticipantScores}
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
                {activeTab === 'diagnostics' && (
                  <Diagnostics />
                )}
              </ErrorBoundary>
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

        <WhatsAppGenerator 
          isOpen={isWaModalOpen} 
          onClose={() => setIsWaModalOpen(false)} 
          questions={store.questions} 
          participants={store.participants} 
        />
      </main>
    </div>
  );
}

