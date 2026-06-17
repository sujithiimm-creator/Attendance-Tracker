import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, AlertCircle, Mail, Lock, User } from "lucide-react";

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all credentials");
      return;
    }
    if (activeTab === "register" && !displayName) {
      setError("Please enter your display name");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "login") {
        await signInWithEmail(email, password);
        localStorage.setItem("attendtrack_toast", "welcome_back");
      } else {
        await signUpWithEmail(email, password, displayName);
        localStorage.setItem("attendtrack_toast", "registered_successfully");
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      {/* Container simulating a sleek mobile layout */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden py-8 px-6 flex flex-col gap-6">
        
        {/* Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">AttendTrack</h1>
          <p className="text-xs text-slate-400 max-w-[280px]">
            Class attendance manager for IIM Mumbai MBA (Mod 5)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl" id="auth-tab-container">
          <button
            id="auth-login-tab"
            type="button"
            className={`py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Log In
          </button>
          <button
            id="auth-register-tab"
            type="button"
            className={`py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "register"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {activeTab === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500" htmlFor="displayName">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Sujith Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="e.g. name@student.iimmumbai.ac.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                placeholder="Enter password (6+ characters)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-semibold rounded-xl py-3 text-sm mt-2 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : activeTab === "login" ? (
              "Sign In"
            ) : (
                "Create Account"
            )}
          </button>
        </form>

        <p className="text-xxs text-slate-400 text-center leading-normal">
          By signing in, IIM Mumbai students secure attendance schedules stored in live Firestore instances under full sandbox isolation.
        </p>
      </div>
    </div>
  );
}
