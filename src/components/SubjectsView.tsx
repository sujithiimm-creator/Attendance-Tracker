import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Subject, ExtraClass } from "../types";
import { calculateSubjectStats, DAY_SHORT_NAMES, DAY_NAMES } from "../lib/helpers";
import { Plus, Edit2, Trash2, CalendarPlus, Clock, LayoutGrid, HelpCircle, AlertCircle } from "lucide-react";
import AddEditSubjectModal from "./modals/AddEditSubjectModal";
import AddExtraClassModal from "./modals/AddExtraClassModal";

// Helper for status colors
export function getStatusColorHex(percentage: number): string {
  if (percentage >= 85) return "#22c55e"; // Green
  if (percentage >= 70) return "#f59e0b"; // Amber (warning)
  return "#ef4444"; // Red
}

export function getStatusColorTextClass(percentage: number): string {
  if (percentage >= 85) return "text-green-600 bg-green-50/50 border-green-150";
  if (percentage >= 70) return "text-amber-600 bg-amber-50/50 border-amber-150";
  return "text-red-600 bg-red-50/50 border-red-150";
}

export default function SubjectsView() {
  const { data, addSubject, updateSubject, deleteSubject, addExtraClass, deleteExtraClass } = useData();

  const [activeSubjectToEdit, setActiveSubjectToEdit] = useState<Subject | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

  if (!data) return null;

  const handleOpenNewSubject = () => {
    setActiveSubjectToEdit(null);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setActiveSubjectToEdit(sub);
    setIsSubModalOpen(true);
  };

  const handleSubjectSave = async (payload: any) => {
    if (payload.id) {
      await updateSubject(payload as Subject);
    } else {
      await addSubject(payload);
    }
  };

  const handleDeleteSubjectClick = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will permanently clean up all associated lecture records and extra classes.`)) {
      await deleteSubject(id);
    }
  };

  const handleExtraClassSave = async (payload: any) => {
    await addExtraClass(payload);
  };

  const handleDeleteExtraClass = async (id: string) => {
    if (confirm("Are you sure you want to cancel and delete this extra class?")) {
      await deleteExtraClass(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* View Header with Add button */}
      <div className="flex items-center justify-between" id="subjects-view-header">
        <div>
          <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Course Catalog</span>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5">Manage Subjects</h2>
        </div>
        
        <button
          id="btn-add-subject"
          type="button"
          onClick={handleOpenNewSubject}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition flex items-center justify-center gap-1.5 font-bold text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Roster layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="subjects-cards-list">
        {data.subjects.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3 col-span-full">
            <LayoutGrid className="w-10 h-10 text-slate-350" />
            <h4 className="text-sm font-extrabold text-slate-700">No subjects registered</h4>
            <p className="text-xs text-slate-400 max-w-[2400px]">
              Add your MBA courses to start logging attendance percentages and timetable details.
            </p>
          </div>
        ) : (
          data.subjects.map((sub) => {
            const stats = calculateSubjectStats(sub, data.records, data.extraClasses);
            
            // Circular SVG properties for visual ring
            const radius = 28;
            const strokeWidth = 4.5;
            const normalizedRadius = radius - strokeWidth * 2;
            const circumference = normalizedRadius * 2 * Math.PI;
            const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;
 
            const ringColor = getStatusColorHex(stats.percentage);
            const statusBadgeTextClass = getStatusColorTextClass(stats.percentage);

            // Fetch extra classes tied to this specific subject
            const relatedExtras = data.extraClasses.filter((ex) => ex.subjectId === sub.id);

            return (
              <div
                key={sub.id}
                id={`subject-card-${sub.id}`}
                className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Main Content Body */}
                <div className="p-5 flex gap-4 items-center justify-between">
                  
                  {/* Left part: Title & timing briefs */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded uppercase">
                        {sub.code}
                      </span>
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-800 tracking-tight mt-1.5 leading-tight line-clamp-1">
                      {sub.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Days:</span>
                      {sub.days.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic font-medium">None set</span>
                      ) : (
                        sub.days.map((dIndex) => (
                          <span
                            key={dIndex}
                            className="bg-slate-50 border border-slate-150 text-slate-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded"
                          >
                            {DAY_SHORT_NAMES[dIndex]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right part: Circular SVG Progress Indicator */}
                  <div className="relative flex items-center justify-center shrink-0 w-16 h-16" title={`Attendance is ${stats.percentage.toFixed(1)}%`}>
                    <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                      <circle
                        stroke="#f8fafc"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                      />
                      <circle
                        stroke={ringColor}
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
                      <span className="text-[11px] font-black text-slate-800 leading-none">
                        {Math.round(stats.percentage)}%
                      </span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase leading-none mt-1">
                        Att.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics counts bar */}
                <div className="px-5 py-3 bg-slate-50 border-t border-b border-slate-100 grid grid-cols-4 text-center text-[10px]">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800">{stats.presentCount}</span>
                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Present</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-100">
                    <span className="font-extrabold text-slate-800">{stats.absentCount}</span>
                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Absent</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-100">
                    <span className="font-extrabold text-slate-450 text-slate-500">{stats.cancelledCount}</span>
                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Cancelled</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-100 items-center justify-center">
                    <span className={`font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeTextClass}`}>
                      {stats.percentage >= 85 ? "Safe" : "Low"}
                    </span>
                  </div>
                </div>

                {/* Sublist: Extra Lectures related to this course */}
                {relatedExtras.length > 0 && (
                  <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Scheduled Extra Classes ({relatedExtras.length})
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-none">
                      {relatedExtras.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between text-[10px] bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-600"
                        >
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="font-extrabold text-slate-800">
                              {new Date(ex.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} @ {ex.time}
                            </span>
                            {ex.note && <span className="text-[9px] text-slate-400 truncate mt-0.5">{ex.note}</span>}
                          </div>
                          
                          <button
                            type="button"
                            title="Cancel Extra Class"
                            onClick={() => handleDeleteExtraClass(ex.id)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Controls: Edit, Add extra session, Delete */}
                <div className="bg-slate-50/20 px-5 py-2.5 flex items-center justify-between gap-3 h-11 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSubject(sub)}
                    className="text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 text-[10px] font-bold transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExtraModalOpen(true)}
                    className="text-slate-500 hover:text-amber-600 flex items-center gap-1.5 text-[10px] font-bold transition"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Schedule Makeup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubjectClick(sub.id, sub.name)}
                    className="text-slate-400 hover:text-red-600 flex items-center gap-1.5 text-[10px] font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals Mounting */}
      <AddEditSubjectModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSave={handleSubjectSave}
        subjectToEdit={activeSubjectToEdit}
      />

      <AddExtraClassModal
        isOpen={isExtraModalOpen}
        onClose={() => setIsExtraModalOpen(false)}
        onSave={handleExtraClassSave}
        subjects={data.subjects}
      />
    </div>
  );
}
