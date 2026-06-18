import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Subject, ExtraClass, UserDocument, AttendanceStatus, AttendanceRecords } from "../types";
import { DEFAULT_SUBJECTS } from "../lib/helpers";
import { COURSES } from "../lib/coursesData";

const DAY_MAP_INDICES: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function generateMigrationCode(name: string): string {
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

  return name
    .split(/[\s\-&]+/)
    .filter(w => !["and", "for", "the", "with", "of", "in"].includes(w.toLowerCase()))
    .map(w => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 5);
}

function mapCourseToSubjectMigration(course: any): Subject {
  const days: number[] = [];
  const dayTimes: { [dayIndex: string]: string } = {};

  course.sessions.forEach((s: any) => {
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
    code: generateMigrationCode(course.course),
    days: days.sort((a, b) => a - b),
    dayTimes,
  };
}

function migrateUserDocument(userDoc: UserDocument): UserDocument {
  if (!userDoc || !userDoc.subjects) return userDoc;

  let hasChanged = false;
  const upgradedSubjects = userDoc.subjects.map((sub) => {
    // 1. Check if it's a default seed subject
    const defaultMatch = DEFAULT_SUBJECTS.find((d) => d.id === sub.id || d.code === sub.code);
    if (defaultMatch) {
      const isOutdated = JSON.stringify(sub.dayTimes) !== JSON.stringify(defaultMatch.dayTimes);
      if (isOutdated) {
        hasChanged = true;
        return {
          ...sub,
          days: defaultMatch.days,
          dayTimes: defaultMatch.dayTimes,
        };
      }
    }

    // 2. Check if it's a dynamic builder course subject
    const match = sub.id.match(/^course_(\d+)$/);
    if (match) {
      const cId = parseInt(match[1], 10);
      const course = COURSES.find((c) => c.id === cId);
      if (course) {
        const correctSub = mapCourseToSubjectMigration(course);
        const isOutdated = JSON.stringify(sub.dayTimes) !== JSON.stringify(correctSub.dayTimes);
        if (isOutdated) {
          hasChanged = true;
          return {
            ...sub,
            days: correctSub.days,
            dayTimes: correctSub.dayTimes,
          };
        }
      }
    }

    return sub;
  });

  if (hasChanged) {
    return {
      ...userDoc,
      subjects: upgradedSubjects,
    };
  }
  return userDoc;
}

export type SyncStatusType = "loading" | "saved" | "saving" | "error";

interface DataContextType {
  data: UserDocument | null;
  syncStatus: SyncStatusType;
  addSubject: (subject: Omit<Subject, "id">) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  setSubjects: (subjects: Subject[]) => Promise<void>;
  addExtraClass: (extra: Omit<ExtraClass, "id">) => Promise<void>;
  deleteExtraClass: (extraId: string) => Promise<void>;
  markAttendance: (dateISO: string, subjectOrExtraId: string, status: AttendanceStatus) => Promise<void>;
  resetData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isMock } = useAuth();
  const [data, setData] = useState<UserDocument | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("loading");

  // Real-time listener for User document
  useEffect(() => {
    if (!user) {
      setData(null);
      setSyncStatus("loading");
      return;
    }

    if (isMock || !db) {
      // Mock Storage implementation
      setSyncStatus("loading");
      const key = `attendtrack_data_${user.uid}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          const raw = JSON.parse(saved);
          const upgraded = migrateUserDocument(raw);
          setData(upgraded);
          setSyncStatus("saved");
          if (JSON.stringify(raw.subjects) !== JSON.stringify(upgraded.subjects)) {
            localStorage.setItem(key, JSON.stringify(upgraded));
          }
        } catch (_) {
          const initial: UserDocument = {
            email: user.email || "",
            displayName: user.displayName || "",
            subjects: [],
            records: {},
            extraClasses: [],
          };
          localStorage.setItem(key, JSON.stringify(initial));
          setData(initial);
          setSyncStatus("saved");
        }
      } else {
        // First login: auto provision with empty seed
        const initial: UserDocument = {
          email: user.email || "",
          displayName: user.displayName || "",
          subjects: [],
          records: {},
          extraClasses: [],
        };
        localStorage.setItem(key, JSON.stringify(initial));
        setData(initial);
        setSyncStatus("saved");
      }
      return;
    }

    // Real Firebase listener
    setSyncStatus("loading");
    const docRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const rawDoc = snapshot.data() as UserDocument;
          const upgraded = migrateUserDocument(rawDoc);
          setData(upgraded);
          setSyncStatus("saved");
          
          if (JSON.stringify(rawDoc.subjects) !== JSON.stringify(upgraded.subjects)) {
            try {
              await setDoc(docRef, {
                ...upgraded,
                updatedAt: serverTimestamp(),
              }, { merge: false });
            } catch (err) {
              console.error("Failed to automatically persist subjects migration:", err);
            }
          }
        } else {
          // Document does not exist yet: provision with empty subjects so they configure it first
          setSyncStatus("saving");
          try {
            const initial: UserDocument = {
              email: user.email || "",
              displayName: user.displayName || "",
              subjects: [],
              records: {},
              extraClasses: [],
            };
            await setDoc(docRef, {
              ...initial,
              updatedAt: serverTimestamp(),
            });
            // Snapshot listener will trigger again with the new data
          } catch (err) {
            setSyncStatus("error");
            handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
          }
        }
      },
      (error) => {
        setSyncStatus("error");
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    return () => unsubscribe();
  }, [user, isMock]);

  // General atomic writer to commit edits back to Firestore/LocalStorage
  const writeData = async (newData: UserDocument) => {
    if (!user) return;
    setSyncStatus("saving");

    if (isMock || !db) {
      // Simulate network sync latency for tactile user feedback
      setTimeout(() => {
        const key = `attendtrack_data_${user.uid}`;
        localStorage.setItem(key, JSON.stringify(newData));
        setData(newData);
        setSyncStatus("saved");
      }, 350);
      return;
    }

    // Real setDoc
    const docRef = doc(db, "users", user.uid);
    try {
      await setDoc(docRef, {
        ...newData,
        updatedAt: serverTimestamp(),
      }, { merge: false });
      // The onSnapshot listener will update local React state automatically
    } catch (err) {
      setSyncStatus("error");
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addSubject = async (subjectInput: Omit<Subject, "id">) => {
    if (!data) return;
    const newId = `sub_${Date.now()}`;
    const newSubject: Subject = {
      ...subjectInput,
      id: newId,
    };
    const updated: UserDocument = {
      ...data,
      subjects: [...data.subjects, newSubject],
    };
    await writeData(updated);
  };

  const updateSubject = async (updatedSubject: Subject) => {
    if (!data) return;
    const updatedSubjects = data.subjects.map((sub) =>
      sub.id === updatedSubject.id ? updatedSubject : sub
    );
    const updated: UserDocument = {
      ...data,
      subjects: updatedSubjects,
    };
    await writeData(updated);
  };

  const deleteSubject = async (subjectId: string) => {
    if (!data) return;
    const updatedSubjects = data.subjects.filter((sub) => sub.id !== subjectId);
    
    // Clean up corresponding records & extra classes linked to the deleted subject
    const updatedRecords = { ...data.records };
    Object.keys(updatedRecords).forEach((dateISO) => {
      const record = { ...updatedRecords[dateISO] };
      // Delete regular subject records
      if (record[subjectId]) {
        delete record[subjectId];
      }
      
      // Delete extra class records for this subject
      data.extraClasses.forEach((ex) => {
        if (ex.subjectId === subjectId && record[`extra_${ex.id}`]) {
          delete record[`extra_${ex.id}`];
        }
      });
      
      if (Object.keys(record).length === 0) {
        delete updatedRecords[dateISO];
      } else {
        updatedRecords[dateISO] = record;
      }
    });

    const updatedExtraClasses = data.extraClasses.filter((ex) => ex.subjectId !== subjectId);

    const updated: UserDocument = {
      ...data,
      subjects: updatedSubjects,
      records: updatedRecords,
      extraClasses: updatedExtraClasses,
    };
    await writeData(updated);
  };

  const addExtraClass = async (extraInput: Omit<ExtraClass, "id">) => {
    if (!data) return;
    const newId = `extra_${Date.now()}`;
    const newExtra: ExtraClass = {
      ...extraInput,
      id: newId,
    };
    const updated: UserDocument = {
      ...data,
      extraClasses: [...data.extraClasses, newExtra],
    };
    await writeData(updated);
  };

  const deleteExtraClass = async (extraId: string) => {
    if (!data) return;
    const updatedExtraClasses = data.extraClasses.filter((ex) => ex.id !== extraId);

    // Clean up record entry
    const updatedRecords = { ...data.records };
    const extraKey = `extra_${extraId}`;
    Object.keys(updatedRecords).forEach((dateISO) => {
      if (updatedRecords[dateISO][extraKey]) {
        const record = { ...updatedRecords[dateISO] };
        delete record[extraKey];
        if (Object.keys(record).length === 0) {
          delete updatedRecords[dateISO];
        } else {
          updatedRecords[dateISO] = record;
        }
      }
    });

    const updated: UserDocument = {
      ...data,
      extraClasses: updatedExtraClasses,
      records: updatedRecords,
    };
    await writeData(updated);
  };

  const markAttendance = async (
    dateISO: string,
    subjectOrExtraId: string,
    status: AttendanceStatus
  ) => {
    if (!data) return;
    const updatedRecords = { ...data.records };
    
    // Check if we are deselecting
    if (updatedRecords[dateISO] && updatedRecords[dateISO][subjectOrExtraId] === status) {
      const dayRecord = { ...updatedRecords[dateISO] };
      delete dayRecord[subjectOrExtraId];
      if (Object.keys(dayRecord).length === 0) {
        delete updatedRecords[dateISO];
      } else {
        updatedRecords[dateISO] = dayRecord;
      }
    } else {
      if (!updatedRecords[dateISO]) {
        updatedRecords[dateISO] = {};
      }
      updatedRecords[dateISO] = {
        ...updatedRecords[dateISO],
        [subjectOrExtraId]: status,
      };
    }

    const updated: UserDocument = {
      ...data,
      records: updatedRecords,
    };
    await writeData(updated);
  };

  const setSubjects = async (newSubjects: Subject[]) => {
    if (!data) return;
    const updated: UserDocument = {
      ...data,
      subjects: newSubjects,
    };
    await writeData(updated);
  };

  const resetData = async () => {
    if (!data) return;
    const updated: UserDocument = {
      ...data,
      subjects: DEFAULT_SUBJECTS,
      records: {},
      extraClasses: [],
    };
    await writeData(updated);
  };

  return (
    <DataContext.Provider
      value={{
        data,
        syncStatus,
        addSubject,
        updateSubject,
        deleteSubject,
        setSubjects,
        addExtraClass,
        deleteExtraClass,
        markAttendance,
        resetData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
