'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface SuperAdminProfile {
  id: string
  full_name: string
  email: string
  role: string
}

interface SystemStats {
  totalTutors: number
  totalStudents: number
  totalRequests: number
  totalSchools: number
  pendingTutors: number
  pendingRequests: number
  totalInstitutionRequests: number
  pendingInstitutionRequests: number
  totalRevenue: number
  averageRating: number
}

interface Tutor {
  id: string
  profile_id: string
  bio: string
  subjects: string[]
  is_verified: boolean
  verification_date: string | null
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone: string
  }
}

interface HomeTutoringRequest {
  id: string
  parent_id: string
  student_name: string
  student_age: number
  grade_level: string
  subjects: string
  preferred_schedule: string
  location: string
  status: string
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone: string
  }
}

interface InstitutionRequest {
  id: string
  institution_name: string
  contact_person: string
  email: string
  phone: string
  address: string
  institution_type: string
  student_count: number
  subjects: string
  teacher_count: number
  start_date: string
  additional_info: string
  status: string
  created_at: string
  admin_id: string
  experience_level: string
  duration: string
  additional_requirements: string
  profiles: {
    full_name: string
    email: string
    phone: string
  }
  school_id?: string // Added for existing school
}

interface Student {
  id: string
  parent_id: string
  name: string
  age: number
  grade_level: string
  school_name: string
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function SuperAdminDashboard() {
  const [userProfile, setUserProfile] = useState<SuperAdminProfile | null>(null)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [requests, setRequests] = useState<HomeTutoringRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([])
  const [isLoadingTutors, setIsLoadingTutors] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isLoadingInstitutionRequests, setIsLoadingInstitutionRequests] = useState(false)

  // Matching states
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<HomeTutoringRequest | null>(null)
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([])
  const [selectedTutorId, setSelectedTutorId] = useState('')
  const [isMatching, setIsMatching] = useState(false)

