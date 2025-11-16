import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('aura')
    const users = db.collection('users')

    const user = await users.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const userData: any = { 
      id: user._id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    }

    // Add role-specific ID
    if (user.role === 'student' && user.studentId) {
      userData.studentId = user.studentId
    } else if (user.role === 'faculty' && user.teacherId) {
      userData.teacherId = user.teacherId
    }

    return NextResponse.json({ 
      message: 'Login successful',
      user: userData
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}