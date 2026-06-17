import React from "react";
import { useData } from "../context/DataContext";
import { Subject, ExtraClass } from "../types";
import { getLocalDateString, DAY_SHORT_NAMES, DAY_NAMES } from "../lib/helpers";
import { Calendar, BookOpen, MapPin, User, Clock, Bell } from "lucide-react";

// Persistent Color Coding for modules
export function getSubjectColor(index: number) {
  const themes = [
    { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100 font-bold", dot: "bg-indigo-500", primary: "bg-indigo-500" },
    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100 font-bold", dot: "bg-emerald-500", primary: "bg-emerald-500" },
    { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100 font-bold", dot: "bg-rose-500", primary: "bg-rose-500" },
    { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100 font-bold", dot: "bg-amber-500", primary: "bg-amber-500" },
    { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100 font-bold", dot: "bg-sky-500", primary: "bg-sky-500" },
    { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100 font-bold", dot: "bg-violet-500", primary: "bg-violet-500" },
  ];
  return themes[index % themes.length];
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

export default function TimetableView() {
  const { data } = useData();

  if (!data) return null;

  const todayISO = getLocalDateString(new Date());

  // Upcoming extra classes sorted by date ascending
  const upcomingExtras = data.extraClasses
    .filter((ex) => ex.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* 1. Visual Weekly Grid */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div>
          <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Timetable Grid</span>
          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Weekly Class Clusters</h3>
        </div>

        {/* Horizontally scrollable row wrapper to support all 7 columns gracefully */}
        <div className="overflow-x-auto scrollbar-none" id="timetable-horizontal-scroll">
          <div className="min-w-[480px] grid grid-cols-7 gap-2 pb-1" id="timetable-grid-cols">
            {WEEKDAY_ORDER.map((dayIndex) => {
              const dayName = DAY_SHORT_NAMES[dayIndex];
              const registeredClasses = data.subjects.filter((sub) =>
                sub.days.includes(dayIndex)
              );

              return (
                <div
                  key={dayIndex}
                  className="flex flex-col gap-2 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 min-h-[140px]"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center border-b border-slate-200/40 pb-1.5 mb-1 block">
                    {dayName}
                  </span>
                  
                  <div className="flex flex-col gap-1.5 flex-1">
                    {registeredClasses.length === 0 ? (
                      <span className="text-[9px] text-slate-350 italic text-center my-auto leading-tight">
                        No lectures
                      </span>
                    ) : (
                      registeredClasses.map((sub) => {
                        const subIndex = data.subjects.findIndex((s) => s.id === sub.id);
                        const theme = getSubjectColor(subIndex);
                        return (
                          <div
                            key={sub.id}
                            title={`${sub.name} - ${sub.dayTimes[String(dayIndex)]}`}
                            className={`px-1.5 py-1 rounded-lg text-[9px] font-bold text-center border truncate cursor-help ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            {sub.code}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Subjects Legend with timing details */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div>
          <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Timetable Legend</span>
          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Module Details & Instructors</h3>
        </div>

        <div className="flex flex-col gap-3.5" id="timetable-legend-list">
          {data.subjects.length === 0 ? (
            <div className="text-xs font-bold text-slate-400 py-4 text-center">
              No subjects registered yet. Create one under the Subjects tab!
            </div>
          ) : (
            data.subjects.map((sub, idx) => {
              const theme = getSubjectColor(idx);
              return (
                <div
                  key={sub.id}
                  className="border-b border-slate-100 last:border-0 pb-3.5 h-fit last:pb-0 flex items-start gap-3.5"
                >
                  {/* Subject badge indicator */}
                  <div className={`w-1.5 h-10 rounded-full shrink-0 ${theme.primary}`} />
                  
                  {/* Details block */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded uppercase ${theme.bg} ${theme.text}`}>
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-805 text-slate-800 line-clamp-1">
                        {sub.name}
                      </h4>
                    </div>

                    {/* Show time details per day */}
                    <div className="flex flex-col gap-1 mt-1 pr-1">
                      {sub.days.map((dVal) => (
                        <div key={dVal} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-400 shrink-0 w-8">{DAY_SHORT_NAMES[dVal]}:</span>
                          <span className="truncate">{sub.dayTimes[String(dVal)] || "Timings pending"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>

      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* 3. Upcoming Extra Classes */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Special Schedule</span>
            <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Upcoming Extra Lectures</h3>
          </div>
          <Bell className="w-4 h-4 text-slate-350" />
        </div>

        <div className="flex flex-col gap-3" id="timetable-upcoming-extras">
          {upcomingExtras.length === 0 ? (
            <div className="text-xs font-bold text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-[20px] bg-slate-50/40">
              No upcoming extra classes scheduled
            </div>
          ) : (
            upcomingExtras.map((ex) => {
              const sub = data.subjects.find((s) => s.id === ex.subjectId);
              if (!sub) return null;
              
              const parsedDate = new Date(ex.date);
              const formattedDate = parsedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={ex.id}
                  className="bg-white border border-slate-200 rounded-[16px] p-4 flex flex-col gap-2 relative overflow-hidden shadow-xs"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded tracking-wide uppercase">
                      {sub.code} Extra
                    </span>
                    <span className="text-[10px] font-bold text-slate-505 text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                      {formattedDate}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1 pl-1 mt-1">{sub.name}</h4>
                  
                  <div className="flex items-start gap-3 text-[10.5px] text-slate-505 text-slate-500 mt-1 pl-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{ex.time}</span>
                    </div>
                    {ex.note && (
                      <span className="text-slate-450 truncate flex-1 border-l border-slate-200 pl-3">
                        {ex.note}
                      </span>
                    )}
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
