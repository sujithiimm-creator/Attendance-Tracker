import React, { useState } from "react";
import { Subject } from "../../types";
import { X, Calendar, Clock, BookOpen, AlertCircle, Check } from "lucide-react";
import { getLocalDateString } from "../../lib/helpers";

interface AddExtraClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (extra: any) => Promise<void>;
  subjects: Subject[];
}

export default function AddExtraClassModal({
  isOpen,
  onClose,
  onSave,
  subjects,
}: AddExtraClassModalProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [time, setTime] = useState("2:30–4:00 PM");
  const [note, setNote] = useState("Rm 305 · Extra make-up class");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !date || !time) return;

    setIsSaving(true);
    try {
      await onSave({
        subjectId,
        date,
        time: time.trim(),
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xxs animate-fade-in">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom sheet panel */}
      <div 
        id="extra-class-modal-content"
        className="relative w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up duration-300"
      >
        {/* Drag handle decoration */}
        <div className="mx-auto my-3 w-12 h-1.5 bg-slate-200 rounded-full shrink-0" />

        {/* Header */}
        <div className="px-5 pb-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>Schedule Extra Class</span>
          </h3>
          <button 
            id="extra-class-modal-close"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4 overflow-y-auto">
          {subjects.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-2 text-center text-amber-700 text-xs">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <span>Create at least one subject under the <b>Subjects</b> tab before scheduling an extra class.</span>
            </div>
          ) : (
            <>
              {/* Select Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Linked Course Module</span>
                </label>
                <select
                  id="extra-subj-select"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white text-slate-800 font-medium transition"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1 cursor-pointer" htmlFor="extra-date">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar Date</span>
                </label>
                <input
                  id="extra-date"
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white text-slate-800 transition"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1" htmlFor="extra-time">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lecture Timing Window</span>
                </label>
                <input
                  id="extra-time"
                  type="text"
                  placeholder="e.g. 2:30–4:00 PM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white text-slate-700 transition"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 cursor-pointer" htmlFor="extra-notes">
                  Additional Notes (Location / Instructor)
                </label>
                <input
                  id="extra-notes"
                  type="text"
                  placeholder="e.g. Rm 305 · Prof. Name · Makeup class"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white text-slate-700 transition"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-4 border-t border-slate-100 pt-4">
                <button
                  id="extra-modal-cancel"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="extra-modal-save"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-150"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Create Class</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