  // Institution request review states
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedInstitutionRequest, setSelectedInstitutionRequest] = useState<InstitutionRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Tutor assignment states
  const [showTutorAssignmentModal, setShowTutorAssignmentModal] = useState(false)
  const [selectedInstitutionForAssignment, setSelectedInstitutionForAssignment] = useState<InstitutionRequest | null>(null)
  const [availableTutorsForInstitution, setAvailableTutorsForInstitution] = useState<Tutor[]>([])
  const [selectedTutorForInstitution, setSelectedTutorForInstitution] = useState('')
  const [isLoadingTutorsForInstitution, setIsLoadingTutorsForInstitution] = useState(false)
  const [isAssigningTutor, setIsAssigningTutor] = useState(false)

  // Filter states
  const [tutorFilter, setTutorFilter] = useState('all') // all, verified, pending
  const [requestFilter, setRequestFilter] = useState('all') // all, pending, matched
  const [institutionRequestFilter, setInstitutionRequestFilter] = useState('all') // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkSuperAdminStatus()
  }, [])

  useEffect(() => {
    if (userProfile) {
      fetchSystemStats()
      fetchTutors()
      fetchRequests()
      fetchStudents()
      fetchInstitutionRequests()
    }
  }, [userProfile])

  useEffect(() => {
    if (userProfile) {
      fetchTutors()
    }
  }, [tutorFilter, searchTerm])

  useEffect(() => {
    if (userProfile) {
      fetchInstitutionRequests()
    }
  }, [institutionRequestFilter])

  const checkSuperAdminStatus = async () => {
    try {
      // Check if super admin is logged in
      const isLoggedIn = localStorage.getItem('superAdminLoggedIn')
      const superAdminEmail = localStorage.getItem('superAdminEmail')
      
      if (!isLoggedIn || !superAdminEmail) {
        window.location.href = '/super-admin-login'
        return
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', superAdminEmail)
        .single()

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        // If profile doesn't exist in database, create a temporary one
        const tempProfile = {
          id: 'temp-super-admin',
          full_name: 'Super Admin',
          email: superAdminEmail,
          role: 'super_admin'
        }
        setUserProfile(tempProfile)
      } else {
        // Use existing profile or create super admin profile
        const superAdminProfile = {
          id: profile.id,
          full_name: profile.full_name || 'Super Admin',
          email: profile.email,
          role: 'super_admin'
        }
        setUserProfile(superAdminProfile)
      }
    } catch (error) {
      console.error('Error checking super admin status:', error)
      setError('Failed to verify super admin status')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      // Fetch total tutors
      const { count: totalTutors } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })

      // Fetch pending tutors (unverified)
      const { count: pendingTutors } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)

      // Fetch total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Fetch total requests
      const { count: totalRequests } = await supabase
        .from('home_tutoring_requests')
        .select('*', { count: 'exact', head: true })

      // Fetch pending requests
      const { count: pendingRequests } = await supabase
        .from('home_tutoring_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch total schools
      const { count: totalSchools } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })

      // Fetch total institution requests
      const { count: totalInstitutionRequests } = await supabase
        .from('institution_requests')
        .select('*', { count: 'exact', head: true })

      // Fetch pending institution requests
      const { count: pendingInstitutionRequests } = await supabase
        .from('institution_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Calculate average rating
      const { data: ratings } = await supabase
        .from('tutor_reviews')
        .select('rating')

      const averageRating = ratings && ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0

      // Calculate total revenue (simplified)
      const { data: payments } = await supabase
        .from('home_tutoring_payments')
        .select('amount')
        .eq('payment_status', 'paid')

      const totalRevenue = payments && payments.length > 0
        ? payments.reduce((sum, p) => sum + Number(p.amount), 0)
        : 0

      setSystemStats({
        totalTutors: totalTutors || 0,
        totalStudents: totalStudents || 0,
        totalRequests: totalRequests || 0,
        totalSchools: totalSchools || 0,
        pendingTutors: pendingTutors || 0,
        pendingRequests: pendingRequests || 0,
        totalInstitutionRequests: totalInstitutionRequests || 0,
        pendingInstitutionRequests: pendingInstitutionRequests || 0,
        totalRevenue: totalRevenue,
        averageRating: averageRating
      })
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const fetchTutors = async () => {
    try {
      setIsLoadingTutors(true)
      
      let query = supabase
        .from('tutors')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (tutorFilter === 'verified') {
        query = query.eq('is_verified', true)
      } else if (tutorFilter === 'pending') {
        query = query.eq('is_verified', false)
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`profiles.full_name.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tutors:', error)
        return
      }

      setTutors(data || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setIsLoadingTutors(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setIsLoadingRequests(true)
      
      let query = supabase
        .from('home_tutoring_requests')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (requestFilter === 'pending') {
        query = query.eq('status', 'pending')
      } else if (requestFilter === 'matched') {
        query = query.eq('status', 'matched')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching requests:', error)
        return
      }

      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchInstitutionRequests = async () => {
    try {
      setIsLoadingInstitutionRequests(true)
      
      let query = supabase
        .from('institution_requests')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (institutionRequestFilter === 'pending') {
        query = query.eq('status', 'pending')
      } else if (institutionRequestFilter === 'approved') {
        query = query.eq('status', 'approved')
      } else if (institutionRequestFilter === 'rejected') {
        query = query.eq('status', 'rejected')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching institution requests:', error)
        return
      }

      setInstitutionRequests(data || [])
    } catch (error) {
      console.error('Error fetching institution requests:', error)
    } finally {
      setIsLoadingInstitutionRequests(false)
    }
  }

  const verifyTutor = async (tutorId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          is_verified: verified,
          verification_date: verified ? new Date().toISOString() : null
        })
        .eq('id', tutorId)

      if (error) {
        console.error('Error updating tutor verification:', error)
        return
      }

      // Refresh data
      await fetchTutors()
      await fetchSystemStats()

      // Send notification to tutor
      const tutor = tutors.find(t => t.id === tutorId)
      if (tutor) {
        await supabase
          .from('tutor_notifications')
          .insert({
            tutor_id: tutorId,
            title: verified ? 'Account Verified' : 'Account Verification Failed',
            message: verified 
              ? 'Your tutor account has been verified. You can now start accepting sessions.'
              : 'Your tutor account verification was not approved. Please contact support.',
            notification_type: 'system',
            category: 'general'
          })
      }

      alert(`Tutor ${verified ? 'verified' : 'unverified'} successfully!`)
    } catch (error) {
      console.error('Error verifying tutor:', error)
      alert('Failed to update tutor verification status')
    }
  }

  const updateInstitutionRequestStatus = async (requestId: string, status: string) => {
    try {
      console.log('Updating institution request status:', { requestId, status })
      
      // Update only the status field (other fields don't exist in schema)
      const { error: updateError } = await supabase
        .from('institution_requests')
        .update({
          status: status
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating institution request status:', updateError)
        alert(`Failed to update status: ${updateError.message}`)
        return
      }

      console.log('Status updated successfully')

      // Refresh data
      await fetchInstitutionRequests()
      await fetchSystemStats()

      // If approved, automatically open tutor assignment modal
      if (status === 'approved') {
        const approvedRequest = institutionRequests.find(r => r.id === requestId)
        if (approvedRequest) {
          openTutorAssignmentModal(approvedRequest)
        }
      }

      alert(`Institution request ${status} successfully!`)
    } catch (error) {
      console.error('Error updating institution request status:', error)
      alert(`Failed to update institution request status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openReviewModal = (request: InstitutionRequest, action: 'review' | 'approve' | 'reject') => {
    setSelectedInstitutionRequest(request)
    setReviewNotes('')
    setShowReviewModal(true)
  }

  const openTutorAssignmentModal = async (institutionRequest: InstitutionRequest) => {
    setSelectedInstitutionForAssignment(institutionRequest)
    setSelectedTutorForInstitution('')
    setShowTutorAssignmentModal(true)
    
    // Fetch available tutors (verified tutors)
    setIsLoadingTutorsForInstitution(true)
    try {
      const { data: tutors, error } = await supabase
        .from('tutors')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching available tutors:', error)
        return
      }

      setAvailableTutorsForInstitution(tutors || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setIsLoadingTutorsForInstitution(false)
    }
  }

  const openMatchModal = async (request: HomeTutoringRequest) => {
    setSelectedRequest(request)
    setSelectedTutorId('')
    
    // Fetch available tutors (verified tutors)
    const { data: tutors, error } = await supabase
      .from('tutors')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available tutors:', error)
      return
    }

    setAvailableTutors(tutors || [])
    setShowMatchModal(true)
  }

  const matchTutorToRequest = async () => {
    if (!selectedRequest || !selectedTutorId) {
      alert('Please select a tutor to match')
      return
    }

    try {
      setIsMatching(true)

      // Update request status to matched
      const { error: requestError } = await supabase
        .from('home_tutoring_requests')
        .update({
          status: 'matched',
          matched_tutor_id: selectedTutorId
        })
        .eq('id', selectedRequest.id)

      if (requestError) {
        console.error('Error updating request:', requestError)
        alert('Failed to match tutor to request')
        return
      }

      // Create a match record
      const { error: matchError } = await supabase
        .from('tutor_student_matches')
        .insert({
          tutor_id: selectedTutorId,
          student_id: selectedRequest.parent_id, // Using parent_id as student_id for now
          request_id: selectedRequest.id,
          status: 'active',
          created_at: new Date().toISOString()
        })

      if (matchError) {
        console.error('Error creating match:', matchError)
      }

      // Send notification to tutor
      await supabase
        .from('tutor_notifications')
        .insert({
          tutor_id: selectedTutorId,
          title: 'New Student Match',
          message: `You have been matched with ${selectedRequest.student_name} for ${selectedRequest.subjects} tutoring.`,
          notification_type: 'match',
          category: 'general'
        })

      // Send notification to parent
      await supabase
        .from('parent_notifications')
        .insert({
          parent_id: selectedRequest.parent_id,
          title: 'Tutor Matched',
          message: `A tutor has been matched with ${selectedRequest.student_name} for ${selectedRequest.subjects} tutoring.`,
          notification_type: 'match',
          category: 'general'
        })

      // Refresh data
      await fetchRequests()
      await fetchSystemStats()

      setShowMatchModal(false)
      setSelectedRequest(null)
      setSelectedTutorId('')
      
      alert('Tutor matched successfully!')
    } catch (error) {
      console.error('Error matching tutor:', error)
      alert('Failed to match tutor to request')
    } finally {
      setIsMatching(false)
    }
  }

  const assignTutorToInstitution = async () => {
    if (!selectedInstitutionForAssignment || !selectedTutorForInstitution) {
      alert('Please select a tutor to assign')
      return
    }

    try {
      setIsAssigningTutor(true)

      console.log('=== DEBUGGING TUTOR ASSIGNMENT ===')
      console.log('Selected institution:', selectedInstitutionForAssignment)
      console.log('Selected tutor ID:', selectedTutorForInstitution)
      console.log('Admin ID from institution:', selectedInstitutionForAssignment.admin_id)
      console.log('School ID from institution:', selectedInstitutionForAssignment.school_id)

      if (!selectedInstitutionForAssignment.admin_id) {
        console.error('ERROR: No admin_id found in institution request!')
        alert('Cannot assign tutor: Institution request is missing admin information')
        return
      }

      if (!selectedInstitutionForAssignment.school_id) {
        console.error('ERROR: No school_id found in institution request!')
        alert('Cannot assign tutor: Institution request is missing school information')
        return
      }

      // Use the existing school record from the institution request
      const schoolId = selectedInstitutionForAssignment.school_id
      console.log('Using existing school ID:', schoolId)

      // 2. Create a school_teacher assignment
      const { error: assignmentError } = await supabase
        .from('school_teacher')
        .insert({
          school_id: schoolId,
          tutor_id: selectedTutorForInstitution,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })

      if (assignmentError) {
        console.error('Error creating teacher assignment:', assignmentError)
        alert('Failed to create teacher assignment')
        return
      }

      // 3. Update the institution request status (school_id is already set)
      const { error: updateError } = await supabase
        .from('institution_requests')
        .update({
          status: 'approved' // Keep as approved since tutor is now assigned
        })
        .eq('id', selectedInstitutionForAssignment.id)

      if (updateError) {
        console.error('Error updating institution request:', updateError)
        alert('Failed to update institution request')
        return
      }

      // 4. Send notification to the assigned tutor
      const selectedTutor = availableTutorsForInstitution.find(t => t.id === selectedTutorForInstitution)
      if (selectedTutor) {
        await supabase
          .from('tutor_notifications')
          .insert({
            tutor_id: selectedTutorForInstitution,
            title: 'New Institution Assignment',
            message: `You have been assigned to ${selectedInstitutionForAssignment.institution_name}. Please check your dashboard for details.`,
            notification_type: 'institution',
            category: 'institution'
          })
      }

      // 5. Send notification to school admin
      if (selectedInstitutionForAssignment.admin_id) {
        await supabase
          .from('school_admin_notifications')
          .insert({
            admin_id: selectedInstitutionForAssignment.admin_id,
            school_id: schoolId,
            title: 'Tutor Assigned',
            message: `A tutor has been assigned to your institution. You can now view tutor details in your dashboard.`,
            notification_type: 'teacher'
          })
      }

      // Close modal and refresh data
      setShowTutorAssignmentModal(false)
      setSelectedInstitutionForAssignment(null)
      setSelectedTutorForInstitution('')
      
      // Refresh data
      await fetchInstitutionRequests()
      await fetchSystemStats()

      alert('Tutor assigned successfully! The school admin can now see the tutor in their dashboard.')
    } catch (error) {
      console.error('Error assigning tutor:', error)
      alert('Failed to assign tutor to institution')
    } finally {
      setIsAssigningTutor(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SLL'
    }).format(amount)
  }

  const handleLogout = () => {
    // Clear login state
    localStorage.removeItem('superAdminLoggedIn')
    localStorage.removeItem('superAdminEmail')
    
    // Redirect to login page
    window.location.href = '/super-admin-login'
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tutors</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats?.totalTutors || 0}</p>
                  </div>
                </div>
                {systemStats?.pendingTutors && systemStats.pendingTutors > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    {systemStats.pendingTutors} pending verification
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserGroupIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats?.totalStudents || 0}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats?.totalRequests || 0}</p>
                  </div>
                </div>
                {systemStats?.pendingRequests && systemStats.pendingRequests > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    {systemStats.pendingRequests} pending matching
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(systemStats?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Avg Rating: {systemStats?.averageRating.toFixed(1) || '0.0'}/5
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Institution Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{systemStats?.totalInstitutionRequests || 0}</p>
                  </div>
                </div>
                {systemStats?.pendingInstitutionRequests && systemStats.pendingInstitutionRequests > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    {systemStats.pendingInstitutionRequests} pending review
                  </p>
                )}
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveSection('tutors')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AcademicCapIcon className="w-5 h-5 text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Tutors</p>
                    <p className="text-sm text-gray-500">Verify and manage tutor accounts</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('requests')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ClockIcon className="w-5 h-5 text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Process Requests</p>
                    <p className="text-sm text-gray-500">Match tutors to student requests</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('students')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Students</p>
                    <p className="text-sm text-gray-500">Browse registered students</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('institution-requests')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AcademicCapIcon className="w-5 h-5 text-indigo-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Review Institutions</p>
                    <p className="text-sm text-gray-500">Process institution requests</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'tutors':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tutor Management</h2>
              <div className="flex space-x-4">
                <select
                  value={tutorFilter}
                  onChange={(e) => setTutorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tutors</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Verification</option>
                </select>
                <input
                  type="text"
                  placeholder="Search tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tutors List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isLoadingTutors ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading tutors...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tutors.map((tutor) => (
                        <tr key={tutor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tutor.profiles.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {tutor.profiles.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : tutor.subjects}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tutor.is_verified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tutor.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(tutor.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!tutor.is_verified ? (
                              <button
                                onClick={() => verifyTutor(tutor.id, true)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Verify
                              </button>
                            ) : (
                              <button
                                onClick={() => verifyTutor(tutor.id, false)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Unverify
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case 'requests':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tutoring Requests</h2>
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
              </select>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isLoadingRequests ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Grade {request.grade_level} • Age {request.student_age}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.profiles.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.profiles.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {request.subjects}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'matched'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                             {request.status === 'pending' && (
                               <button 
                                 onClick={() => openMatchModal(request)}
                                 className="text-blue-600 hover:text-blue-900"
                               >
                                 Match Tutor
                               </button>
                             )}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case 'students':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isLoadingStudents ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading students...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Age {student.age}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.profiles.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.profiles.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.grade_level}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.school_name || 'Not specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(student.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      case 'institution-requests':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Institution Requests</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'all', name: 'All' },
                { id: 'pending', name: 'Pending' },
                { id: 'approved', name: 'Approved' },
                { id: 'rejected', name: 'Rejected' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setInstitutionRequestFilter(filter.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    institutionRequestFilter === filter.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>

            {/* Institution Requests List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isLoadingInstitutionRequests ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading institution requests...</p>
                </div>
              ) : institutionRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No institution requests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institution
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requirements
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {institutionRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.institution_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.institution_type}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.contact_person}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div><strong>Subjects:</strong> {request.subjects}</div>
                              <div><strong>Teachers:</strong> {request.teacher_count}</div>
                              <div><strong>Students:</strong> {request.student_count}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => openReviewModal(request, 'review')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Review
                                </button>
                                <button 
                                  onClick={() => updateInstitutionRequestStatus(request.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => updateInstitutionRequestStatus(request.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a section from the navigation</p>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CogIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Super Admin</p>
                <p className="font-medium text-gray-900">{userProfile?.full_name}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CogIcon className="w-6 h-6 text-blue-600" />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'tutors', name: 'Tutors', icon: AcademicCapIcon },
              { id: 'requests', name: 'Requests', icon: ClockIcon },
              { id: 'students', name: 'Students', icon: UserGroupIcon },
              { id: 'institution-requests', name: 'Institution Requests', icon: AcademicCapIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

             {/* Main Content */}
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {renderSectionContent()}
       </main>

       {/* Match Tutor Modal */}
       {showMatchModal && selectedRequest && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold text-gray-900">
                 Match Tutor to Request
               </h3>
               <button
                 onClick={() => setShowMatchModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XCircleIcon className="w-6 h-6" />
               </button>
             </div>

             <div className="mb-6">
               <h4 className="font-medium text-gray-900 mb-2">Request Details:</h4>
               <div className="bg-gray-50 rounded-lg p-4">
                 <p><strong>Student:</strong> {selectedRequest.student_name}</p>
                 <p><strong>Subjects:</strong> {selectedRequest.subjects}</p>
                 <p><strong>Grade Level:</strong> {selectedRequest.grade_level}</p>
                 <p><strong>Location:</strong> {selectedRequest.location}</p>
               </div>
             </div>

             <div className="mb-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Select a Tutor:
               </label>
               <select
                 value={selectedTutorId}
                 onChange={(e) => setSelectedTutorId(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="">Choose a tutor...</option>
                 {availableTutors.map((tutor) => (
                   <option key={tutor.id} value={tutor.id}>
                     {tutor.profiles.full_name} - {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : tutor.subjects}
                   </option>
                 ))}
               </select>
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => setShowMatchModal(false)}
                 className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Cancel
               </button>
               <button
                 onClick={matchTutorToRequest}
                 disabled={!selectedTutorId || isMatching}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isMatching ? 'Matching...' : 'Match Tutor'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Institution Request Review Modal */}
       {showReviewModal && selectedInstitutionRequest && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold text-gray-900">
                 Review Institution Request
               </h3>
               <button
                 onClick={() => setShowReviewModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XCircleIcon className="w-6 h-6" />
               </button>
             </div>

             <div className="mb-6">
               <h4 className="font-medium text-gray-900 mb-2">Request Details:</h4>
               <div className="bg-gray-50 rounded-lg p-4">
                 <p><strong>Institution:</strong> {selectedInstitutionRequest.institution_name}</p>
                 <p><strong>Contact Person:</strong> {selectedInstitutionRequest.contact_person}</p>
                 <p><strong>Email:</strong> {selectedInstitutionRequest.email}</p>
                 <p><strong>Phone:</strong> {selectedInstitutionRequest.phone}</p>
                 <p><strong>Address:</strong> {selectedInstitutionRequest.address}</p>
                 <p><strong>Type:</strong> {selectedInstitutionRequest.institution_type}</p>
                 <p><strong>Subjects:</strong> {selectedInstitutionRequest.subjects}</p>
                 <p><strong>Teachers:</strong> {selectedInstitutionRequest.teacher_count}</p>
                 <p><strong>Students:</strong> {selectedInstitutionRequest.student_count}</p>
                 <p><strong>Start Date:</strong> {formatDate(selectedInstitutionRequest.start_date)}</p>
                 <p><strong>Duration:</strong> {selectedInstitutionRequest.duration}</p>
                 <p><strong>Additional Info:</strong> {selectedInstitutionRequest.additional_info}</p>
                 <p><strong>Additional Requirements:</strong> {selectedInstitutionRequest.additional_requirements}</p>
               </div>
             </div>

             <div className="mb-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Review Notes:
               </label>
               <textarea
                 value={reviewNotes}
                 onChange={(e) => setReviewNotes(e.target.value)}
                 rows={4}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               ></textarea>
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => setShowReviewModal(false)}
                 className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Cancel
               </button>
               <button
                 onClick={() => {
                   updateInstitutionRequestStatus(selectedInstitutionRequest.id, 'approved')
                   setShowReviewModal(false)
                   setSelectedInstitutionRequest(null)
                   setReviewNotes('')
                 }}
                 disabled={isUpdatingStatus}
                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Approve
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Tutor Assignment Modal */}
       {showTutorAssignmentModal && selectedInstitutionForAssignment && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold text-gray-900">
                 Assign Tutor to Institution
               </h3>
               <button
                 onClick={() => setShowTutorAssignmentModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XCircleIcon className="w-6 h-6" />
               </button>
             </div>

             <div className="mb-6">
               <h4 className="font-medium text-gray-900 mb-2">Institution Details:</h4>
               <div className="bg-gray-50 rounded-lg p-4">
                 <p><strong>Institution:</strong> {selectedInstitutionForAssignment.institution_name}</p>
                 <p><strong>Contact Person:</strong> {selectedInstitutionForAssignment.contact_person}</p>
                 <p><strong>Email:</strong> {selectedInstitutionForAssignment.email}</p>
                 <p><strong>Phone:</strong> {selectedInstitutionForAssignment.phone}</p>
                 <p><strong>Address:</strong> {selectedInstitutionForAssignment.address}</p>
                 <p><strong>Type:</strong> {selectedInstitutionForAssignment.institution_type}</p>
                 <p><strong>Subjects:</strong> {selectedInstitutionForAssignment.subjects}</p>
                 <p><strong>Teachers:</strong> {selectedInstitutionForAssignment.teacher_count}</p>
                 <p><strong>Students:</strong> {selectedInstitutionForAssignment.student_count}</p>
                 <p><strong>Start Date:</strong> {formatDate(selectedInstitutionForAssignment.start_date)}</p>
                 <p><strong>Duration:</strong> {selectedInstitutionForAssignment.duration}</p>
                 <p><strong>Additional Info:</strong> {selectedInstitutionForAssignment.additional_info}</p>
                 <p><strong>Additional Requirements:</strong> {selectedInstitutionForAssignment.additional_requirements}</p>
               </div>
             </div>

             <div className="mb-6">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Select a Tutor:
               </label>
               <select
                 value={selectedTutorForInstitution}
                 onChange={(e) => setSelectedTutorForInstitution(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="">Choose a tutor...</option>
                 {availableTutorsForInstitution.map((tutor) => (
                   <option key={tutor.id} value={tutor.id}>
                     {tutor.profiles.full_name} - {Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : tutor.subjects}
                   </option>
                 ))}
               </select>
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => setShowTutorAssignmentModal(false)}
                 className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Cancel
               </button>
               <button
                 onClick={assignTutorToInstitution}
                 disabled={!selectedTutorForInstitution || isAssigningTutor}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isAssigningTutor ? 'Assigning...' : 'Assign Tutor'}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 } 