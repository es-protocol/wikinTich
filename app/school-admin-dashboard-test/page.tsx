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
  BuildingOffice2Icon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface SchoolData {
  id: string
  name: string
  email: string
  phone: string
  address: string
  type: string
  admin_id: string
}

interface InstitutionRequest {
  id: string
  institution_name: string
  contact_person: string
  email: string
  phone: string
  subjects: string
  teacher_count: number
  student_count: number
  status: string
  created_at: string
}

export default function SchoolAdminDashboardTest() {
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([])

  useEffect(() => {
    fetchSchoolAdminData()
  }, [])

  const fetchSchoolAdminData = async () => {
    try {
      // First, find a school admin profile from our database
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'school_admin')
        .limit(1)
        .single()

      if (profilesError) {
        console.error('Error fetching school admin profile:', profilesError)
        // Fallback to hardcoded profile for testing
        const fallbackProfile = {
          id: 'f6425fa9-00ff-43ed-a864-8264f22434cf',
          full_name: 'David Sheku',
          email: 'davshek@gmail.com',
          phone: '02324578944',
          role: 'school_admin',
          email_verified: false
        }
        setUserProfile(fallbackProfile)
        setIsLoading(false)
        return
      }

      setUserProfile(profiles)

      // Fetch school data for this admin
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('admin_id', profiles.id)
        .single()

      if (schoolError) {
        console.error('Error fetching school data:', schoolError)
        // No school linked to this admin - that's okay for testing
      } else {
        setSchoolData(school)
      }

      // Fetch institution requests for this admin
      const { data: requests, error: requestsError } = await supabase
        .from('institution_requests')
        .select('*')
        .eq('admin_id', profiles.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error fetching institution requests:', requestsError)
      } else {
        setInstitutionRequests(requests || [])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching school admin data:', error)
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />
      case 'reviewed':
        return <DocumentTextIcon className="w-4 h-4" />
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
              <h1 className="text-2xl font-bold text-gray-900">School Admin Dashboard</h1>
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
          {/* Left Column - School Info & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* School Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BuildingOffice2Icon className="w-10 h-10 text-primary-600" />
                </div>
                {schoolData ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">{schoolData.name}</h2>
                    <p className="text-gray-600">{schoolData.email}</p>
                    <p className="text-sm text-gray-500">{schoolData.phone}</p>
                    <p className="text-sm text-gray-500 mt-2">{schoolData.address}</p>
                    
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {schoolData.type} School
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">No School Linked</h2>
                    <p className="text-gray-600">School data not found</p>
                    <p className="text-sm text-gray-500 mt-2">Contact support to link your school</p>
                    
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      Setup Required
                    </div>
                  </>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">School Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-semibold">{institutionRequests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Requests</span>
                  <span className="font-semibold">
                    {institutionRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Approved Requests</span>
                  <span className="font-semibold">
                    {institutionRequests.filter(r => r.status === 'approved').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Teachers</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-left">
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  New Teacher Request
                </button>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-left">
                  <UsersIcon className="w-4 h-4 inline mr-2" />
                  View All Teachers
                </button>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-left">
                  <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                  Generate Reports
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Requests & Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Teacher Requests</h3>
              </div>
              <div className="p-6">
                {institutionRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-600">No teacher requests yet</p>
                    <button className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                      Request a Teacher
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {institutionRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">{request.institution_name}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Contact: {request.contact_person} • {request.email}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Subjects: {request.subjects}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Teachers: {request.teacher_count} • Students: {request.student_count}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Created: {formatDate(request.created_at)}
                            </p>
                            <div className="mt-2 space-x-2">
                              <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                                Approve
                              </button>
                              <button className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Teacher Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <UsersIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Active Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <AcademicCapIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Subject Coverage</p>
                  <p className="text-2xl font-bold text-gray-900">0/10</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <StarIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">0/5</p>
                </div>
              </div>
            </motion.div>

            {/* Coming Soon Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Enhanced features including teacher performance tracking, attendance reports, and advanced analytics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Performance Analytics</p>
                </div>
                <div className="text-center">
                  <CalendarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Attendance Reports</p>
                </div>
                <div className="text-center">
                  <DocumentTextIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Advanced Reports</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Add missing icon imports
const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
) 