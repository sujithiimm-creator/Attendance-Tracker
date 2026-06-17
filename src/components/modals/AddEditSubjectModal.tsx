import React, { useState, useEffect } from "react";
import { Subject } from "../../types";
import { X, Check } from "lucide-react";

interface AddEditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: any) => Promise<void>;
  subjectToEdit?: Subject | null;
}

const DAYS_REF = [
  { val: 1, label: "Mon" },
  { val: 2, label: "Tue" },
  { val: 3, label: "Wed" },
  { val: 4, label: "Thu" },
  { val: 5, label: "Fri" },
  { val: 6, label: "Sat" },
  { val: 0, label: "Sun" },
];

const standardSlots = [
  "9:30 am to 11:00 am",
  "11:10 am to 12:40 pm",
  "12:50 pm to 14:20 pm",
  "14:30 to 16:00",
  "16:10 to 17:40",
  "17:45 to 18:15",
  "18:20 to 19:50",
  "20:00 to 21:30"
];

function parseSchedule(valStr: string) {
  if (!valStr) {
    return {
      slot: "9:30 am to 11:00 am",
      room: "Rm 206",
      staff: "Prof. Date",
      customSlot: ""
    };
  }
  const parts = valStr.split(" · ").map(p => p.trim());
  const rawSlot = parts[0] || "9:30 am to 11:00 am";
  const room = parts[1] || "Rm 206";
  const staff = parts[2] || "Prof. Date";

  const matched = standardSlots.find(s => 
    s.toLowerCase().replace(/[\s–-]/g, "") === rawSlot.toLowerCase().replace(/[\s–-]/g, "")
  );

  return {
    slot: matched ? matched : "Custom",
    customSlot: matched ? "" : rawSlot,
    room,
    staff
  };
}

export default function AddEditSubjectModal({
  isOpen,
  onClose,
  onSave,
  subjectToEdit,
}: AddEditSubjectModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayTimes, setDayTimes] = useState<{ [dayIndex: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setCode(subjectToEdit.code);
      setSelectedDays(subjectToEdit.days || []);
      setDayTimes(subjectToEdit.dayTimes || {});
    } else {
      setName("");
      setCode("");
      setSelectedDays([]);
      setDayTimes({});
    }
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
      const newTimes = { ...dayTimes };
      delete newTimes[String(dayVal)];
      setDayTimes(newTimes);
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
      setDayTimes({
        ...dayTimes,
        [String(dayVal)]: "9:30 am to 11:00 am · Rm 206 · Prof. Date",
      });
    }
  };

  const updateDayTime = (dayVal: number, newSlot: string, newCustomSlot: string, newRoom: string, newStaff: string) => {
    const finalSlot = newSlot === "Custom" ? newCustomSlot : newSlot;
    const finalStr = `${finalSlot} · ${newRoom} · ${newStaff}`;
    setDayTimes({
      ...dayTimes,
      [String(dayVal)]: finalStr
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || selectedDays.length === 0) return;

    setIsSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        days: selectedDays,
        dayTimes: dayTimes,
      };
      if (subjectToEdit) {
        payload.id = subjectToEdit.id;
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-xxs">
      {/* Background click close handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Bottom sheet / popup panel */}
      <div 
        id="subject-modal-content"
        className="relative w-full max-w-[430px] md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up duration-300"
      >
        {/* Drag handle decoration (only visible/styled on mobile) */}
        <div className="mx-auto my-3 w-12 h-1.5 bg-slate-200 rounded-full shrink-0 md:hidden" />
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            {subjectToEdit ? "Edit Subject Details" : "Add New Subject"}
          </h3>
          <button 
            id="subject-modal-close"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.55">
            <label className="text-xs font-semibold text-slate-500" htmlFor="subj-name">
              Subject Name
            </label>
            <input
              id="subj-name"
              type="text"
              placeholder="e.g. Data Analytics & Knowledge Management"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition text-slate-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500" htmlFor="subj-code">
              Subject Code (Abbreviation)
            </label>
            <input
              id="subj-code"
              type="text"
              placeholder="e.g. DAKM"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition text-slate-800"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          {/* Day selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">
              Days of the Week
            </label>
            <div className="flex flex-wrap gap-2" id="days-selector-pills">
              {DAYS_REF.map((day) => {
                const isSelected = selectedDays.includes(day.val);
                return (
                  <button
                    key={day.val}
                    id={`day-pill-${day.val}`}
                    type="button"
                    onClick={() => toggleDay(day.val)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      isSelected
                        ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-150"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time fields based on selected days */}
          {selectedDays.length > 0 && (
            <div className="flex flex-col gap-4 mt-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-600 block">
                Class Schedule & Instructor Setup
              </span>
              
              {selectedDays.map((dayVal) => {
                const dayRef = DAYS_REF.find((d) => d.val === dayVal);
                const currentTimeStr = dayTimes[String(dayVal)] || "9:30 am to 11:00 am · Rm 206 · Prof. Date";
                const { slot, customSlot, room, staff } = parseSchedule(currentTimeStr);

                return (
                  <div key={dayVal} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-extrabold text-indigo-600 border-b border-slate-200/50 pb-1.5">
                      {dayRef?.label} Schedule
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Drop-down Timing */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Timing Window
                        </label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-450 focus:border-indigo-400 transition text-slate-700"
                          value={slot}
                          onChange={(e) => updateDayTime(dayVal, e.target.value, customSlot, room, staff)}
                        >
                          {standardSlots.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          <option value="Custom">Custom Timing...</option>
                        </select>
                      </div>

                      {/* Custom Input */}
                      {slot === "Custom" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Enter Timing
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 10:00 am to 11:30 am"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 transition text-slate-700"
                            value={customSlot}
                            onChange={(e) => updateDayTime(dayVal, "Custom", e.target.value, room, staff)}
                            required
                          />
                        </div>
                      )}

                      {/* Room Location */}
                      <div className="flex flex-col gap-1 border-transparent">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Classroom Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rm 206"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 transition text-slate-700"
                          value={room}
                          onChange={(e) => updateDayTime(dayVal, slot, customSlot, e.target.value, staff)}
                          required
                        />
                      </div>

                      {/* Instructor/Professor */}
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Professor / Staff Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Prof. Date"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 transition text-slate-700"
                          value={staff}
                          onChange={(e) => updateDayTime(dayVal, slot, customSlot, room, e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end mt-4 border-t border-slate-100 pt-4 pb-2">
            <button
              id="sub-modal-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              id="sub-modal-save"
              type="submit"
              disabled={isSaving || !name || !code || selectedDays.length === 0}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-100"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {subjectToEdit ? "Update Subject" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
