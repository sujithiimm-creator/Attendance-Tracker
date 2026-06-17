import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Subject, ExtraClass, AttendanceStatus } from "../types";
import { getLocalDateString, DAY_NAMES, calculateSubjectStats } from "../lib/helpers";
import { Coffee, ChevronRight, Calendar, Plus, Trash2 } from "lucide-react";

export default function TodayView() {
  const { data, markAttendance, addExtraClass, deleteExtraClass } = useData();

  const [showAddTodayExtra, setShowAddTodayExtra] = useState(false);
  const [todayExtraSubjectId, setTodayExtraSubjectId] = useState("");
  const [todayExtraTime, setTodayExtraTime] = useState("");

  if (!data) return null;

  const todayDate = new Date();
  const todayDayIndex = todayDate.getDay(); // 0=Sun..6=Sat
  const todayISO = getLocalDateString(todayDate);

  const handleAddTodayExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayExtraSubjectId) return;
    try {
      await addExtraClass({
        subjectId: todayExtraSubjectId,
        date: todayISO,
        time: todayExtraTime.trim() || "Time pending",
        note: "Makeup class",
      });
      setTodayExtraSubjectId("");
      setTodayExtraTime("");
      setShowAddTodayExtra(false);
    } catch (err) {
      console.error("Error adding today extra class:", err);
    }
  };

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

  return (
    <div className="flex flex-col gap-6 min-h-full pb-2">
      {/* Date Section */}
      <section id="today-view-title-section" className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-1 font-sans">
            {todayDayName}, {todayMonthDay}
          </p>
          <h2 className="text-[25px] font-extrabold text-slate-805 text-slate-800 dark:text-slate-100 font-sans">Today's Classes</h2>
        </div>
        <button
          onClick={() => setShowAddTodayExtra(!showAddTodayExtra)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-750 text-indigo-700 font-sans font-extrabold text-xs rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{showAddTodayExtra ? "Hide Adder" : "Add Extra Class"}</span>
        </button>
      </section>

      {/* Inline Form to add extra class for today */}
      {showAddTodayExtra && (
        <form onSubmit={handleAddTodayExtraSubmit} className="bg-white border border-slate-200 rounded-[20px] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end animate-fade-in">
          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Subject (Mandatory) *</label>
            <select
              required
              value={todayExtraSubjectId}
              onChange={(e) => setTodayExtraSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:border-indigo-400 focus:bg-white transition"
            >
              <option value="">-- Choose Course --</option>
              {data.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Time (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 11:10 am"
              value={todayExtraTime}
              onChange={(e) => setTodayExtraTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <button
              type="submit"
              disabled={data.subjects.length === 0}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setShowAddTodayExtra(false)}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Lectures Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="today-classes-cards-container">
        {todayRegularSubjects.length === 0 && todayExtraClasses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[24px] border border-slate-205 border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm col-span-full">
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
              const stats = calculateSubjectStats(sub, data.records, data.extraClasses);

              // Color code the left stripe relative to mark status
              let stripeColor = "bg-indigo-500";
              if (currentStatus === "present") stripeColor = "bg-green-500";
              else if (currentStatus === "absent") stripeColor = "bg-red-500";
              else if (currentStatus === "cancelled") stripeColor = "bg-slate-400";

              return (
                <div
                  key={sub.id}
                  id={`today-card-${sub.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4"
                >
                  {/* Color stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[18px] leading-snug">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {timeDetails}
                      </p>
                    </div>
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase shrink-0 tracking-wider">
                      {sub.code}
                    </span>
                  </div>



                  {/* Marking Pills style synced with week deck view */}
                  <div className="flex gap-1.5" id={`marking-btns-${sub.id}`}>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "present")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "present"
                          ? "bg-green-500 text-white shadow-md shadow-green-150"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "absent")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "absent"
                          ? "bg-red-500 text-white shadow-md shadow-red-150"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(sub.id, "cancelled")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "cancelled"
                          ? "bg-slate-400 text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-500"
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
              const sub = data.subjects.find((s) => s.id === ex.subjectId || `course_${ex.subjectId}` === s.id);
              const extraKey = `extra_${ex.id}`;
              const currentStatus = todayRecords[extraKey];

              if (!sub) return null;

              const stats = calculateSubjectStats(sub, data.records, data.extraClasses);

              // Color-coded stripe
              let stripeColor = "bg-amber-500";
              if (currentStatus === "present") stripeColor = "bg-green-500";
              else if (currentStatus === "absent") stripeColor = "bg-red-500";
              else if (currentStatus === "cancelled") stripeColor = "bg-slate-400";

              return (
                <div
                  key={ex.id}
                  id={`today-extra-card-${ex.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4"
                >
                  {/* Left color stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                          Makeup Lecture
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[18px] leading-snug mt-1">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {ex.time} {ex.note ? `· ${ex.note}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="bg-amber-55 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                        {sub.code}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Do you want to delete this scheduled makeup class for ${sub.name}?`)) {
                            await deleteExtraClass(ex.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                        title="Delete Makeup Class"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>



                  {/* Marking Action Tray style synced with week deck view */}
                  <div className="flex gap-1.5" id={`marking-btns-extra-${ex.id}`}>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "present")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "present"
                          ? "bg-green-500 text-white shadow-md shadow-green-150"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "absent")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "absent"
                          ? "bg-red-500 text-white shadow-md shadow-red-150"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(extraKey, "cancelled")}
                      className={`flex-1 py-1.5 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                        currentStatus === "cancelled"
                          ? "bg-slate-400 text-white shadow-md shadow-slate-100"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
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

      {/* Subject-Wise Analytics Section */}
      <section className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="flex flex-col gap-1.5 mb-5">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            Subject Attendance Analytics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Visual metrics tracker for all registered courses. Safe threshold is <b className="text-indigo-600 dark:text-indigo-400 font-extrabold">85%</b> of Conducted Lectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="subject-wise-progress-container">
          {data.subjects.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-slate-400">
              No registered subjects to analyze. Configure your timetable first.
            </div>
          ) : (
            data.subjects.map((sub) => {
              const stats = calculateSubjectStats(sub, data.records, data.extraClasses);
              const isSafe = stats.percentage >= 85;
              
              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 min-h-[140px] transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 pr-1">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug">
                        {sub.name}
                      </h4>
                      <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {sub.code}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[14px] font-black px-2.5 py-1 rounded-md tracking-wider ${
                        isSafe
                          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800/60"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                      }`}>
                        {stats.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full">
                    <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2.5 mt-1 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSafe ? "bg-green-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, stats.percentage)}%` }}
                      />
                    </div>

                    {/* Details list below progress bar */}
                    <div className="flex items-center justify-between text-xs mt-3 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span>
                        Conducted: <strong className="text-slate-900 dark:text-slate-50 font-black">{stats.totalActive}</strong>
                      </span>
                      <span className="w-1 h-3 border-l border-slate-300 dark:border-slate-800" />
                      <span>
                        Present: <strong className="text-green-600 dark:text-green-400 font-black">{stats.presentCount}</strong>
                      </span>
                      <span className="w-1 h-3 border-l border-slate-300 dark:border-slate-800" />
                      <span>
                        Absent: <strong className="text-red-500 dark:text-red-400 font-black">{stats.absentCount}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
