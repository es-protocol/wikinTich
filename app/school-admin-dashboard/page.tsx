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

interface AssignedTeacher {
  id: string
  assignment_id: string
  full_name: string
  email: string
  phone: string
  subjects: string
  experience_level: string
  assigned_at: string
}

export default function SchoolAdminDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [institution, setInstitution] = useState<InstitutionData | null>(null)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [assignedTeachers, setAssignedTeachers] = useState<AssignedTeacher[]>([])
  const [deletingTutorId, setDeletingTutorId] = useState<string | null>(null)
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  // New request modal states
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [newRequestForm, setNewRequestForm] = useState({
    // Teacher Requirements (matching main institution page exactly)
    subjects: '',
    experienceLevel: '',
    duration: '',
    teacherCount: 1,
    additionalRequirements: ''
  })

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tutorToDelete, setTutorToDelete] = useState<{ id: string; name: string; assignmentId: string } | null>(null)

  // View details modal states
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<AssignedTeacher | null>(null)

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

  // Auto-load assigned teachers when Teachers tab is active and institution data is available
  useEffect(() => {
    if (activeTab === 'teachers' && institution && userProfile) {
      console.log('Teachers tab activated, loading assigned teachers...')
      loadAssignedTeachers(userProfile.id, institution)
    }
  }, [activeTab, institution, userProfile])

  // Auto-load assigned teachers when institution data changes
  useEffect(() => {
    if (institution && userProfile) {
      console.log('Institution data changed, loading assigned teachers...')
      loadAssignedTeachers(userProfile.id, institution)
    }
  }, [institution, userProfile])

  // Load assigned teachers when dashboard data is initially loaded
  useEffect(() => {
    if (!loading && institution && userProfile) {
      console.log('Dashboard data loaded, loading assigned teachers...')
      loadAssignedTeachers(userProfile.id, institution)
    }
  }, [loading, institution, userProfile])

  // Additional effect to ensure teachers are loaded when institution changes
  useEffect(() => {
    if (institution && userProfile && !loading) {
      console.log('Institution data available, ensuring assigned teachers are loaded...')
      loadAssignedTeachers(userProfile.id, institution)
    }
  }, [institution, userProfile, loading])

  // Periodic refresh of assigned teachers (every 2 minutes)
  useEffect(() => {
    if (activeTab === 'teachers' && institution && userProfile) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing assigned teachers...')
        loadAssignedTeachers(userProfile.id, institution)
      }, 2 * 60 * 1000) // 2 minutes

      return () => clearInterval(interval)
    }
  }, [activeTab, institution, userProfile])

  // Real-time subscription for school_teacher changes
  useEffect(() => {
    if (!institution || !userProfile) return

    console.log('🔌 Setting up real-time subscription for school_teacher changes...')
    
    const channel = supabase
      .channel('school_teacher_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_teacher',
          filter: `school_id=eq.${institution.id}`
        },
        (payload) => {
          console.log('🔄 Real-time change detected:', payload)
          console.log('Event type:', payload.eventType)
          console.log('New record:', payload.new)
          console.log('Old record:', payload.old)
          
          // Refresh the assigned teachers list when changes occur
          if (userProfile) {
            console.log('🔄 Refreshing assigned teachers due to real-time change...')
            loadAssignedTeachers(userProfile.id, institution)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Cleaning up real-time subscription...')
      supabase.removeChannel(channel)
    }
  }, [institution, userProfile])

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
      console.log('✅ User profile loaded:', profile)

      // Email verification is handled by Supabase Auth - if user can log in, email is verified
      // No need to check email_verified field

      // Get institution data
      const { data: institutionData, error: institutionError } = await supabase
        .from('schools')
        .select('*')
        .eq('admin_id', profile.id)
        .single()

      console.log('=== DEBUGGING INSTITUTION LOADING ===')
      console.log('Profile ID:', profile.id)
      console.log('Institution query result:', { institutionData, institutionError })

      if (institutionError && institutionError.code !== 'PGRST116') {
        throw institutionError
      }

      if (institutionData) {
        console.log('✅ Found institution:', institutionData)
        setInstitution(institutionData)
        
        // IMPORTANT: Load assigned teachers immediately after setting institution
        console.log('🚀 Institution set, loading assigned teachers immediately...')
        setTimeout(() => {
          loadAssignedTeachers(profile.id, institutionData)
        }, 100) // Small delay to ensure state is set
      } else {
        console.log('❌ No institution found for admin ID:', profile.id)
        
        // Let's check what schools exist and what their admin_id values are
        const { data: allSchools, error: allSchoolsError } = await supabase
          .from('schools')
          .select('*')
        
        console.log('All schools in database:', { allSchools, allSchoolsError })
        
        // Also check if there are any schools with this admin_id
        const { data: schoolsForAdmin, error: schoolsForAdminError } = await supabase
          .from('schools')
          .select('*')
          .eq('admin_id', profile.id)
        
        console.log('Schools for this admin:', { schoolsForAdmin, schoolsForAdminError })


      }

      // Get institution requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('institution_requests')
        .select('*')
        .eq('admin_id', profile.id)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError
      setRequests(requestsData || [])

      // If no institution found by admin_id, try to find it from existing requests
      if (!institutionData && requestsData && requestsData.length > 0) {
        const requestWithSchool = requestsData.find(r => r.school_id)
        if (requestWithSchool && requestWithSchool.school_id) {
          console.log('Found school_id in existing request:', requestWithSchool.school_id)
          
          // Get the school details from this school_id
          const { data: schoolFromRequest, error: schoolFromRequestError } = await supabase
            .from('schools')
            .select('*')
            .eq('id', requestWithSchool.school_id)
            .single()
          
          console.log('School from request:', { schoolFromRequest, schoolFromRequestError })
          
          if (schoolFromRequest) {
            console.log('Setting institution from existing request')
            setInstitution(schoolFromRequest)
            
            // IMPORTANT: Load assigned teachers immediately after setting institution
            console.log('🚀 Institution set from request, loading assigned teachers immediately...')
            setTimeout(() => {
              loadAssignedTeachers(profile.id, schoolFromRequest)
            }, 100) // Small delay to ensure state is set
          }
        }
      }

      // Don't call loadAssignedTeachers here - it will be called by useEffect when institution is set

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedTeachers = async (adminId: string, institutionData: InstitutionData) => {
    console.log('=== LOAD ASSIGNED TEACHERS STARTED ===')
    console.log('Admin ID:', adminId)
    console.log('Institution data passed:', institutionData)
    console.log('Institution state:', institution)
    
    setLoadingTeachers(true)
    try {
      console.log('Loading assigned teachers for admin ID:', adminId)
      
      // Use the institution data passed to the function instead of the state
      if (!institutionData) {
        console.log('❌ No institution data passed to function, cannot load assigned teachers')
        setAssignedTeachers([])
        return
      }

      console.log('✅ Using institution data:', institutionData)
      
      // DEBUG: Let's see what's actually in the school_teacher table
      const { data: allAssignments, error: allAssignmentsError } = await supabase
        .from('school_teacher')
        .select('*')
      
      console.log('🔍 DEBUG: All school_teacher records:', { allAssignments, allAssignmentsError })
      
      // Get school_teacher assignments for this school
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('school_teacher')
        .select('*')
        .eq('school_id', institutionData.id)
        .eq('status', 'active') // Only active assignments
        .order('start_date', { ascending: false })

      console.log('Teacher assignments query result:', { assignmentsData, assignmentsError })

      if (assignmentsError) {
        console.error('❌ Error fetching teacher assignments:', assignmentsError)
        setAssignedTeachers([])
        return
      }

      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('ℹ️ No active teacher assignments found for school:', institutionData.id)
        setAssignedTeachers([])
        return
      }

      console.log('✅ Found active teacher assignments:', assignmentsData)

      // Get the profile data for each assigned tutor
      const tutorIds = assignmentsData.map(assignment => assignment.tutor_id)
      console.log('Tutor IDs to fetch:', tutorIds)
      
      // First get the tutors with their profile_id
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*') // Select all columns to see what's available
        .in('id', tutorIds)

      console.log('Tutors query result:', { tutorsData, tutorsError })
      
      // DEBUG: Let's see what columns are actually in the tutors table
      if (tutorsData && tutorsData.length > 0) {
        console.log('🔍 DEBUG: First tutor record structure:', Object.keys(tutorsData[0]))
        console.log('🔍 DEBUG: First tutor data:', tutorsData[0])
      }

      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError)
        setAssignedTeachers([])
        return
      }

      if (!tutorsData || tutorsData.length === 0) {
        console.log('No tutors found for IDs:', tutorIds)
        setAssignedTeachers([])
        return
      }

      console.log('Tutors data with subjects and experience:', tutorsData)

      // Extract profile IDs from tutors
      const profileIds = tutorsData.map(tutor => tutor.profile_id).filter(Boolean)
      console.log('Profile IDs to fetch:', profileIds)

      if (profileIds.length === 0) {
        console.log('No profile IDs found in tutors')
        setAssignedTeachers([])
        return
      }

      // Now get the profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', profileIds)

      console.log('Profiles query result:', { profilesData, profilesError })
      console.log('Found tutor profiles:', profilesData)

      // Combine the data and deduplicate by tutor_id
      const uniqueTeachers = new Map()
      
      assignmentsData.forEach(assignment => {
        // Find the tutor record
        const tutor = tutorsData?.find(t => t.id === assignment.tutor_id)
        if (!tutor) {
          console.log('No tutor found for assignment:', assignment)
          return
        }

        // Find the profile using the tutor's profile_id
        const profile = profilesData?.find(p => p.id === tutor.profile_id)
        if (!profile) {
          console.log('No profile found for tutor:', tutor)
          return
        }

        if (!uniqueTeachers.has(assignment.tutor_id)) {
          console.log('Processing tutor:', { 
            tutorId: assignment.tutor_id, 
            subjects: tutor.subjects
          })
          
          uniqueTeachers.set(assignment.tutor_id, {
            id: assignment.tutor_id,
            assignment_id: assignment.id, // Store the assignment ID for deletion
            full_name: profile.full_name || 'Unknown',
            email: profile.email || '',
            phone: profile.phone || '',
            subjects: tutor.subjects ? tutor.subjects.join(', ') : 'General Tutoring',
            experience_level: 'Experienced', // Default value since experience_years doesn't exist
            assigned_at: assignment.start_date
          })
        }
      })

      const transformedTeachers = Array.from(uniqueTeachers.values())
      console.log('Transformed teachers (deduplicated):', transformedTeachers)
      setAssignedTeachers(transformedTeachers)
    } catch (error) {
      console.error('Error loading assigned teachers:', error)
      setAssignedTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }

  const deleteTutor = async (tutorId: string, assignmentId: string) => {
    setDeletingTutorId(tutorId)

    try {
      console.log('🗑️ Starting tutor deletion process...')
      console.log('Tutor ID:', tutorId)
      console.log('Assignment ID:', assignmentId)
      console.log('Current assigned teachers count:', assignedTeachers.length)

      // Update the school_teacher assignment status to 'terminated'
      const { error: updateError } = await supabase
        .from('school_teacher')
        .update({ 
          status: 'terminated',
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', assignmentId)

      if (updateError) {
        console.error('❌ Error terminating tutor assignment:', updateError)
        alert('Failed to remove tutor. Please try again.')
        return
      }

      console.log('✅ Tutor assignment terminated successfully in database')

      // Send notification to the tutor
      await supabase
        .from('tutor_notifications')
        .insert({
          tutor_id: tutorId,
          title: 'Assignment Terminated',
          message: `Your assignment at ${institution?.name} has been terminated by the school admin.`,
          notification_type: 'institution',
          category: 'institution'
        })

      console.log('✅ Notification sent to tutor')

      // IMPORTANT: Refresh the assigned teachers list to update the count
      if (userProfile && institution) {
        console.log('🔄 Refreshing assigned teachers list...')
        await loadAssignedTeachers(userProfile.id, institution)
        console.log('✅ Assigned teachers list refreshed')
      }

      // Close the modal
      setShowDeleteModal(false)
      setTutorToDelete(null)

      alert('Tutor has been removed from your institution successfully.')
    } catch (error) {
      console.error('❌ Error deleting tutor:', error)
      alert('Failed to remove tutor. Please try again.')
    } finally {
      setDeletingTutorId(null)
    }
  }

  const confirmDeleteTutor = (teacher: AssignedTeacher) => {
    setTutorToDelete({
      id: teacher.id,
      name: teacher.full_name,
      assignmentId: teacher.assignment_id
    })
    setShowDeleteModal(true)
  }

  const openViewDetails = (teacher: AssignedTeacher) => {
    setSelectedTeacher(teacher)
    setShowViewDetailsModal(true)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewRequestForm(prev => ({
      ...prev,
      [name]: name === 'teacherCount' ? parseInt(value) || 1 : value
    }))
  }

  const submitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile) {
      alert('User profile not loaded. Please try again.')
      return
    }

    // Check if we have institution data (school record)
    if (!institution) {
      alert('School information not loaded. Please refresh the page and try again.')
      return
    }

    setIsSubmittingRequest(true)
    try {
      const requestData = {
        institution_name: institution.name,
        contact_person: userProfile.full_name || 'School Admin',
        email: userProfile.email,
        phone: institution.phone || userProfile.phone || '',
        address: institution.address || '',
        institution_type: institution.type || 'school',
        student_count: 100, // Default value
        subjects: newRequestForm.subjects,
        teacher_count: newRequestForm.teacherCount,
        start_date: new Date().toISOString().split('T')[0],
        additional_info: '',
        status: 'pending',
        admin_id: userProfile.id,
        school_id: institution.id, // Link to existing school record
        experience_level: newRequestForm.experienceLevel,
        duration: newRequestForm.duration,
        additional_requirements: newRequestForm.additionalRequirements
      }

      console.log('Submitting request with data:', requestData)
      console.log('User profile:', userProfile)
      console.log('Institution data:', institution)

      const { error } = await supabase
        .from('institution_requests')
        .insert(requestData)

      if (error) {
        console.error('Error creating request:', error)
        alert(`Failed to create request: ${error.message}`)
        return
      }

      // Reset form and close modal
      setNewRequestForm({
        subjects: '',
        experienceLevel: '',
        duration: '',
        teacherCount: 1,
        additionalRequirements: ''
      })
      setShowNewRequestModal(false)

      // Refresh requests data
      await loadDashboardData()

      alert('Tutor request created successfully! It will be reviewed by the super admin.')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request. Please try again.')
    } finally {
      setIsSubmittingRequest(false)
    }
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
                    <p className="text-2xl font-semibold text-gray-900">{assignedTeachers.length}</p>
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
                <button 
                  onClick={() => setShowNewRequestModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
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
                      <button 
                        onClick={() => setShowNewRequestModal(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
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
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Assigned Teachers</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      console.log('🔍 DEBUG: Manual refresh clicked')
                      console.log('Current state:', { institution, userProfile, assignedTeachers })
                      if (userProfile) loadAssignedTeachers(userProfile.id, institution!)
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Debug Load
                  </button>
                  <button 
                    onClick={() => userProfile && loadAssignedTeachers(userProfile.id, institution!)}
                    disabled={loadingTeachers}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingTeachers ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {loadingTeachers ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading teachers...</p>
                  </div>
                ) : deletingTutorId ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Removing tutor...</p>
                  </div>
                ) : assignedTeachers.length > 0 ? (
                  <div className="space-y-4">
                    {assignedTeachers.map((teacher) => (
                      <div key={teacher.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{teacher.full_name}</h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(teacher.experience_level)}`}>
                            {teacher.experience_level}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-sm text-gray-900">{teacher.email}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Phone</p>
                            <p className="text-sm text-gray-900">{teacher.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Subjects</p>
                            <p className="text-sm text-gray-900">{teacher.subjects}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openViewDetails(teacher)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => confirmDeleteTutor(teacher)}
                            disabled={deletingTutorId === teacher.id}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                          >
                            {deletingTutorId === teacher.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">Teachers will appear here once they are assigned to your institution.</p>
                    
                    {/* Debug Information */}
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Institution: {institution ? `✅ ${institution.name} (${institution.id})` : '❌ Not loaded'}</p>
                        <p>User Profile: {userProfile ? `✅ ${userProfile.full_name}` : '❌ Not loaded'}</p>
                        <p>Loading State: {loadingTeachers ? '🔄 Loading...' : '✅ Ready'}</p>
                        <p>Teachers Count: {assignedTeachers.length}</p>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Tutor Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitNewRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects Required *
                </label>
                <textarea
                  name="subjects"
                  value={newRequestForm.subjects}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Mathematics, English, Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Teachers Needed *
                </label>
                <input
                  type="number"
                  name="teacherCount"
                  value={newRequestForm.teacherCount}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={newRequestForm.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Experience Level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (5+ years)</option>
                  <option value="expert">Expert Level (10+ years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  name="duration"
                  value={newRequestForm.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Duration</option>
                  <option value="temporary">Temporary (1-6 months)</option>
                  <option value="contract">Contract (6-12 months)</option>
                  <option value="permanent">Permanent</option>
                  <option value="part_time">Part-time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Requirements
                </label>
                <textarea
                  name="additionalRequirements"
                  value={newRequestForm.additionalRequirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any specific requirements, qualifications, or preferences..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRequest ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tutorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Removal</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to remove <strong>{tutorToDelete.name}</strong> from your institution? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTutor(tutorToDelete.id, tutorToDelete.assignmentId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewDetailsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Teacher Details</h3>
              <button
                onClick={() => setShowViewDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experience Level</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.experience_level}</p>
                  </div>
                </div>
              </div>

              {/* Teaching Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Teaching Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Subjects</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTeacher.subjects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedTeacher.assigned_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Assignment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Assignment ID</p>
                    <p className="text-sm font-medium text-gray-900 font-mono text-xs">{selectedTeacher.assignment_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowViewDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 