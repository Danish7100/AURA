import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const attendance = db.collection('attendance')
    const users = db.collection('users')
    const courses = db.collection('courses')

    // Get teacher's courses
    const teacherCourses = await courses.find({ teacherId }).toArray()
    const courseCodes = teacherCourses.map(c => c.courseCode)
    const classIds = teacherCourses.map(c => c.classId)

    // Get attendance records for teacher's courses
    console.log('Looking for attendance with courseCodes:', courseCodes, 'classIds:', classIds)
    
    const records = await attendance.find({
      $or: [
        { courseCode: { $in: courseCodes } },
        { classId: { $in: classIds } }
      ]
    }).sort({ timestamp: -1 }).toArray()
    
    console.log('Found attendance records:', records.length)

    // Records already have student data from when they were saved
    // Just return them as they contain complete information
    const enrichedRecords = records.map(record => ({
      ...record,
      // Ensure we have the data we need
      studentName: record.studentName,
      studentId: record.studentId,
      studentEmail: record.studentEmail
    }))
    
    console.log('Returning enriched records:', enrichedRecords.length)

    return NextResponse.json({ records: enrichedRecords })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
  }
}