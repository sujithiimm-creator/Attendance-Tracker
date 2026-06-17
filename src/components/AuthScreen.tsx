import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, AlertCircle, Mail, Lock, User, Sparkles } from "lucide-react";

export default function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      localStorage.setItem("attendtrack_toast", "welcome_back");
    } catch (err: any) {
      setError(err?.message || "Google Sign-In failed.");
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

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xxs font-medium uppercase tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Google Sign In Auth Action */}
        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-slate-200 hover:bg-slate-50 bg-white font-medium text-slate-600 rounded-xl py-3 text-sm transition flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <p className="text-xxs text-slate-400 text-center leading-normal">
          By signing in, IIM Mumbai students secure attendance schedules stored in live Firestore instances under full sandbox isolation.
        </p>
      </div>
    </div>
  );
}
