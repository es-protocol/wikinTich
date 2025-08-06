'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon, 
  AcademicCapIcon, 
  CalendarIcon, 
  CreditCardIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon,
  CogIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  BookOpenIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface TutorData {
  id: string
  profile_id: string
  bio: string
  subjects: string[]
  availability: any
  is_verified: boolean
  phone: string
  email: string
  total_hours: number
  average_rating: number
  overall_attendance_rate: number
  active_institution_assignments: number
  active_home_assignments: number
}

interface Qualification {
  id: string
  tutor_id: string
  qualification_type: string
  title: string
  institution: string
  year_obtained: number
  is_verified: boolean
}

export default function TutorDashboardTest() {
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [tutorData, setTutorData] = useState<TutorData | null>(null)
  const [qualifications, setQualifications] = useState<Qualification[]>([])

  useEffect(() => {
    // Use hard-coded sample tutor profile for testing
    const testProfile = {
      id: '550e8400-e29b-41d4-a716-446655440007',
      full_name: 'Kadiatu Bangura',
      email: 'kadiatu.bangura@email.com',
      phone: '+232 88 789 012',
      role: 'tutor',
      email_verified: true
    }
    
    setUserProfile(testProfile)
    fetchTutorData()
  }, [])

  const fetchTutorData = async () => {
    try {
      // Fetch tutor data
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('profile_id', '550e8400-e29b-41d4-a716-446655440007')
        .single()

      if (tutorError) {
        console.error('Error fetching tutor data:', tutorError)
        return
      }

      setTutorData(tutor)

      // Fetch qualifications
      const { data: quals, error: qualsError } = await supabase
        .from('tutor_qualifications')
        .select('*')
        .eq('tutor_id', tutor.id)

      if (qualsError) {
        console.error('Error fetching qualifications:', qualsError)
        return
      }

      setQualifications(quals || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching tutor data:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Tutor Dashboard</h1>
              <span className="ml-2 text-sm text-gray-500">(Test Mode)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{userProfile?.full_name}</span>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{userProfile?.full_name}</h2>
                <p className="text-gray-600">{userProfile?.email}</p>
                <p className="text-sm text-gray-500">{userProfile?.phone}</p>
                
                {tutorData?.is_verified && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Verified Tutor
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="font-semibold">{tutorData?.total_hours || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">{tutorData?.average_rating || 0}/5</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendance Rate</span>
                  <span className="font-semibold">{tutorData?.overall_attendance_rate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Assignments</span>
                  <span className="font-semibold">
                    {((tutorData?.active_institution_assignments || 0) + (tutorData?.active_home_assignments || 0))}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Subjects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subjects Taught</h3>
              <div className="flex flex-wrap gap-2">
                {tutorData?.subjects?.map((subject: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                  >
                    <BookOpenIcon className="w-4 h-4 mr-1" />
                    {subject}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Bio & Qualifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">About Me</h3>
              <p className="text-gray-700 leading-relaxed">
                {tutorData?.bio || 'No bio available'}
              </p>
            </motion.div>

            {/* Qualifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Qualifications</h3>
              {qualifications.length === 0 ? (
                <p className="text-gray-600">No qualifications added yet.</p>
              ) : (
                <div className="space-y-4">
                  {qualifications.map((qual) => (
                    <div key={qual.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{qual.title}</h4>
                          <p className="text-sm text-gray-600">{qual.institution}</p>
                          <p className="text-sm text-gray-500">
                            {qual.qualification_type} • {qual.year_obtained}
                          </p>
                        </div>
                        {qual.is_verified && (
                          <div className="flex items-center text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            <span className="text-sm font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="text-center p-3 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900">{day}</p>
                    <p className="text-sm text-gray-600">Available</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Coming Soon Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Enhanced features including session management, performance tracking, and payment history.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <CalendarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Session Management</p>
                </div>
                <div className="text-center">
                  <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Performance Analytics</p>
                </div>
                <div className="text-center">
                  <CreditCardIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Payment Tracking</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Add missing icon import
const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
) 