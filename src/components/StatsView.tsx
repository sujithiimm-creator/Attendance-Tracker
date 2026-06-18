import React from "react";
import { useData } from "../context/DataContext";
import { calculateOverallStats } from "../lib/helpers";
import { AlertCircle, AlertTriangle, ShieldCheck, Trophy, Sparkles, TrendingUp, Info } from "lucide-react";

export default function StatsView() {
  const { data } = useData();

  if (!data) return null;

  const stats = calculateOverallStats(data.subjects, data.records, data.extraClasses);

  // Large SVG Circle stats dimensions
  const radius = 64;
  const strokeWidth = 9;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  // Determine global color
  const percentage = stats.percentage;
  let themeColor = "#ef4444"; // Red (<60)
  let themeBg = "bg-red-50 text-red-650";
  let themeRingBackgroundPath = "stroke-red-50"; 
  let feedbackTitle = "Urgent Action Required";
  let feedbackDesc = "Your attendance overall is critically low. Prioritize attending future lectures.";
  let feedbackIcon = <AlertCircle className="w-5 h-5 text-red-500" />;

  if (percentage >= 85) {
    themeColor = "#22c55e"; // Green
    themeBg = "bg-green-50 text-green-600";
    themeRingBackgroundPath = "stroke-green-50";
    feedbackTitle = "Debarment Threshold Cleared";
    feedbackDesc = "Excellent! You are above the mandatory 85% limit set by academic regulators.";
    feedbackIcon = <ShieldCheck className="w-5 h-5 text-green-500" />;
  } else if (percentage >= 70) {
    themeColor = "#f59e0b"; // Amber
    themeBg = "bg-amber-50 text-amber-600";
    themeRingBackgroundPath = "stroke-amber-50";
    feedbackTitle = "Approaching Debarment Risk";
    feedbackDesc = "Warning! Keep active attendance high in oncoming labs to cross standard 85% threshold.";
    feedbackIcon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
  }

  // Count items below 75%
  const flaggedSubjects = stats.dangerSubjects;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* 1. Global Percentage Hub */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center gap-4">
        <div>
          <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Consolidated Report</span>
          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Overall Attendance Standing</h3>
        </div>

        {/* Large SVG ring */}
        <div className="relative flex items-center justify-center shrink-0 w-36 h-36 mt-1">
          <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
            <circle
              className="stroke-slate-50"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={themeColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-800 leading-none">
              {stats.percentage.toFixed(1)}%
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1.5">
              Cumulative
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 w-full bg-slate-50 border border-slate-100 p-3 rounded-[12px] mt-1 text-[11px]">
          <div className="flex flex-col py-0.5">
            <span className="font-extrabold text-slate-800">{stats.totalPresent}</span>
            <span className="text-slate-400 uppercase tracking-wider text-[8px] font-bold mt-0.5">Present</span>
          </div>
          <div className="flex flex-col border-l border-slate-200 py-0.5">
            <span className="font-extrabold text-slate-800">{stats.totalAbsent}</span>
            <span className="text-slate-400 uppercase tracking-wider text-[8px] font-bold mt-0.5">Absent</span>
          </div>
          <div className="flex flex-col border-l border-slate-200 py-0.5">
            <span className="font-extrabold text-slate-500">{stats.totalCancelled}</span>
            <span className="text-slate-400 uppercase tracking-wider text-[8px] font-bold mt-0.5">Cancelled</span>
          </div>
        </div>

        {/* Feedback Alert Card */}
        <div className={`w-full flex gap-3 text-left p-4.5 border rounded-xl items-start ${themeBg} border-slate-200/40 text-[11px] leading-snug`}>
          <div className="shrink-0 mt-0.5">{feedbackIcon}</div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="font-extrabold text-slate-800">{feedbackTitle}</span>
            <span className="text-slate-500 leading-normal">{feedbackDesc}</span>
          </div>
        </div>
      </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* 2. Flagged Danger Zone (< 85%) */}
      {flaggedSubjects.length > 0 && (
        <div className="bg-red-50/20 border border-red-200 rounded-[20px] p-5 shadow-sm flex flex-col gap-3.5">
          <div>
            <span className="text-xxs font-bold text-red-500 uppercase tracking-wider block">Compliance Warnings</span>
            <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Danger List - Below 85%</h3>
          </div>

          <div className="flex flex-col gap-3" id="flagged-subjects-list">
            {flaggedSubjects.map((sub, i) => {
              const options = [
                "Must attend next 3 lectures to clear status",
                "High debarment risk. Speak to Course Admin",
                "Needs makeup attendance via extra lectures"
              ];
              const warningNote = options[i % options.length];
              return (
                <div
                  key={sub.subjectId}
                  className="bg-white border border-red-200 rounded-xl p-3 flex gap-3.5 items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-red-650 bg-red-50 px-2 py-0.5 rounded uppercase">
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{sub.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium pl-1">
                      {warningNote}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[15px] font-black text-red-650 leading-none">
                      {Math.round(sub.percentage)}%
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block mt-1 leading-none">
                      Current
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Full Breakdown Table List */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div>
          <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Credits Roster</span>
          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Course Attendance Breakdown</h3>
        </div>

        <div className="flex flex-col gap-3.5" id="stats-breakdown-list">
          {data.subjects.length === 0 ? (
            <span className="text-xs text-slate-400 text-center py-3">No subjects registered</span>
          ) : (
            data.subjects.map((sub) => {
              const subStats = flaggedSubjects.find((f) => f.subjectId === sub.id) || 
                { percentage: 100, presentCount: 0, totalActive: 0 };
              
              // We recalculate locally or load from stats
              let present = 0;
              let activeTotal = 0;
              let percentageVal = 100;
              
              // Find related extra classes
              const relatedExtras = data.extraClasses.filter((ex) => ex.subjectId === sub.id);
              const extraIds = new Set(relatedExtras.map(ex => ex.id));

              Object.entries(data.records).forEach(([dateIso, rec]) => {
                Object.entries(rec).forEach(([key, val]) => {
                  if (key === sub.id || key.startsWith(sub.id + "_s") || (key.startsWith("extra_") && extraIds.has(key.replace("extra_", "")))) {
                    if (val === "present") {
                      present++;
                      activeTotal++;
                    } else if (val === "absent") {
                      activeTotal++;
                    }
                  }
                });
              });

              if (activeTotal > 0) {
                percentageVal = (present / activeTotal) * 100;
              }

              return (
                <div
                  key={sub.id}
                  className="border-b border-slate-100 last:border-0 pb-3 h-fit last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1 select-none">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono shrink-0">
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{sub.name}</h4>
                    </div>
                    <span className="text-[10.5px] text-slate-400 font-medium">
                      Attended {present} of {activeTotal} active lectures
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black tracking-wide px-2 py-0.5 rounded border uppercase transition-all ${
                      percentageVal >= 85
                        ? "text-green-600 bg-green-50/50 border-green-200/50"
                        : percentageVal >= 70
                        ? "text-amber-600 bg-amber-50/50 border-amber-200/50"
                        : "text-red-600 bg-red-50/50 border-red-200/50"
                    }`}>
                      {Math.round(percentageVal)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
