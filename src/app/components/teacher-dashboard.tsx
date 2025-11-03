"use client";

import { useState, useEffect } from "react";
import { BookOpen, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QrCodeSvg } from "./qr-code-svg";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Course, Session, AttendanceRecord } from "@/app/lib/data";
import { attendanceRecords, students } from "@/app/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const initialCourses: Course[] = [
    { id: 'cs101', name: 'Operating Systems', day: 'Monday', time: '10:00', roomNo: 'A-101' },
    { id: 'ds302', name: 'Data Structures', day: 'Monday', time: '12:00', roomNo: 'B-204' },
    { id: 'db210', name: 'Database Systems', day: 'Tuesday', time: '14:00', roomNo: 'C-301' },
];

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function TeacherDashboard() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [courseName, setCourseName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [sessionAttendance, setSessionAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setSelectedDay(currentDay);
    setIsClient(true);
  }, []);

  useEffect(() => {
    let qrInterval: NodeJS.Timeout | null = null;
    let attendanceInterval: NodeJS.Timeout | null = null;

    if (activeSession) {
      // Update QR code every second
      qrInterval = setInterval(() => {
        const qrCodeData = {
          sessionId: activeSession.id,
          courseId: activeSession.courseId,
          teacherId: activeSession.teacherId,
          timestamp: Date.now(),
        };
        const qrCodeValue = JSON.stringify(qrCodeData);
        setActiveSession(prevSession => prevSession ? { ...prevSession, qrCode: qrCodeValue } : null);
      }, 1000);

      // Poll for attendance updates every second
      attendanceInterval = setInterval(() => {
        const currentSessionRecords = attendanceRecords.filter(r => r.sessionId === activeSession.id);
        setSessionAttendance(currentSessionRecords);
      }, 1000);

    }
    return () => {
      if (qrInterval) clearInterval(qrInterval);
      if (attendanceInterval) clearInterval(attendanceInterval);
    };
  }, [activeSession]);

  const handleAddCourse = () => {
    if (day && time && courseName && roomNo) {
        const newCourse: Course = {
            id: `course_${Date.now()}`,
            day,
            time,
            name: courseName,
            roomNo,
        };
      setCourses([...courses, newCourse]);
      setDay("");
      setTime("");
      setCourseName("");
      setRoomNo("");
      setShowAddForm(false);
      toast({ title: "Success", description: "New course added to your timetable." });
    } else {
        toast({ variant: "destructive", title: "Error", description: "Please fill out all fields." });
    }
  };

  const handleSelectCourse = (course: Course) => {
    if (selectedCourse?.id === course.id && activeSession) {
        // If the same course is clicked, close the session
        setSelectedCourse(null);
        setActiveSession(null);
        setSessionAttendance([]);
    } else {
        setSelectedCourse(course);
        const sessionId = `session_${course.id}_${Date.now()}`;
        const teacherId = "teacher_01";
        
        const qrCodeData = {
          sessionId: sessionId,
          courseId: course.id,
          teacherId: teacherId,
          timestamp: Date.now(),
        };
        const qrCodeValue = JSON.stringify(qrCodeData);
        
        const sessionData: Session = {
            id: sessionId,
            courseId: course.id,
            teacherId: teacherId,
            startTime: new Date(),
            qrCode: qrCodeValue,
        };
        setActiveSession(sessionData);
        setSessionAttendance([]); // Reset attendance for new session
    }
  };

  const selectedDaysLectures = courses.filter((entry) => entry.day === selectedDay);
  const qrCodeValue = activeSession ? activeSession.qrCode : "";

  if (!isClient) {
    // Render a skeleton or nothing on the server to prevent hydration mismatch.
    return null;
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
      <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6"/>
                <CardTitle>Faculty Timetable</CardTitle>
            </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
        <CardDescription>
          {showAddForm
            ? "Add a new lecture to your timetable."
            : `Viewing lectures for ${selectedDay}. Click a lecture to start a session.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-1 rounded-md bg-muted p-1">
            {daysOfWeek.map((dayName) => (
                <Button key={dayName} variant={selectedDay === dayName ? 'default' : 'ghost'} className="flex-1" onClick={() => setSelectedDay(dayName)}>
                    {dayName.slice(0,3)}
                </Button>
            ))}
        </div>
        {showAddForm && (
          <div className="mb-6 space-y-4 animate-in fade-in-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day">Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName">Class Name</Label>
              <Input
                id="courseName"
                placeholder="e.g., Computer Science 101"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNo">Room No.</Label>
              <Input
                id="roomNo"
                placeholder="e.g., A-101"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCourse}>Add Lecture</Button>
            </div>
          </div>
        )}

        {selectedDaysLectures.length > 0 ? (
          <div className="space-y-4">
            {selectedDaysLectures
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((course, index) => (
                <button
                  key={course.id}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md border p-4 text-left transition-colors",
                    selectedCourse?.id === course.id ? "bg-accent border-primary ring-2 ring-primary" : "bg-card hover:bg-accent/50"
                  )}
                  onClick={() => handleSelectCourse(course)}
                >
                  <div>
                    <p className="font-semibold">Lecture {index + 1}: {course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Room: {course.roomNo}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{course.time}</p>
                </button>
              ))}
          </div>
        ) : (
          !showAddForm && (
            <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
              <p>No lectures scheduled for {selectedDay}.</p>
              <p className="text-sm">Click "Add Subject" to create a new entry.</p>
            </div>
          )
        )}
      </CardContent>
    </Card>

    {selectedCourse && activeSession && (
       <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle>Live Class Session</CardTitle>
            <CardDescription>
              QR code for {selectedCourse.name} at {selectedCourse.time}. Students can now scan this code.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <QrCodeSvg className="h-48 w-48" data-value={qrCodeValue} />
                <Button variant="outline" onClick={() => {
                    setSelectedCourse(null);
                    setActiveSession(null);
                }}>
                  End Session
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    <h3 className="text-xl font-semibold">Attendance ({sessionAttendance.length})</h3>
                </div>
                <div className="rounded-md border h-64 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Time Marked</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessionAttendance.length > 0 ? (
                                sessionAttendance
                                .sort((a,b) => a.timestamp - b.timestamp)
                                .map((record) => (
                                    <TableRow key={record.studentId}>
                                        <TableCell>{record.studentName}</TableCell>
                                        <TableCell className="text-right">{format(new Date(record.timestamp), 'HH:mm:ss')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No students have marked their attendance yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
              </div>
          </CardContent>
        </Card>
    )}
      </div>
    </div>
  );
}
