import { subDays, format } from 'date-fns';

export type Student = {
  id: string;
  name: string;
};

export type Course = {
  id: string;
  name: string;
  day: string;
  time: string;
  roomNo: string;
};

export type Session = {
    id: string;
    courseId: string;
    teacherId: string;
    startTime: Date;
    qrCode: string;
};

export type AttendanceRecord = {
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: number;
};

export const students: Student[] = [
  { id: "STU001", name: "Alice Johnson" },
  { id: "STU002", name: "Bob Williams" },
  { id: "STU003", name: "Charlie Brown" },
  { id: "STU004", name: "Diana Miller" },
  { id: "STU005", name: "Ethan Davis" },
];

// This will act as our in-memory database for attendance records
// We use a simple singleton pattern to ensure the same array is used across the client-side app
class AttendanceStore {
    private static instance: AttendanceStore;
    public records: AttendanceRecord[] = [];

    private constructor() { }

    public static getInstance(): AttendanceStore {
        if (!AttendanceStore.instance) {
            AttendanceStore.instance = new AttendanceStore();
        }
        return AttendanceStore.instance;
    }
}

export const attendanceRecords = AttendanceStore.getInstance().records;

// Function to add an attendance record
export const addAttendanceRecord = (record: AttendanceRecord) => {
  const store = AttendanceStore.getInstance();
  // Prevent duplicate entries for the same student in the same session
  const existingRecord = store.records.find(
    r => r.sessionId === record.sessionId && r.studentId === record.studentId
  );
  if (!existingRecord) {
    store.records.push(record);
  }
};
