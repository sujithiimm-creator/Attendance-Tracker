import React from "react";
import { useData } from "../context/DataContext";
import { Subject, ExtraClass, AttendanceStatus } from "../types";
import { getLocalDateString, DAY_NAMES, calculateOverallStats } from "../lib/helpers";
import { Coffee, ChevronRight, Calendar } from "lucide-react";

export default function TodayView() {
  const { data, markAttendance } = useData();

  if (!data) return null;

  const todayDate = new Date();
  const todayDayIndex = todayDate.getDay(); // 0=Sun..6=Sat
  const todayISO = getLocalDateString(todayDate);

  // Filter regular day subjects
  const todayRegularSubjects = data.subjects.filter((sub) =>
    sub.days.includes(todayDayIndex)
  );

  // Filter extra classes scheduled for today
  const todayExtraClasses = data.extraClasses.filter(
    (ex) => ex.date === todayISO
  );

  // Grab the attendance records for today
  const todayRecords = data.records[todayISO] || {};

  const handleMark = async (key: string, status: AttendanceStatus) => {
    await markAttendance(todayISO, key, status);
  };

  const todayDayName = todayDate.toLocaleDateString("en-US", { weekday: "long" });
  const todayMonthDay = todayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Calculate live overall statistics for the bottom summary card
  const overallStats = calculateOverallStats(data.subjects, data.records, data.extraClasses);
  const roundedPercentage = Math.round(overallStats.percentage);
  
  // Custom progress ring computation
  const innerRadius = 26;
  const miniCircumference = 2 * Math.PI * innerRadius; // ~163.36
  const strokeDashoffset = miniCircumference - (overallStats.percentage / 100) * miniCircumference;

  return (
    <div className="flex flex-col gap-6 min-h-full pb-2">
      {/* Date Section */}
      <section id="today-view-title-section">
        <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
          {todayDayName}, {todayMonthDay}
        </p>
        <h2 className="text-2xl font-extrabold text-slate-800">Today's Classes</h2>
      </section>

      {/* Lectures Checklist */}
      <div className="flex flex-col gap-4" id="today-classes-cards-container">
        {todayRegularSubjects.length === 0 && todayExtraClasses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[24px] border border-slate-205 border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
              <Coffee className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No classes today</h4>
            <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
              You do not have any lectures scheduled for today. Enjoy your free time or capture makeup classes under the schedule tab!
            </p>
          </div>
        ) : (
          <>
            {/* 1. Regular Lectures */}
            {todayRegularSubjects.map((sub) => {
              const currentStatus = todayRecords[sub.id];
              const timeDetails = sub.dayTimes[String(todayDayIndex)] || "Timings pending";

              // Color code the left stripe relative to mark status
              let stripeColor = "bg-indigo-500";
              if (currentStatus === "present") stripeColor = "bg-green-500";
              else if (currentStatus === "absent") stripeColor = "bg-red-500";
              else if (currentStatus === "cancelled") stripeColor = "bg-slate-400";

              return (
                <div
                  key={sub.id}
                  id={`today-card-${sub.id}`}
                  className="bg-white border border-slate-200 rounded-[20px] p-4.5 shadow-sm relative overflow-hidden flex flex-col gap-4"
                >
                  {/* Color stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">
                        {sub.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 font-medium mt-1">
                        {timeDetails}
                      </p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 tracking-wider">
                      {sub.code}
                    </span>
                  </div>

                  {/* Marking Pills */}
                  <div className="flex gap-2" id={`marking-btns-${sub.id}`}>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "present")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "present"
                          ? "bg-green-500 text-white shadow-md shadow-green-150"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "absent")}
                      className={`flex-1 py-11 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "absent"
                          ? "bg-red-500 text-white shadow-md shadow-red-150"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "cancelled")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "cancelled"
                          ? "bg-slate-400 text-white shadow-md shadow-slate-100"
                          : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 2. Extra Lectures */}
            {todayExtraClasses.map((ex) => {
              const sub = data.subjects.find((s) => s.id === ex.subjectId);
              const extraKey = `extra_${ex.id}`;
              const currentStatus = todayRecords[extraKey];

              if (!sub) return null;

              // Color-coded stripe
              let stripeColor = "bg-amber-500";
              if (currentStatus === "present") stripeColor = "bg-green-500";
              else if (currentStatus === "absent") stripeColor = "bg-red-500";
              else if (currentStatus === "cancelled") stripeColor = "bg-slate-400";

              return (
                <div
                  key={ex.id}
                  id={`today-extra-card-${ex.id}`}
                  className="bg-white border border-slate-200 rounded-[20px] p-4.5 shadow-sm relative overflow-hidden flex flex-col gap-4"
                >
                  {/* Left color stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                          Makeup Lecture
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug mt-1">
                        {sub.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 font-medium mt-1">
                        {ex.time} {ex.note ? `· ${ex.note}` : ""}
                      </p>
                    </div>
                    <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 tracking-wider">
                      {sub.code}
                    </span>
                  </div>

                  {/* Marking Action Tray */}
                  <div className="flex gap-2" id={`marking-btns-extra-${ex.id}`}>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "present")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "present"
                          ? "bg-green-500 text-white shadow-md shadow-green-150"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "absent")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "absent"
                          ? "bg-red-500 text-white shadow-md shadow-red-150"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "cancelled")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        currentStatus === "cancelled"
                          ? "bg-slate-400 text-white shadow-md shadow-slate-100"
                          : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Summary / Quick Stats Live Card */}
      <div className="mt-auto pt-3" id="today-compact-stats-banner">
        <div className="bg-slate-900 rounded-[24px] p-5 flex items-center justify-between text-white shadow-xl">
          <div>
            <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">Overall Attendance</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{roundedPercentage}%</span>
              <span className={`text-xxs font-extrabold ${overallStats.percentage >= 75 ? "text-green-400" : "text-amber-400"}`}>
                {overallStats.percentage >= 75 ? "✓ Safe" : "⚠ Low"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1.5">
              Cumulative tracker · Mod 5 Regulatory Goal
            </p>
          </div>

          {/* Elegant Circular Progress SVG */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full rotate-[-90deg]">
              <circle cx="32" cy="32" r={innerRadius} stroke="#1e293b" strokeWidth="5.5" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r={innerRadius}
                stroke={overallStats.percentage >= 75 ? "#22c55e" : overallStats.percentage >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="5.5"
                fill="transparent"
                strokeDasharray={`${miniCircumference} ${miniCircumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute text-[11px] font-extrabold text-white">
              {roundedPercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
