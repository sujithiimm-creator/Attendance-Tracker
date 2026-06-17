export interface Subject {
  id: string;
  name: string;
  code: string;
  days: number[]; // 0=Sun..6=Sat
  dayTimes: { [dayIndex: string]: string }; // e.g. "9:30–11:00 AM · Rm 206 · Prof. X"
}

export interface ExtraClass {
  id: string;       // referenced in records as `extra_${id}`
  subjectId: string;
  date: string;      // ISO yyyy-mm-dd
  time: string;
  note: string;
}

export type AttendanceStatus = "present" | "absent" | "cancelled";

export interface AttendanceRecords {
  [subjectOrExtraKey: string]: AttendanceStatus;
}

export interface UserDocument {
  email: string;
  displayName: string;
  subjects: Subject[];
  records: { [dateISO: string]: AttendanceRecords };
  extraClasses: ExtraClass[];
  updatedAt?: any;
}
