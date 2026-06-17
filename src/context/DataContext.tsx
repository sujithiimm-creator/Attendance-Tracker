import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Subject, ExtraClass, UserDocument, AttendanceStatus, AttendanceRecords } from "../types";
import { DEFAULT_SUBJECTS } from "../lib/helpers";

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
          setData(JSON.parse(saved));
          setSyncStatus("saved");
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
          setData(snapshot.data() as UserDocument);
          setSyncStatus("saved");
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
    if (!updatedRecords[dateISO]) {
      updatedRecords[dateISO] = {};
    }
    updatedRecords[dateISO][subjectOrExtraId] = status;

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
