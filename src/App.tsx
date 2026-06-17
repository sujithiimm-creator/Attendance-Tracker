import React, { useState } from "react";
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
  RefreshCcw,
  BookMarked
} from "lucide-react";

type TabType = "today" | "week" | "timetable" | "subjects" | "stats";

function MainAppContent() {
  const { user, logout, isMock } = useAuth();
  const { syncStatus, resetData } = useData();
  const [activeTab, setActiveTab] = useState<TabType>("today");

  if (!user) return <AuthScreen />;

  // Seeding/Reset Handler
  const handleResetData = async () => {
    if (
      confirm(
        "Are you sure you want to reset your attendance database? This action will restore your schedule back to the default IIM Mumbai Mod 5 timetable seed and swipe away all existing check-in records."
      )
    ) {
      await resetData();
    }
  };

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
      dotColor = "bg-slate-400";
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
    <div className="min-h-screen bg-slate-200 md:py-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-[430px] min-h-screen md:min-h-[800px] md:h-[800px] bg-slate-50 md:rounded-[32px] md:border-[8px] md:border-slate-900 shadow-2xl relative flex flex-col overflow-hidden pb-12">
        
        {/* 1. Header Area */}
        <header className="bg-white px-6 pt-5 pb-3 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AttendTrack</h1>
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
            { id: "today", label: "Today" },
            { id: "week", label: "Week" },
            { id: "timetable", label: "Schedule" },
            { id: "subjects", label: "Subjects" },
            { id: "stats", label: "Stats" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-3.5 px-2 border-b-2 text-center transition-all shrink-0 ${
                  isSelected
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-400 font-medium hover:text-slate-600"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-tight block">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 3. Main Dynamic Content Stream */}
        <main className="flex-1 p-5 overflow-y-auto" id="main-content-scrollable">
          {renderActiveView()}
        </main>

        {/* 4. Bottom Utilities Bar */}
        <footer className="shrink-0 bg-slate-50 border-t border-slate-200/50 py-3 px-6 text-center flex flex-col gap-1.5">
          <button
            id="btn-reseed-data"
            type="button"
            onClick={handleResetData}
            className="text-[10px] text-slate-400 hover:text-indigo-600 transition flex items-center justify-center gap-1.5 mx-auto font-bold border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-full shadow-xxs"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset Database Seed</span>
          </button>
          <span className="text-[8px] text-slate-350 uppercase select-none font-bold tracking-widest block">
            AttendTrack · Mod 5
          </span>
        </footer>
      </div>
    </div>
  );
}

// Global Providers Context Wrappers
export default function App() {
  const [loading, setLoading] = useState(false);

  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
