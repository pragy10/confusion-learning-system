import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import Home from "./pages/Home";
import MainApp from "./pages/MainApp";
import SessionSummaryModal from "./components/SessionSummary/SessionSummaryModal";

function Navigation({ onOpenSummary }) {
  const location = useLocation();
  const isApp = location.pathname === "/app";

  return (
    <header className="border-b border-slate-800/60 bg-[#0a0a0a]">
      <div className="mx-auto max-w-screen-2xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs">C</span>
          </div>
          <span className="text-slate-200 font-semibold tracking-tight text-sm hover:text-white transition-colors">
            Confusion Learning
          </span>
        </Link>
        
        <nav className="flex items-center gap-5">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors ${!isApp ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Home
          </Link>
          <Link 
            to="/app" 
            className={`text-sm font-medium transition-colors ${isApp ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Workspace
          </Link>

          <button
            onClick={onOpenSummary}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#141414] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            title="View learning session analytics and retention summary"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Session Summary</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function AppContent() {
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState(null);

  const handleOpenSummary = () => {
    // First trigger global event in case active player is listening
    window.dispatchEvent(new CustomEvent("open-session-summary"));

    // If player isn't actively displaying it, load stored snapshot
    try {
      const stored = localStorage.getItem("last_learning_session");
      if (stored) {
        setSessionSnapshot(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read last session", e);
    }

    // Allow a slight tick: if active VideoPlayer is mounted, it intercepts open-session-summary
    // Otherwise open global fallback modal
    setTimeout(() => {
      const activeModal = document.querySelector(".fixed.inset-0.z-50");
      if (!activeModal) {
        setGlobalModalOpen(true);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 flex flex-col font-sans selection:bg-slate-700 selection:text-white">
      <Navigation onOpenSummary={handleOpenSummary} />
      <main className="flex-1 mx-auto max-w-screen-2xl w-full px-6 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<MainApp />} />
        </Routes>
      </main>

      {/* Global Fallback Session Summary Modal if not inside active VideoPlayer */}
      {sessionSnapshot && (
        <SessionSummaryModal
          isOpen={globalModalOpen}
          onClose={() => setGlobalModalOpen(false)}
          events={sessionSnapshot.events || []}
          duration={sessionSnapshot.duration || 0}
          currentTime={sessionSnapshot.currentTime || 0}
          savedExplanations={sessionSnapshot.savedExplanations || []}
          customNotes={sessionSnapshot.customNotes || ""}
          videoTitle={sessionSnapshot.videoTitle || "Last Session Video"}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
