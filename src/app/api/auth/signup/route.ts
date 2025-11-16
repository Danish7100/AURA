import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!['student', 'faculty'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const users = db.collection('users')

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date()
    }

    // Generate role-specific ID
    if (role === 'student') {
      const studentCount = await users.countDocuments({ role: 'student' })
      userData.studentId = `STU${String(studentCount + 1).padStart(3, '0')}`
    } else if (role === 'faculty') {
      const facultyCount = await users.countDocuments({ role: 'faculty' })
      userData.teacherId = `TCH${String(facultyCount + 1).padStart(3, '0')}`
    }

    await users.insertOne(userData)

    return NextResponse.json({ message: 'User created successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}