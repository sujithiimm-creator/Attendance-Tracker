import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import AuthScreen from "./components/AuthScreen";
import TodayView from "./components/TodayView";
import WeekView from "./components/WeekView";
import TimetableView from "./components/TimetableView";
import SubjectsView from "./components/SubjectsView";
import StatsView from "./components/StatsView";
import { 
  LogOut, 
  Calendar, 
  Clock, 
  BookOpen, 
  Settings2, 
  TrendingUp, 
  CloudLightning, 
  Cloud, 
  WifiOff, 
  Sparkles
} from "lucide-react";

type TabType = "today" | "week" | "timetable" | "subjects" | "stats";

function MainAppContent() {
  const { user, logout, isMock } = useAuth();
  const { syncStatus } = useData();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Read login/registration toasts safely
  useEffect(() => {
    const val = localStorage.getItem("attendtrack_toast");
    if (val) {
      localStorage.removeItem("attendtrack_toast");
      if (val === "welcome_back") {
        setToastMsg("Welcome back to AttendTrack! Let's hit that 85% goal.");
      } else if (val === "registered_successfully") {
        setToastMsg("Successfully registered! Welcome to your corporate-ready dashboard.");
      }
    }
  }, [user]);

  // Auto-clear toast banner with fade
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  if (!user) return <AuthScreen />;

  // Render matching tab view
  const renderActiveView = () => {
    switch (activeTab) {
      case "today":
        return <TodayView />;
      case "week":
        return <WeekView />;
      case "timetable":
        return <TimetableView />;
      case "subjects":
        return <SubjectsView />;
      case "stats":
        return <StatsView />;
      default:
        return <TodayView />;
    }
  };

  // Sync Indicator builder
  const renderSyncIndicator = () => {
    let dotColor = "bg-slate-300 animate-pulse";
    let textStr = "Connecting…";

    if (isMock) {
      dotColor = "bg-indigo-400";
      textStr = "Local Demo";
    } else {
      switch (syncStatus) {
        case "saving":
          dotColor = "bg-amber-500 animate-pulse";
          textStr = "Saving…";
          break;
        case "saved":
          dotColor = "bg-green-500";
          textStr = "✓ Synced";
          break;
        case "error":
          dotColor = "bg-red-500";
          textStr = "⚠ Sync failed";
          break;
        case "loading":
        default:
          dotColor = "bg-indigo-400 animate-pulse";
          textStr = "Connecting…";
          break;
      }
    }

    return (
      <div className="flex items-center gap-1.5" id="sync-status-minimal">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{textStr}</span>
      </div>
    );
  };

  // Get Initials for Avatar
  const getInitials = () => {
    if (!user) return "ST";
    if (user.displayName) {
      const parts = user.displayName.split(" ");
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return user.email ? user.email.slice(0, 2).toUpperCase() : "ST";
  };

  return (
    <div className="min-h-screen bg-slate-100 md:py-8 md:px-6 flex items-center justify-center font-sans relative">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div 
          id="global-session-toast"
          className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-fade-in"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main app panel */}
      <div 
        id="app-panel-widescreen"
        className="w-full max-w-7xl min-h-screen md:min-h-[85vh] bg-slate-50 md:rounded-[24px] md:border border-slate-200 shadow-2xl relative flex flex-col overflow-hidden pb-12"
      >
        
        {/* 1. Header Area */}
        <header className="bg-white px-6 pt-5 pb-3 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-indigo-750 text-indigo-600 tracking-tight">AttendTrack</h1>
            {renderSyncIndicator()}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase" title={user.displayName || user.email || ""}>
              {getInitials()}
            </div>
            <button
              id="header-logout-btn"
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 border border-slate-200 hover:border-slate-350 rounded-lg hover:bg-slate-50 text-slate-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. Scrollable Elegant Bottom-lined Tab Bar */}
        <nav className="bg-white border-b border-slate-200 shrink-0 flex overflow-x-auto scrollbar-none" id="global-tabs-switcher">
          {[
            { id: "today", label: "Today's Schedule" },
            { id: "week", label: "Attendance Deck" },
            { id: "timetable", label: "Visual Grid" },
            { id: "subjects", label: "Modules Setup" },
            { id: "stats", label: "Pass Analytics" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-4 px-3.5 border-b-2 text-center transition-all shrink-0 ${
                  isSelected
                    ? "border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/10"
                    : "border-transparent text-slate-400 font-medium hover:text-slate-600"
                }`}
              >
                <span className="text-xxs font-bold uppercase tracking-wide block">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 3. Main Dynamic Content Stream */}
        <main className="flex-1 p-6 overflow-y-auto" id="main-content-scrollable">
          {renderActiveView()}
        </main>

        {/* 4. Bottom Utilities Bar */}
        <footer className="shrink-0 bg-slate-50 border-t border-slate-200 text-center py-4 px-6 flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-400 font-extrabold tracking-wide block">
            AttendTrack · Consolidated Mod 5 Roster
          </span>
        </footer>
      </div>
    </div>
  );
}

// Global Providers Context Wrappers
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
