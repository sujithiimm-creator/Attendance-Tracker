import { Subject, ExtraClass, UserDocument, AttendanceStatus } from "../types";

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "sub_dakm", name: "Data Analytics & Knowledge Management", code: "DAKM", days: [1,2],
    dayTimes: { "1": "9:30–11:00 AM · Rm 206 · Prof. Hema Date", "2": "11:10 AM–12:40 PM · Rm 206 · Prof. Hema Date" } },
  { id: "sub_il", name: "Interconnected Logistics", code: "IL", days: [5],
    dayTimes: { "5": "9:30–11:00 AM & 11:10 AM–12:40 PM · Rm 207 · Prof. Vijaya Kumar Manupati" } },
  { id: "sub_ma", name: "Mergers & Acquisition", code: "M&A", days: [1,2],
    dayTimes: { "1": "4:10–5:40 PM · Rm 207 · Prof. Atul Bhat", "2": "4:10–5:40 PM · Rm 207 · Prof. Atul Bhat" } },
  { id: "sub_aifd", name: "AI-Powered Financial Decision Architecture", code: "AIFD", days: [5],
    dayTimes: { "5": "2:30–4:00 PM & 4:10–5:40 PM · Rm 305 · Mr. Pallav Agarwal" } },
  { id: "sub_sm", name: "Strategic Management", code: "SM", days: [3,4],
    dayTimes: { "3": "2:30–4:00 PM · Rm 207 · Prof. Utpal Chattopadhyay", "4": "2:30–4:00 PM · Rm 207 · Prof. Utpal Chattopadhyay" } },
  { id: "sub_ld", name: "Leadership Development", code: "LD", days: [3,4],
    dayTimes: { "3": "4:10–5:40 PM · Rm 202 · Prof. Sumi Jha", "4": "4:10–5:40 PM · Rm 202 · Prof. Sumi Jha" } },
];

// Helper to get formatted ISO date "YYYY-MM-DD" adjusted to local time timezone offset
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convert "YYYY-MM-DD" string back to local Date object
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Get the Monday of the week that contains the given date
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // day: 0=Sun, 1=Mon, ..., 6=Sat
  // We want to calculate the difference to Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Generate the 7 days of the week starting Sunday/Monday. Let's do Mon-Sun weekly view.
export function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

// Excludes "cancelled" indices
export interface SubjectStats {
  subjectId: string;
  code: string;
  name: string;
  presentCount: number;
  absentCount: number;
  cancelledCount: number;
  totalActive: number;
  percentage: number; // 0 to 100
}

export function calculateSubjectStats(
  subject: Subject,
  records: UserDocument["records"],
  extraClasses: ExtraClass[]
): SubjectStats {
  let presentCount = 0;
  let absentCount = 0;
  let cancelledCount = 0;

  // Find extra classes for this subject
  const subjectExtras = extraClasses.filter(ex => ex.subjectId === subject.id);
  const extraIdsSet = new Set(subjectExtras.map(ex => ex.id));

  // Loop through all dates in records
  Object.entries(records).forEach(([dateIso, record]) => {
    Object.entries(record).forEach(([key, status]) => {
      // Key is either subjectId (regular class) or extra_${extraId}
      if (key === subject.id) {
        if (status === "present") presentCount++;
        else if (status === "absent") absentCount++;
        else if (status === "cancelled") cancelledCount++;
      } else if (key.startsWith("extra_")) {
        const extraId = key.replace("extra_", "");
        if (extraIdsSet.has(extraId)) {
          if (status === "present") presentCount++;
          else if (status === "absent") absentCount++;
          else if (status === "cancelled") cancelledCount++;
        }
      }
    });
  });

  const totalActive = presentCount + absentCount;
  // If no sessions marked, it defaults to 100% per standard practice or 100 as default
  const percentage = totalActive > 0 ? (presentCount / totalActive) * 100 : 100;

  return {
    subjectId: subject.id,
    code: subject.code,
    name: subject.name,
    presentCount,
    absentCount,
    cancelledCount,
    totalActive,
    percentage,
  };
}

export interface OverAllStats {
  percentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalCancelled: number;
  totalActive: number;
  dangerSubjects: SubjectStats[];
}

export function calculateOverallStats(
  subjects: Subject[],
  records: UserDocument["records"],
  extraClasses: ExtraClass[]
): OverAllStats {
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalCancelled = 0;

  const subjectStatsList = subjects.map(sub => calculateSubjectStats(sub, records, extraClasses));

  subjectStatsList.forEach(stat => {
    totalPresent += stat.presentCount;
    totalAbsent += stat.absentCount;
    totalCancelled += stat.cancelledCount;
  });

  const totalActive = totalPresent + totalAbsent;
  const percentage = totalActive > 0 ? (totalPresent / totalActive) * 100 : 100;
  const dangerSubjects = subjectStatsList.filter(s => s.percentage < 85);

  return {
    percentage,
    totalPresent,
    totalAbsent,
    totalCancelled,
    totalActive,
    dangerSubjects,
  };
}

// Formatting Day Indices
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
