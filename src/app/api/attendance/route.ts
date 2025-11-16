import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, studentId, studentName, courseCode, classId, date } = await request.json()

    const client = await clientPromise
    const db = client.db('aura')
    const attendance = db.collection('attendance')

    // Find student by email (since studentId is extracted from email)
    const users = db.collection('users')
    
    const student = await users.findOne({ 
      email: { $regex: `^${studentId}@` }, // Find by email starting with enrollment number
      role: 'student' 
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 400 })
    }
    
    console.log('Student found:', student.name, 'Enrollment:', studentId)

    // Check if already marked for this date
    const existing = await attendance.findOne({ sessionId, studentId, date })
    if (existing) {
      return NextResponse.json({ error: 'Attendance already marked for today' }, { status: 400 })
    }

    // Add attendance record with student data from database
    const attendanceRecord = {
      sessionId,
      studentId: studentId, // Enrollment number extracted from email
      studentName: student.name, // Name from database
      studentEmail: student.email, // Full email from database
      courseCode,
      classId,
      date,
      timestamp: Date.now(),
      createdAt: new Date()
    }
    
    const result = await attendance.insertOne(attendanceRecord)
    console.log('Attendance saved:', result.insertedId, 'for student:', student.name)

    return NextResponse.json({ message: 'Attendance marked successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const attendance = db.collection('attendance')

    const records = await attendance.find({ sessionId }).sort({ timestamp: 1 }).toArray()
    
    return NextResponse.json({ records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}