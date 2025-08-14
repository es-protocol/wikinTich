'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { 
  BuildingOffice2Icon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface InstitutionData {
  id: string
  name: string
  type: string
  address: string
  phone: string
  email: string
}

interface RequestData {
  id: string
  institution_name: string
  subjects: string
  teacher_count: number
  status: string
  created_at: string
}

export default function SchoolAdminDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [institution, setInstitution] = useState<InstitutionData | null>(null)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated and has the right role
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/login'
        return
      }
      
      if (user.role !== 'school_admin') {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'parent') {
          window.location.href = '/dashboard-with-children'
        } else if (user.role === 'tutor') {
          window.location.href = '/tutor-dashboard'
        } else {
          window.location.href = '/login'
        }
        return
      }
      
      // User is authenticated and has correct role, load dashboard data
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const email = user.email

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profileError) throw profileError
      setUserProfile(profile)

      // Email verification is handled by Supabase Auth - if user can log in, email is verified
      // No need to check email_verified field

      // Get institution data
      const { data: institutionData, error: institutionError } = await supabase
        .from('schools')
        .select('*')
        .eq('admin_id', profile.id)
        .single()

      if (institutionError && institutionError.code !== 'PGRST116') {
        throw institutionError
      }

      if (institutionData) {
        setInstitution(institutionData)
      }

      // Get institution requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('institution_requests')
        .select('*')
        .eq('admin_id', profile.id)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError
      setRequests(requestsData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Dashboard...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your authentication.
          </p>
        </div>
      </div>
    )
  }

  // Show loading while dashboard data is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">School Admin Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {userProfile?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userProfile?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <button 
                onClick={() => {
                  // Clear user data and redirect to login
                  localStorage.removeItem('wikinTichUser')
                  localStorage.removeItem('wikinTichUserRole')
                  window.location.href = '/login'
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'requests', name: 'Teacher Requests', icon: ClipboardDocumentListIcon },
              { id: 'teachers', name: 'Teachers', icon: UserGroupIcon },
              { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <BellIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Institution Type</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {institution?.type || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Information */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Institution Information</h2>
              </div>
              <div className="p-6">
                {institution ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Institution Name</h3>
                      <p className="mt-1 text-sm text-gray-900">{institution.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <p className="mt-1 text-sm text-gray-900">{institution.type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Address</h3>
                      <p className="mt-1 text-sm text-gray-900">{institution.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                      <p className="mt-1 text-sm text-gray-900">{institution.phone}</p>
                      <p className="mt-1 text-sm text-gray-900">{institution.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No institution information available.</p>
                )}
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Teacher Requests</h2>
              </div>
              <div className="p-6">
                {requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{request.institution_name}</h3>
                          <p className="text-sm text-gray-500">{request.subjects}</p>
                          <p className="text-xs text-gray-400">Teachers needed: {request.teacher_count}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No teacher requests found.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Teacher Requests</h2>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  New Request
                </button>
              </div>
              <div className="p-6">
                {requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{request.institution_name}</h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Subjects</p>
                            <p className="text-sm text-gray-900">{request.subjects}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Teachers Needed</p>
                            <p className="text-sm text-gray-900">{request.teacher_count}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Submitted</p>
                            <p className="text-sm text-gray-900">{formatDate(request.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View Details
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new teacher request.</p>
                    <div className="mt-6">
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Create Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'teachers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Assigned Teachers</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">Teachers will appear here once they are assigned to your institution.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                  <p className="mt-1 text-sm text-gray-500">Messages from the platform and teachers will appear here.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
} 