import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Subject, ExtraClass, AttendanceStatus } from "../types";
import { 
  getLocalDateString, 
  getMondayOfWeek, 
  getWeekDays, 
  DAY_NAMES, 
  DAY_SHORT_NAMES 
} from "../lib/helpers";
import { ChevronLeft, ChevronRight, Calendar, Lock, CheckCircle, Info } from "lucide-react";

export default function WeekView() {
  const { data, markAttendance } = useData();
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  if (!data) return null;

  // Actual real-world today boundaries
  const actualToday = new Date();
  const actualTodayISO = getLocalDateString(actualToday);
  const actualTodayMidnight = new Date(actualToday);
  actualTodayMidnight.setHours(0, 0, 0, 0);

  // Generate days of the currently viewed week
  const weekDays = getWeekDays(currentWeekMonday);

  const prevWeek = () => {
    const prevMon = new Date(currentWeekMonday);
    prevMon.setDate(currentWeekMonday.getDate() - 7);
    setCurrentWeekMonday(prevMon);
  };

  const nextWeek = () => {
    const nextMon = new Date(currentWeekMonday);
    nextMon.setDate(currentWeekMonday.getDate() + 7);
    setCurrentWeekMonday(nextMon);
  };

  const handleMark = async (dateISO: string, key: string, status: AttendanceStatus) => {
    await markAttendance(dateISO, key, status);
  };

  // Compile formatting for the current week's span: e.g. "Jun 15 – Jun 21, 2026"
  const formatWeekSpan = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const optionsMonthDay: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString("en-US", optionsMonthDay)}, ${start.getFullYear()} – ${end.toLocaleDateString("en-US", optionsMonthDay)}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString("en-US", optionsMonthDay)} – ${end.toLocaleDateString("en-US", optionsMonthDay)}, ${start.getFullYear()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" id="week-view-navigator">
        <button
          id="week-prev-btn"
          type="button"
          onClick={prevWeek}
          className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="text-center">
          <span className="text-xxs font-bold text-indigo-500 uppercase tracking-widest block">View Weekly Cycle</span>
          <span className="text-sm font-bold text-slate-700 block mt-0.5" id="week-view-range-text">
            {formatWeekSpan()}
          </span>
        </div>

        <button
          id="week-next-btn"
          type="button"
          onClick={nextWeek}
          className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 transition"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Week days roster */}
      <div className="flex flex-col gap-4.5" id="week-days-list">
        {weekDays.map((day) => {
          const dayISO = getLocalDateString(day);
          const dayIndex = day.getDay(); // 0=Sun..6=Sat
          const isToday = dayISO === actualTodayISO;
          
          // Is this parsed day in the future?
          const dayMidnight = new Date(day);
          dayMidnight.setHours(0, 0, 0, 0);
          const isFuture = dayMidnight > actualTodayMidnight;

          // Filter standard subjects for this day
          const daySubjects = data.subjects.filter((sub) => sub.days.includes(dayIndex));
          
          // Filter extra classes scheduled on this date
          const dayExtras = data.extraClasses.filter((ex) => ex.date === dayISO);

          const dayRecords = data.records[dayISO] || {};

          return (
            <div
              key={dayISO}
              id={`week-day-card-${dayISO}`}
              className={`bg-white rounded-[20px] border transition-all ${
                isToday ? "border-indigo-500 shadow-md shadow-indigo-50" : "border-slate-200 shadow-sm"
              } overflow-hidden`}
            >
              {/* Day Section Header */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isToday ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {DAY_SHORT_NAMES[dayIndex]}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {isToday && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/40">
                    Today
                  </span>
                )}
                {isFuture && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-slate-350" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* Roster list */}
              <div className="px-5 py-4.5 flex flex-col gap-4">
                {daySubjects.length === 0 && dayExtras.length === 0 ? (
                  <div className="text-xs font-bold text-slate-400 italic py-2 text-center">
                    No scheduled sessions
                  </div>
                ) : (
                  <>
                    {/* Standard Course Modules */}
                    {daySubjects.map((sub) => {
                      const status = dayRecords[sub.id];
                      const timeString = sub.dayTimes[String(dayIndex)] || "Timings pending";

                      // Left status indicators for clean look
                      let markerColor = "bg-slate-200";
                      if (status === "present") markerColor = "bg-green-500";
                      else if (status === "absent") markerColor = "bg-red-500";
                      else if (status === "cancelled") markerColor = "bg-slate-400";

                      return (
                        <div key={sub.id} className="border-b border-slate-105 border-slate-100 last:border-0 pb-4 last:pb-0 flex flex-col gap-3 relative">
                          {/* Inner clean layout */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${markerColor}`} />
                                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                                  {sub.name}
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-505 text-slate-500 mt-1 block pl-3.5">
                                {timeString} · <span className="font-extrabold text-indigo-500">{sub.code}</span>
                              </span>
                            </div>

                            {/* Record display */}
                            {status && !isFuture && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                status === "present"
                                  ? "bg-green-50 border-green-200 text-green-600 shadow-xs"
                                  : status === "absent"
                                  ? "bg-red-50 border-red-200 text-red-600 shadow-xs"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                                {status}
                              </span>
                            )}
                          </div>

                          {/* Controls or Lock banner */}
                          {isFuture ? (
                            <div className="bg-slate-50 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-450 pl-3.5">
                              <Info className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                              <span>Not yet occurred</span>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 pl-3.5" id={`weekview-controls-${dayISO}-${sub.id}`}>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, sub.id, "present")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "present"
                                    ? "bg-green-500 text-white shadow-md shadow-green-150"
                                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, sub.id, "absent")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "absent"
                                    ? "bg-red-500 text-white shadow-md shadow-red-150"
                                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, sub.id, "cancelled")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "cancelled"
                                    ? "bg-slate-400 text-white shadow-sm"
                                    : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Extra Scheduled Sessions */}
                    {dayExtras.map((ex) => {
                      const sub = data.subjects.find((s) => s.id === ex.subjectId);
                      const extraKey = `extra_${ex.id}`;
                      const status = dayRecords[extraKey];

                      if (!sub) return null;

                      let markerColor = "bg-amber-500";
                      if (status === "present") markerColor = "bg-green-500";
                      else if (status === "absent") markerColor = "bg-red-500";
                      else if (status === "cancelled") markerColor = "bg-slate-400";

                      return (
                        <div key={ex.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 flex flex-col gap-3 relative">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${markerColor}`} />
                                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                                  {sub.name} <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded tracking-wide border border-amber-200/20 font-bold uppercase ml-1">Extra</span>
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-500 mt-1 block pl-3.5 font-medium">
                                {ex.time} {ex.note ? `· ${ex.note}` : ""} · <span className="font-extrabold text-amber-600">{sub.code}</span>
                              </span>
                            </div>

                            {status && !isFuture && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                status === "present"
                                  ? "bg-green-50 border-green-200 text-green-600 shadow-xs"
                                  : status === "absent"
                                  ? "bg-red-50 border-red-200 text-red-600 shadow-xs"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                                {status}
                              </span>
                            )}
                          </div>

                          {isFuture ? (
                            <div className="bg-slate-50 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 pl-3.5">
                              <Info className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                              <span>Not yet occurred</span>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 pl-3.5" id={`weekview-controls-${dayISO}-${extraKey}`}>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, extraKey, "present")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "present"
                                    ? "bg-green-500 text-white shadow-md shadow-green-150"
                                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, extraKey, "absent")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "absent"
                                    ? "bg-red-500 text-white shadow-md shadow-red-150"
                                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMark(dayISO, extraKey, "cancelled")}
                                className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                  status === "cancelled"
                                    ? "bg-slate-400 text-white shadow-sm"
                                    : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
