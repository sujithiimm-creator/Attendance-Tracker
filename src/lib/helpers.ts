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
    dayTimes: { "3": "4:10–5:40 PM · Rm 202 · Prof. Utpal Chattopadhyay", "4": "4:10–5:40 PM · Rm 202 · Prof. Utpal Chattopadhyay" } },
  { id: "sub_ld", name: "Leadership Development", code: "LD", days: [3,4],
    dayTimes: { "3": "2:30–4:00 PM · Rm 207 · Prof. Sumi Jha", "4": "2:30–4:00 PM · Rm 207 · Prof. Sumi Jha" } },
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

export interface ParsedSession {
  subject: Subject;
  sessionIndex: number;
  timeString: string;
  room: string;
  faculty: string;
  fullTimeString: string;
  key: string;
}

export function getDaySessions(sub: Subject, dayIndex: number): ParsedSession[] {
  const dayTimeStr = sub.dayTimes[String(dayIndex)];
  if (!dayTimeStr) return [];

  const parts = dayTimeStr.split(" · ");
  const timesPart = parts[0] || "";
  const roomPart = parts[1] || "";
  const facultyPart = parts[2] || "";

  if (timesPart.includes(" & ")) {
    const individualTimes = timesPart.split(" & ");
    return individualTimes.map((time, i) => {
      const fullTimeStr = `${time}${roomPart ? " · " + roomPart : ""}${facultyPart ? " · " + facultyPart : ""}`;
      return {
        subject: sub,
        sessionIndex: i,
        timeString: time,
        room: roomPart,
        faculty: facultyPart,
        fullTimeString: fullTimeStr,
        key: i === 0 ? sub.id : `${sub.id}_s${i}`,
      };
    });
  }

  // Single session
  return [{
    subject: sub,
    sessionIndex: 0,
    timeString: timesPart,
    room: roomPart,
    faculty: facultyPart,
    fullTimeString: dayTimeStr,
    key: sub.id,
  }];
}

export function parseTimeToMinutes(timeRangeStr: string): number {
  const clean = timeRangeStr.toUpperCase().trim();
  const parts = clean.split(/[–\-]|TO/);
  const startStr = (parts[0] || "").trim();

  let hour = 0;
  let minute = 0;
  const colonMatch = startStr.match(/(\d+):(\d+)/);
  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10);
    minute = parseInt(colonMatch[2], 10);
  } else {
    const dMatch = startStr.match(/(\d+)/);
    if (dMatch) {
      hour = parseInt(dMatch[1], 10);
    } else {
      return 0;
    }
  }

  const hasAM = clean.includes("AM") || startStr.includes("AM");
  const hasPM = clean.includes("PM") || startStr.includes("PM");

  if (hasPM && !hasAM) {
    if (hour < 12) hour += 12;
  } else if (hasAM && !hasPM) {
    if (hour === 12) hour = 0;
  } else if (hasAM && hasPM) {
    if (startStr.includes("PM")) {
      if (hour < 12) hour += 12;
    } else if (startStr.includes("AM")) {
      if (hour === 12) hour = 0;
    } else {
      if (hour >= 1 && hour < 8) {
        hour += 12;
      }
    }
  } else {
    if (hour >= 1 && hour < 8) {
      hour += 12;
    }
  }

  return hour * 60 + minute;
}

export function sortSessions(sessions: ParsedSession[]): ParsedSession[] {
  return [...sessions].sort((a, b) => {
    return parseTimeToMinutes(a.timeString) - parseTimeToMinutes(b.timeString);
  });
}

export function sortExtraClasses(extras: ExtraClass[]): ExtraClass[] {
  return [...extras].sort((a, b) => {
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
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
      // Key is either subjectId (regular class), a slot-specific session key, or extra_${extraId}
      if (key === subject.id || key.startsWith(subject.id + "_s")) {
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
  // If no sessions marked, it starts from 0% per user request
  const percentage = totalActive > 0 ? (presentCount / totalActive) * 100 : 0;

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
