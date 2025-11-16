"use client";

import { useState, useEffect } from "react";
import { BookOpen, PlusCircle, Users, Trash2, Calendar, Download, BarChart3, Upload } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import type { Course, Session, AttendanceRecord } from "@/app/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

// Removed initial courses - now loaded from database

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
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>([]);
  const [selectedClassForView, setSelectedClassForView] = useState<string | null>(null);
  const [showAttendanceList, setShowAttendanceList] = useState(false);
  const [currentCourseStudents, setCurrentCourseStudents] = useState<any[]>([]);

  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [classId, setClassId] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [studentList, setStudentList] = useState<Array<{ studentId: string; studentName: string }>>([]);
  const [sessionAttendance, setSessionAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setSelectedDay(currentDay);
    setIsClient(true);
    
    // Load teacher's courses
    if (user?.teacherId) {
      loadCourses();
      loadAllAttendance();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user?.teacherId) return;
    
    try {
      const response = await fetch(`/api/courses?teacherId=${user.teacherId}`);
      const data = await response.json();
      if (response.ok) {
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

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

      // Poll for attendance updates from MongoDB
      const fetchAttendance = async () => {
        try {
          const response = await fetch(`/api/attendance?sessionId=${activeSession.id}`);
          const data = await response.json();
          if (response.ok) {
            console.log('Fetched attendance records:', data.records?.length || 0);
            setSessionAttendance(data.records || []);
          } else {
            console.error('Failed to fetch attendance:', data.error);
          }
        } catch (error) {
          console.error('Failed to fetch attendance:', error);
        }
      };

      // Initial load
      fetchAttendance();
      
      // Poll every 2 seconds
      attendanceInterval = setInterval(fetchAttendance, 2000);

    }
    return () => {
      if (qrInterval) clearInterval(qrInterval);
      if (attendanceInterval) clearInterval(attendanceInterval);
    };
  }, [activeSession]);

  const handleAddCourse = async () => {
    if (!user?.teacherId) {
      toast({ variant: "destructive", title: "Error", description: "Teacher ID not found." });
      return;
    }

    if (day && time && endTime && courseName && courseCode && classId && roomNo) {
      try {
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: user.teacherId,
            name: courseName,
            courseCode,
            classId,
            day,
            time,
            endTime,
            roomNo,
            studentList
          })
        });

        if (response.ok) {
          await loadCourses(); // Reload courses
          setDay("");
          setTime("");
          setEndTime("");
          setCourseName("");
          setCourseCode("");
          setClassId("");
          setRoomNo("");
          setStudentList([]);
          setShowAddForm(false);
          toast({ title: "Success", description: "New course added to your timetable." });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Failed to add course." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add course." });
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: "Please fill out all fields." });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        if (!csv) return;
        const lines = csv.split('\n');
        const students = [];
        
        // Skip header row, parse CSV
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const parts = line.split(',');
            if (parts.length >= 2) {
              const enrollmentNumber = parts[0].trim().replace(/"/g, '').trim();
              const studentName = parts[1].trim().replace(/"/g, '').trim();
              
              console.log('Raw parts:', parts);
              console.log('Parsed enrollment:', enrollmentNumber);
              console.log('Parsed name:', studentName);
              
              if (enrollmentNumber && studentName) {
                students.push({ 
                  studentId: enrollmentNumber, 
                  studentName: studentName 
                });
              }
            }
          }
        }
        
        setStudentList(students);
        toast({ title: "Success", description: `${students.length} students loaded from CSV` });
      };
      reader.readAsText(file);
    } else {
      toast({ variant: "destructive", title: "Error", description: "Please upload a CSV file" });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user?.teacherId) return;
    
    if (confirm('Are you sure you want to delete this lecture?')) {
      try {
        const response = await fetch(`/api/courses?courseId=${courseId}&teacherId=${user.teacherId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadCourses(); // Reload courses
          toast({ title: "Success", description: "Lecture deleted successfully." });
          
          // Close session if deleted course was selected
          if (selectedCourse?._id === courseId) {
            setSelectedCourse(null);
            setActiveSession(null);
            setSessionAttendance([]);
          }
        } else {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete lecture." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete lecture." });
      }
    }
  };

  const loadAllAttendance = async () => {
    if (!user?.teacherId) return;
    
    try {
      console.log('Loading all attendance for teacher:', user.teacherId);
      const response = await fetch(`/api/attendance/all?teacherId=${user.teacherId}`);
      const data = await response.json();
      if (response.ok) {
        console.log('Loaded attendance records:', data.records?.length || 0);
        setAllAttendanceRecords(data.records || []);
      } else {
        console.error('Failed to load attendance:', data.error);
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    }
  };

  const downloadCSV = (classData: any[], classId: string) => {
    const csvContent = [
      ['Date', 'Student Name', 'Enrollment Number', 'Subject', 'Time'],
      ...classData.map((record: any) => [
        record.date,
        record.studentName,
        record.studentId,
        record.courseCode,
        new Date(record.timestamp).toLocaleTimeString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${classId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (classData: any[], classId: string) => {
    const printContent = `
      <html>
        <head><title>Attendance Report - ${classId}</title></head>
        <body>
          <h1>Attendance Report - Class ${classId}</h1>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr><th>Date</th><th>Student Name</th><th>Enrollment Number</th><th>Subject</th><th>Time</th></tr>
            ${classData.map((record: any) => `
              <tr>
                <td>${record.date}</td>
                <td>${record.studentName}</td>
                <td>${record.studentId}</td>
                <td>${record.courseCode}</td>
                <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };



  const handleSelectCourse = (course: Course) => {
    if (selectedCourse?._id === course._id && activeSession) {
        // If the same course is clicked, close the session
        setSelectedCourse(null);
        setActiveSession(null);
        setSessionAttendance([]);
    } else {
        const startTime = new Date();
        setSelectedCourse(course);
        
        const courseId = course._id || course.id || '';
        const sessionId = `session_${courseId}_${Date.now()}`;
        const teacherId = user?.teacherId || 'unknown';
        
        const currentDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD format
        const sessionIdWithDate = `${sessionId}_${currentDate}`;
        
        const qrCodeData = {
          sessionId: sessionIdWithDate,
          courseId: courseId,
          teacherId: teacherId,
          courseCode: course.courseCode,
          classId: course.classId,
          date: currentDate,
          timestamp: Date.now(),
        };
        const qrCodeValue = JSON.stringify(qrCodeData);
        
        const sessionData: Session = {
            id: sessionIdWithDate,
            courseId: courseId,
            teacherId: teacherId,
            startTime: startTime,
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
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Classes
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Manage Timetable
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-6 w-6"/>
                    <CardTitle>Today's Classes - {selectedDay}</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  Click a lecture to start live session and generate QR code for attendance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDaysLectures.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDaysLectures
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((course, index) => (
                        <div
                          key={course._id}
                          className={cn(
                            "w-full flex items-center justify-between rounded-md border p-4 transition-colors",
                            selectedCourse?._id === course._id ? "bg-accent border-primary ring-2 ring-primary" : "bg-card hover:bg-accent/50"
                          )}
                        >
                          <button
                            className="flex-1 flex items-center justify-between text-left"
                            onClick={() => handleSelectCourse(course)}
                          >
                            <div>
                              <p className="font-semibold">{course.name} at {course.classId}</p>
                              <p className="text-sm text-muted-foreground">
                                {course.courseCode} | Room: {course.roomNo} | {course.time} - {course.endTime}
                              </p>
                            </div>
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                    <p>No lectures scheduled for {selectedDay}.</p>
                    <p className="text-sm">Go to "Manage Timetable" to add lectures.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6"/>
                    <CardTitle>Manage Timetable</CardTitle>
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
                    : "Manage your weekly timetable. Add or delete lectures."}
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
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input
                  id="courseCode"
                  placeholder="e.g., CS101"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class ID</Label>
                <Input
                  id="classId"
                  placeholder="e.g., CSE-A"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="studentList">Student List (CSV)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="studentList"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              {studentList.length > 0 && (
                <p className="text-sm text-green-600">
                  ✓ {studentList.length} students loaded
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                CSV format: "EnrollmentNumber","StudentName" (e.g., "EN22CS301307","CHIRAN VIKRAM SHAHI")
              </p>
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
                        <div
                          key={course._id}
                          className="w-full flex items-center justify-between rounded-md border p-4 bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">Lecture {index + 1}: {course.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.courseCode} | {course.classId} | Room: {course.roomNo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-primary">{course.time} - {course.endTime}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCourse(course._id || course.id || '')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
          </TabsContent>


        </Tabs>

    {selectedCourse && activeSession && (
       <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle>Live Class Session</CardTitle>
            <CardDescription>
              QR code for {selectedCourse.name} at {selectedCourse.classId} on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Students can scan this code to mark attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <QrCodeSvg className="h-48 w-48" data-value={qrCodeValue} />
                <Button 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3" 
                  onClick={() => {
                    // Just show who scanned QR code
                    setCurrentCourseStudents(sessionAttendance);
                    setShowAttendanceList(true);
                    toast({ title: "Success", description: `Attendance submitted! ${sessionAttendance.length} students present.` });
                  }}
                >
                  Submit Attendance ({sessionAttendance.length})
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        <div>
                      <h3 className="text-xl font-semibold">Attendance ({sessionAttendance.length})</h3>
                      <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={async () => {
                            if (activeSession) {
                                const response = await fetch(`/api/attendance?sessionId=${activeSession.id}`);
                                const data = await response.json();
                                if (response.ok) {
                                    setSessionAttendance(data.records || []);
                                }
                            }
                        }}
                    >
                        Refresh
                    </Button>
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

    {/* Attendance List Modal */}
    {showAttendanceList && (
      <Card className="shadow-lg animate-in fade-in-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Final Attendance - {selectedCourse?.name}</CardTitle>
              <CardDescription>
                {selectedCourse?.classId} | {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const csvContent = [
                    ['Enrollment Number', 'Student Name', 'Time Scanned', 'Date'],
                    ...currentCourseStudents.map(record => [
                      record.studentId,
                      record.studentName,
                      new Date(record.timestamp).toLocaleTimeString(),
                      new Date(record.timestamp).toLocaleDateString()
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `attendance_${selectedCourse?.courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAttendanceList(false);
                  setSelectedCourse(null);
                  setActiveSession(null);
                  setSessionAttendance([]);
                  setCurrentCourseStudents([]);
                  loadAllAttendance();
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-green-600 font-medium">
              Present: {currentCourseStudents.length}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enrollment Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Time Scanned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCourseStudents.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.studentId}</TableCell>
                    <TableCell>{record.studentName}</TableCell>
                    <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )}
      </div>
    </div>
  );
}
