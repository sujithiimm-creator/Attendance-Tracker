import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { Subject } from "../types";
import { getLocalDateString, DAY_SHORT_NAMES, DAY_NAMES, getDaySessions } from "../lib/helpers";
import { COURSES, SECTIONS, Course, Session } from "../lib/coursesData";
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
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  MapPin, 
  User, 
  Clock, 
  Bell, 
  Settings2, 
  Lock, 
  Check, 
  Sparkles, 
  Copy, 
  Share2, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";

// Day Map utility
const DAY_MAP_INDICES: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

function generateCode(name: string): string {
  if (name === "Data Analytics and Knowledge Management") return "DAKM";
  if (name === "Digital and Cyber Physical System") return "DCPS";
  if (name === "Enterprise Digital Transformation") return "EDT";
  if (name === "Intelligent Enterprise") return "IE";
  if (name === "Reinforcement Learning: Theory and Applications") return "RL";

  if (name === "ESG Frameworks and Standards") return "ESG";
  if (name === "Energy efficiency, net Zero and Climate Change Management") return "NZCC";
  if (name === "Operational Excellence") return "OPEX";
  if (name === "Strategic Sourcing") return "SOUR";
  if (name === "Sustainable Supply chain Management") return "SSCM";

  if (name === "Business Ethics") return "ETHIC";

  if (name === "Advanced SCM with Artificial Intelligence") return "ASCM";
  if (name === "Building and Leading Teams in Entrepreneurial Ventures") return "TEAM";
  if (name === "Business Consulting and Innovation") return "CONS";
  if (name === "Competency Assessment And Development") return "COMP";
  if (name === "Merger & Acquisition") return "M&A";

  if (name === "Business Dynamics and System Simulation") return "BDSS";
  if (name === "Interconnected Logistics") return "IL";
  if (name === "Next-Gen Facility Planning: Analytics, AI, and Automation") return "FACIL";
  if (name === "Prescriptive Analytics: Operations & Supply Chain Networks") return "PA";
  if (name === "Smart Service Systems: Operations for the Digital Age") return "SMART";

  if (name === "AI-Powered Financial Decision Architecture") return "AIFD";
  if (name === "Investment Strategies And Portfolio Management") return "ISPM";
  if (name === "Private Equity and Venture Finance") return "PEVF";
  if (name === "Square Foot Economics") return "SFE";
  if (name === "Strategic Cost Management") return "SCM";
  if (name === "Supply Chain Finance") return "SCF";

  if (name === "Product Management") return "PM";
  if (name === "Leadership Development") return "LD";
  if (name === "Strategic Management") return "SM";
  if (name === "Sustainable Development for Business") return "SDB";
  if (name === "Environmental Impact Assessment") return "EIA";
  if (name === "Operations Strategy") return "OPS";
  if (name === "Sustainable Strategic Management") return "SSM";

  // Fallback initialism
  return name
    .split(/[\s\-&]+/)
    .filter(w => !["and", "for", "the", "with", "of", "in"].includes(w.toLowerCase()))
    .map(w => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 5);
}

// Convert a Course object from coursesData to the internal Subject interface
function mapCourseToSubject(course: Course): Subject {
  const days: number[] = [];
  const dayTimes: { [dayIndex: string]: string } = {};

  course.sessions.forEach((s: Session) => {
    const dayIndex = DAY_MAP_INDICES[s.day];
    if (dayIndex !== undefined) {
      if (!days.includes(dayIndex)) {
        days.push(dayIndex);
      }
      
      const newTime = `${s.start}–${s.end}`;
      const newRoom = `Rm ${s.room}`;
      const newFaculty = s.faculty || course.faculty?.join(', ') || 'Staff';
      const keyStr = String(dayIndex);

      if (dayTimes[keyStr]) {
        // Appending additional session on same day
        const existing = dayTimes[keyStr];
        const parts = existing.split(" · ");
        const existingTimes = parts[0] || "";
        const existingRoom = parts[1] || "";
        const existingFaculty = parts[2] || "";

        if (existingRoom === newRoom && existingFaculty === newFaculty) {
          dayTimes[keyStr] = `${existingTimes} & ${newTime} · ${existingRoom} · ${existingFaculty}`;
        } else {
          dayTimes[keyStr] = `${existing} & ${newTime} · ${newRoom} · ${newFaculty}`;
        }
      } else {
        dayTimes[keyStr] = `${newTime} · ${newRoom} · ${newFaculty}`;
      }
    }
  });

  return {
    id: `course_${course.id}`,
    name: course.course,
    code: generateCode(course.course),
    days: days.sort((a, b) => a - b),
    dayTimes,
  };
}

