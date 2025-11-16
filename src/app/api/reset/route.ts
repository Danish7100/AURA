import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('aura')

    // Clear all collections
    await db.collection('users').deleteMany({})
    await db.collection('courses').deleteMany({})
    await db.collection('attendance').deleteMany({})

    return NextResponse.json({ message: 'Database reset successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 })
  }
}