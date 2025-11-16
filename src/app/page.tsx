"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScanLine, Users, GraduationCap, QrCode, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ScanLine className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-gray-900">AURA</h1>
          </div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            QR Code Attendance System
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern, efficient, and secure attendance management using QR code technology. 
            Perfect for educational institutions and organizations.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <QrCode className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quick Scanning</h3>
            <p className="text-gray-600">Fast and accurate QR code scanning for instant attendance marking</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">Live attendance monitoring with instant updates and notifications</p>
          </div>
          <div className="text-center">
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Role-based Access</h3>
            <p className="text-gray-600">Separate dashboards for students and faculty with appropriate permissions</p>
          </div>
        </div>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <GraduationCap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Student Portal</CardTitle>
              <CardDescription className="text-lg">
                Mark your attendance by scanning QR codes displayed by your instructors
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Scan QR codes to mark attendance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>View attendance history</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time confirmation</span>
                  </li>
                </ul>
                <Link href="/auth/signin?role=student">
                  <Button size="lg" className="w-full">
                    Access Student Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Faculty Portal</CardTitle>
              <CardDescription className="text-lg">
                Generate QR codes and manage attendance for your classes
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Generate QR codes for classes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Monitor live attendance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Manage class schedules</span>
                  </li>
                </ul>
                <Link href="/auth/signin?role=faculty">
                  <Button size="lg" className="w-full" variant="outline">
                    Access Faculty Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p>© 2024 AURA - QR Code Attendance System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