export default function TimetableView() {
  const { data, setSubjects } = useData();

  // Mode: if there are no subjects, open in Builder mode directly to guide the user.
  const hasSubjects = data && data.subjects && data.subjects.length > 0;
  const [isBuilderMode, setIsBuilderMode] = useState<boolean>(!hasSubjects);

  // Builder States
  const [selectedSection, setSelectedSection] = useState<string>("D");
  const [selectedElectives, setSelectedElectives] = useState<number[]>([0, 23, 55, 59]); // Defaults matching some D choices
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Parse location hash on load to recover selections
  useEffect(() => {
    const parseHash = () => {
      const h = window.location.hash.replace(/^#/, "").trim();
      if (!h) return;
      
      const tokens = h.split(",").map(t => t.trim());
      let sec = "D";
      const electives: number[] = [];
      
      tokens.forEach((t) => {
        if (/^[a-iA-I]$/.test(t)) {
          sec = t.toUpperCase();
        } else {
          const id = parseInt(t, 10);
          if (!isNaN(id)) {
            electives.push(id);
          }
        }
      });
      
      setSelectedSection(sec);
      // Filter out any core course IDs from elective list just in case
      const coreIds = SECTIONS[sec] || [];
      const electiveIdsOnly = electives.filter(id => !coreIds.includes(id));
      setSelectedElectives(electiveIdsOnly);
      
      setToastMessage(`Parsed timetable configuration from URL: Section ${sec} and ${electiveIdsOnly.length} Electives loaded!`);
    };

    parseHash();
    
    // Watch hash change
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, []);

  // Sync hash in background as states modify
  const getActiveHashParts = () => {
    const parts = [selectedSection];
    const sortedElectives = [...selectedElectives].sort((a, b) => a - b);
    sortedElectives.forEach(id => parts.push(String(id)));
    
    // Add core subjects too
    const coreIds = SECTIONS[selectedSection] || [];
    coreIds.forEach(id => parts.push(String(id)));
    
    return parts.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) && !isNaN(numB)) return -1;
      if (!isNaN(numA) && isNaN(numB)) return 1;
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  const getShareableUrl = () => {
    const parts = getActiveHashParts();
    return `${window.location.origin}${window.location.pathname}#${parts.join(",")}`;
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage("Shareable URL copied! Paste in a new tab to test.");
    }).catch(() => {
      alert(`Could not copy automatically. Here is your URL:\n${url}`);
    });
  };

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!data) return null;

  // Active state choices mapped: Core IDs of active section + selected electives
  const activeCoreIds = SECTIONS[selectedSection] || [];
  const currentSelections = [...activeCoreIds, ...selectedElectives];

  // Resolve raw Courses selected
  const activeBuildCourses = COURSES.filter(c => currentSelections.includes(c.id));

  // Handle elective choice selection
  const handleToggleElective = (courseId: number, slot: number) => {
    // Check if slot is already occupied
    const slotCourses = COURSES.filter(c => c.slot === slot);
    const slotCourseIds = slotCourses.map(c => c.id);
    
    // Under this slot, is another course already active?
    const alreadySelected = selectedElectives.find(id => slotCourseIds.includes(id));
    
    if (alreadySelected === courseId) {
      // De-select
      setSelectedElectives(prev => prev.filter(id => id !== courseId));
    } else {
      // Replace or Add
      setSelectedElectives(prev => {
        const filtered = prev.filter(id => !slotCourseIds.includes(id));
        return [...filtered, courseId];
      });
    }
  };

  // Submit build to Firestore/DataContext
  const handleConfirmAndSync = async () => {
    const mappedSubjects = activeBuildCourses.map(mapCourseToSubject);
    
    try {
      await setSubjects(mappedSubjects);
      setToastMessage(`🎉 Timetable applied successfully! Roster updated with Section ${selectedSection} core classes and ${selectedElectives.length} electives.`);
      setIsBuilderMode(false); // return to normal schedule stream
    } catch (e: any) {
      setToastMessage(`⚠️ Error syncing timetable: ${e.message}`);
    }
  };

  // RENDER BUILDER MODE
  if (isBuilderMode) {
    // Group elective COURSES by slot
    const electiveSlots = [1, 2, 4, 9, 10, 13];
    
    return (
      <div className="flex flex-col gap-6" id="timetable-builder-main-wrapper">
        
        {/* Toast Notifier */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Builder Panel Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12">
            <Settings2 className="w-64 h-64" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-xxs font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-800/60 px-2.5 py-1 rounded-full border border-indigo-700">
                IIM Mumbai · Module 5
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2.5">
                Timetable Configurator
              </h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                Configure your Cohort Section to load core subjects automatically, then select matching electives for each time slot with conflict checks.
              </p>
            </div>
            
            {hasSubjects && (
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBuilderMode(false)}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Setup panel: Cohort & Electives */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. SECTIONS COHORT */}
            <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
              <div>
                <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Step 1</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Select Section Cohort</h3>
                <p className="text-xxs text-slate-400 mt-0.5">
                  Selecting a cohort automatically locks the required core lectures in Slots 3, 5, 6, 7 or 8.
                </p>
              </div>

              {/* Grid of cohort selections */}
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {Object.keys(SECTIONS).map((cohort) => {
                  const isSelected = selectedSection === cohort;
                  return (
                    <button
                      key={cohort}
                      type="button"
                      onClick={() => {
                        setSelectedSection(cohort);
                        // Clean up any electrics that might be in SECTIONS
                        setSelectedElectives(prev => prev.filter(id => !SECTIONS[cohort].includes(id)));
                      }}
                      className={`py-3.5 px-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-700 text-white font-extrabold shadow-sm scale-[1.03]"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold"
                      }`}
                    >
                      <span className="text-sm block">Cohort {cohort}</span>
                    </button>
                  );
                })}
              </div>

              {/* Core subjects loaded under selected section */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col gap-2.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Locked Core Modules for Section {selectedSection}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeCoreIds.map((id) => {
                    const c = COURSES.find(item => item.id === id);
                    if (!c) return null;
                    return (
                      <div 
                        key={id}
                        className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-1 shadow-xxs relative overflow-hidden"
                      >
                        <div className="absolute right-2 top-2 p-1 bg-slate-50 border border-slate-100 rounded-md">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <span className="text-[10px] text-indigo-600 font-extrabold uppercase bg-indigo-50 px-1.5 py-0.5 rounded w-fit tracking-wide">
                          Slot {c.slot}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 mt-1 pr-4">{c.course}</h4>
                        <span className="text-[9.5px] text-slate-400 truncate">{c.faculty?.join(', ') || 'Faculty'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. SELECT ELECTIVES GROUP BY STAGED SLOTS */}
            <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-5">
              <div>
                <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Step 2</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Select Elective Modules</h3>
                <p className="text-xxs text-slate-400 mt-0.5">
                  Pick exactly one elective course per timing slot. Selected lectures are scheduled dynamically.
                </p>
              </div>

              <div className="flex flex-col gap-6" id="timetable-electives-slots-panels">
                {electiveSlots.map((slot) => {
                  const slotCourses = COURSES.filter(c => c.slot === slot);
                  if (slotCourses.length === 0) return null;

                  // Find which ID in this slot is active (if any)
                  const chosenCourseId = selectedElectives.find(id => slotCourses.map(c => c.id).includes(id));

                  return (
                    <div key={slot} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg">
                          Slot {slot} Electives
                        </span>
                        
                        {chosenCourseId !== undefined ? (
                          <span className="text-[10.5px] font-bold text-indigo-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Checked
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic">
                            None selected
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {slotCourses.map((c) => {
                          const isPicked = selectedElectives.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleToggleElective(c.id, slot)}
                              className={`text-left p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition relative group ${
                                isPicked
                                  ? "bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-xxs ring-1 ring-indigo-300/30"
                                  : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5 w-full">
                                <h4 className={`text-xs font-extrabold leading-snug line-clamp-2 ${isPicked ? 'text-indigo-800' : 'text-slate-800'}`}>
                                  {c.course}
                                </h4>
                                <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition ${
                                  isPicked 
                                    ? "bg-indigo-600 border-indigo-700 text-white" 
                                    : "border-slate-300 group-hover:border-slate-400"
                                }`}>
                                  {isPicked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 shrink-0 font-medium">
                                Instructor: {c.faculty?.join(', ') || 'Professor'}
                              </span>

                              {/* Small timing pills for preview */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {c.sessions.map((sess, sidx) => (
                                  <span key={sidx} className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                                    isPicked ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-550 text-slate-500'
                                  }`}>
                                    {DAY_SHORT_NAMES[DAY_MAP_INDICES[sess.day]]} {sess.start}-{sess.end}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Live hash builder, Copy link, Confirm CTAs */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
            
            {/* HASH RESOLUTION TOOLBOX */}
            <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
              <div>
                <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Sync Dashboard</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">Roster Sync & URL Export</h3>
              </div>

              {/* Selected List Summary */}
              <div className="flex flex-col gap-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-slate-500">Selected Cohort</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xxs uppercase">
                    Section {selectedSection}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-slate-500">Core Subjects</span>
                  <span className="font-bold text-slate-700">
                    {activeCoreIds.length} Modules
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-slate-500">Electives</span>
                  <span className="font-bold text-slate-700">
                    {selectedElectives.length} Modules
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="font-black text-slate-700 uppercase">Total Courses</span>
                  <span className="font-black text-indigo-600 text-sm">
                    {activeBuildCourses.length} Lectures
                  </span>
                </div>
              </div>

              {/* Dynamic Hash Display */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Generated Timetable URL Hash
                </span>
                <div className="bg-slate-900 text-slate-300 font-mono text-xxs p-3 rounded-xl border border-slate-800 break-all select-all flex items-start gap-2 h-fit">
                  <span className="flex-1 text-slate-400">
                    #{getActiveHashParts().join(",")}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndSync}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-350 fill-amber-350" />
                  Confirm Timetable & Sync
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copy Shareable URL Link
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW WEEK CALENDAR IN BUILDER PANEL */}
            <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
              <div>
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Live Builder Grid</span>
                <h3 className="text-xs font-extrabold text-slate-800">Visual Week Construction</h3>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {WEEKDAY_ORDER.map((dayIndex) => {
                  const dayName = DAY_SHORT_NAMES[dayIndex];
                  
                  // Filter courses matching this weekday
                  const weekdayLectures: { course: Course; session: Session }[] = [];
                  activeBuildCourses.forEach(c => {
                    c.sessions.forEach(s => {
                      if (DAY_MAP_INDICES[s.day] === dayIndex) {
                        weekdayLectures.push({ course: c, session: s });
                      }
                    });
                  });

                  return (
                    <div key={dayIndex} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-2">
                      <span className="text-[10px] font-black text-slate-400 w-8 text-center bg-white border border-slate-200 rounded-xl py-2 shrink-0">
                        {dayName}
                      </span>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        {weekdayLectures.length === 0 ? (
                          <span className="text-[9px] text-slate-350 italic py-1 pl-1">No lectures</span>
                        ) : (
                          weekdayLectures.map(({ course, session }, idx) => (
                            <div 
                              key={idx}
                              title={`${course.course} | Slot ${course.slot}`}
                              className="bg-white border border-slate-150 rounded-lg py-1 px-2 text-[9px] flex items-center justify-between gap-1.5"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-indigo-700 truncate">{course.course}</span>
                                <span className="text-[8.5px] text-slate-400">Rm {session.room} · {session.faculty}</span>
                              </div>
                              <span className="text-[8.5px] font-black text-slate-500 bg-slate-100 rounded px-1 shrink-0">
                                {session.start}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // STANDARD INACTIVE VIEW: CURRENT SELECTED ROSTER ATTENDANCE CALENDAR
  const todayISO = getLocalDateString(new Date());

  // Upcoming extra classes sorted by date ascending
  const upcomingExtras = data.extraClasses
    .filter((ex) => ex.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="timetable-standard-roster-deck">
      
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Toggle bar to go to builder */}
        <div className="bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Enrolled subjects count</span>
              <h4 className="text-sm font-extrabold text-slate-800">
                You have {data.subjects.length} modules configured on your roster.
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBuilderMode(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-xl text-xs font-extrabold transition"
          >
            Reconfigure Timetable
          </button>
        </div>

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
                const daySessions = data.subjects
                  .filter((sub) => sub.days.includes(dayIndex))
                  .flatMap((sub) => getDaySessions(sub, dayIndex));

                return (
                  <div
                    key={dayIndex}
                    className="flex flex-col gap-2 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 min-h-[140px]"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center border-b border-slate-200/40 pb-1.5 mb-1 block">
                      {dayName}
                    </span>
                    
                    <div className="flex flex-col gap-1.5 flex-1">
                      {daySessions.length === 0 ? (
                        <span className="text-[9px] text-slate-350 italic text-center my-auto leading-tight">
                          No lectures
                        </span>
                      ) : (
                        daySessions.map((sess) => {
                          const sub = sess.subject;
                          const subIndex = data.subjects.findIndex((s) => s.id === sub.id);
                          const theme = getSubjectColor(subIndex);
                          return (
                            <div
                              key={sess.key}
                              title={`${sub.name} - ${sess.timeString} · ${sess.room} · ${sess.faculty}`}
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
                No subjects registered yet. Config your schedule under the Timetable Builder tab!
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
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">
                          {sub.name}
                        </h4>
                      </div>

                      {/* Show time details per day */}
                      <div className="flex flex-col gap-1.5 mt-1 pr-1">
                        {sub.days.map((dVal) => {
                          const sessions = getDaySessions(sub, dVal);
                          return (
                            <div key={dVal} className="flex flex-col gap-1">
                              {sessions.map((sess, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span className="font-bold text-slate-400 shrink-0 w-8">
                                    {sIdx === 0 ? DAY_SHORT_NAMES[dVal] : ""}
                                  </span>
                                  <span className="truncate">
                                    {sess.timeString} · <span className="font-semibold text-slate-400">{sess.room}</span>{sess.faculty ? ` · ${sess.faculty}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
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
        
        {/* URL Export directly in deck */}
        {hasSubjects && (
          <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col gap-3.5">
            <div>
              <span className="text-xxs font-bold text-indigo-600 uppercase tracking-wider block">Share structure</span>
              <h3 className="text-xs font-extrabold text-slate-805 text-slate-800">Export Active Timetable Hash</h3>
            </div>
            <p className="text-xxs text-slate-400 leading-normal">
              Copy this link to back up your timetable or share this configuration with classmate sections.
            </p>
            
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold w-full transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Copy Shareable Link
            </button>
          </div>
        )}

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
                const sub = data.subjects.find((s) => s.id === ex.subjectId || `course_${ex.subjectId}` === s.id);
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
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                        {formattedDate}
                      </span>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1 pl-1 mt-1">{sub.name}</h4>
                    
                    <div className="flex items-start gap-3 text-[10.5px] text-slate-500 mt-1 pl-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ex.time}</span>
                      </div>
                      {ex.note && (
                        <span className="text-slate-400 truncate flex-1 border-l border-slate-200 pl-3">
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
