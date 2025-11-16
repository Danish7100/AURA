import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { teacherId, name, courseCode, classId, day, time, endTime, roomNo, studentList } = await request.json()

    const client = await clientPromise
    const db = client.db('aura')
    const courses = db.collection('courses')

    await courses.insertOne({
      teacherId,
      name,
      courseCode,
      classId,
      day,
      time,
      endTime,
      roomNo,
      studentList: studentList || [],
      createdAt: new Date()
    })

    return NextResponse.json({ message: 'Course added successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add course' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const courses = db.collection('courses')

    const teacherCourses = await courses.find({ teacherId }).toArray()
    
    return NextResponse.json({ courses: teacherCourses })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const teacherId = searchParams.get('teacherId')

    if (!courseId || !teacherId) {
      return NextResponse.json({ error: 'Course ID and Teacher ID required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const courses = db.collection('courses')

    // Delete only if course belongs to the teacher
    const result = await courses.deleteOne({ 
      _id: new (require('mongodb')).ObjectId(courseId),
      teacherId: teacherId 
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}