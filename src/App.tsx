import { useEffect, useState } from 'react';
import { useAppStore } from './stores/firebaseStore';
import { D3MapView } from './components/views/D3MapView';
import { WhiteboardView } from './components/views/WhiteboardView';
import { CalendarView } from './components/views/CalendarView';
import { DailyView } from './components/views/DailyView';
import LoginModal from './components/modals/LoginModal';
import './App.css';

function App() {
  const { currentView, setCurrentView, currentUser, setCurrentUser, initializeFirebase } = useAppStore();
  const [showLogin, setShowLogin] = useState(false);

  // Check for existing username on app start
  useEffect(() => {
    const savedUsername = localStorage.getItem('mindmap-username');
    if (savedUsername) {
      setCurrentUser(savedUsername);
      initializeFirebase();
    } else {
      setShowLogin(true);
    }
  }, [setCurrentUser, initializeFirebase]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setShowLogin(false);
  };

  if (showLogin) {
    return <LoginModal onLogin={handleLogin} />;
  }



  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-cream via-blue/20 to-cream/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white/90 backdrop-blur-lg border-b border-blue/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-navy to-orange rounded-xl flex items-center justify-center shadow-lg shadow-navy/30">
            <span className="text-xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-navy to-orange bg-clip-text text-transparent">
            Mindmap
          </h1>
          {currentUser && (
            <div className="ml-4 px-3 py-1 bg-blue/20 rounded-lg">
              <span className="text-sm font-medium text-navy">👤 {currentUser}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('map')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'map'
                ? 'bg-gradient-to-r from-navy to-orange text-white shadow-lg shadow-navy/30 scale-105'
                : 'bg-cream text-navy hover:bg-blue hover:text-white hover:scale-105'
            }`}
          >
            Map
          </button>

          <button
            onClick={() => setCurrentView('whiteboard')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'whiteboard'
                ? 'bg-gradient-to-r from-navy to-orange text-white shadow-lg shadow-navy/30 scale-105'
                : 'bg-cream text-navy hover:bg-blue hover:text-white hover:scale-105'
            }`}
          >
            Board
          </button>

          <button
            onClick={() => setCurrentView('calendar')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'calendar'
                ? 'bg-gradient-to-r from-navy to-orange text-white shadow-lg shadow-navy/30 scale-105'
                : 'bg-cream text-navy hover:bg-blue hover:text-white hover:scale-105'
            }`}
          >
            Kalender
          </button>

          <button
            onClick={() => setCurrentView('daily')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'daily'
                ? 'bg-gradient-to-r from-blue to-navy text-white shadow-lg shadow-blue/30 scale-105'
                : 'bg-cream text-navy hover:bg-blue hover:text-white hover:scale-105'
            }`}
          >
            Daily
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'map' && <D3MapView />}
        {currentView === 'whiteboard' && <WhiteboardView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'daily' && <DailyView />}
      </main>
    </div>
  );
}

export default App;
