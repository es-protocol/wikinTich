'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { 
  AcademicCapIcon, 
  UserIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  BookOpenIcon,
  StarIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface TutorProfile {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
}

interface TutorData {
  id: string
  profile_id: string
  bio: string
  subjects: string[]
  availability: any
  is_verified: boolean
  verification_date: string | null
}

interface Qualification {
  id: string
  qualification_type: string
  title: string
  institution: string
  year_obtained: number
  is_verified: boolean
}

interface InstitutionSession {
  id: string
  school_id: string
  tutor_id: string
  assignment_id: string
  session_date: string
  session_time: string
  status: string
  hours_worked: number
  session_notes: string
  school_name: string
}

interface HomeTutoringSession {
  id: string
  request_id: string | null  // Make nullable to distinguish between parent and tutor created sessions
  tutor_id: string
  session_date: string
  start_time: string
  end_time: string
  duration_hours: number
  amount: number
  status: string
  notes: string
  student_id: string
  student_name: string
  created_by?: string  // Add this field to track who created the session
}

interface Payment {
  id: string
  tutor_id: string
  payment_type: string
  amount: number
  payment_date: string
  status: string
  payment_method: string
  transaction_reference: string
}

interface Performance {
  id: string
  tutor_id: string
  total_hours: number
  average_rating: number
  overall_attendance_rate: number
  active_institution_assignments: number
  active_home_assignments: number
}

interface Notification {
  id: string
  tutor_id: string
  title: string
  message: string
  notification_type: string
  category: string
  is_read: boolean
  created_at: string
}

interface Session {
  id: string
  request_id: string | null
  tutor_id: string
  student_id: string
  session_date: string
  start_time: string
  end_time: string
  duration_hours: number
  amount: number
  status: 'scheduled' | 'approved' | 'completed' | 'cancelled' | 'no_show'  // Added 'approved' status
  notes: string | null
  created_at: string
  updated_at: string | null
}

export default function TutorDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [tutorData, setTutorData] = useState<TutorData | null>(null)
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [institutionSessions, setInstitutionSessions] = useState<InstitutionSession[]>([])
  const [homeTutoringSessions, setHomeTutoringSessions] = useState<HomeTutoringSession[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [matchedStudents, setMatchedStudents] = useState<any[]>([])
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    subjects: '',
    availability: ''
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)

  // Loading states for different sections
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  // Session proposal states
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [showProposeSessionModal, setShowProposeSessionModal] = useState(false)
  const [proposeSessionForm, setProposeSessionForm] = useState({
    session_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionFilter, setSessionFilter] = useState<string>('all')

  const { user, isLoading: authLoading, logout } = useAuth()

  useEffect(() => {
    console.log('Debug: useEffect triggered')
    console.log('Debug: authLoading =', authLoading)
    console.log('Debug: user =', user)
    console.log('Debug: user?.role =', user?.role)
    
    // Load dashboard data when user is authenticated and has correct role
    if (!authLoading && user && user.role === 'tutor') {
      console.log('Debug: Conditions met, calling loadDashboardData()')
      loadDashboardData()
    } else {
      console.log('Debug: Conditions not met, not calling loadDashboardData()')
    }
  }, [user, authLoading])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close profile dropdown
      if (showProfileDropdown && !target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false)
      }
      
      // Close notifications dropdown
      if (showNotificationsDropdown && !target.closest('.notifications-dropdown')) {
        setShowNotificationsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown, showNotificationsDropdown])



  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')
      console.log('Debug: loadDashboardData started')
      console.log('Debug: user =', user)
      console.log('Debug: user?.id =', user?.id)
      
      if (!user) {
        console.log('Debug: No user found, returning early')
        return
      }

      console.log('Debug: Fetching profile for user ID:', user.id)

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      console.log('Debug: Profile query result:', { profile, profileError })

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        setError('Failed to load profile data')
        return
      }

      console.log('Debug: Profile loaded successfully:', profile)
      setUserProfile(profile)

      // Get tutor data
      console.log('Debug: Fetching tutor data for profile_id:', profile.id)
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      console.log('Debug: Tutor query result:', { tutor, tutorError })

      if (tutorError) {
        console.error('Tutor data error:', tutorError)
        setError('Failed to load tutor data')
        return
      }

      console.log('Debug: Tutor data loaded successfully:', tutor)
      setTutorData(tutor)

      // Get qualifications
      if (tutor) {
        console.log('Debug: Fetching qualifications for tutor_id:', tutor.id)
        const { data: quals, error: qualsError } = await supabase
          .from('tutor_qualifications')
          .select('*')
          .eq('tutor_id', tutor.id)

        console.log('Debug: Qualifications query result:', { quals, qualsError })

        if (qualsError) {
          console.error('Qualifications error:', qualsError)
        } else {
          setQualifications(quals || [])
        }
      }

      // IMPORTANT: Pass tutor data directly to functions instead of relying on state
      console.log('Debug: About to call fetchSessions()')
      // Fetch sessions - pass tutor data directly
      await fetchSessions(tutor)
      console.log('Debug: fetchSessions() completed')
      
      console.log('Debug: About to call fetchPayments()')
      await fetchPayments(tutor)
      console.log('Debug: fetchPayments() completed')
      
      console.log('Debug: About to call fetchPerformance()')
      await fetchPerformance(tutor)
      console.log('Debug: fetchPerformance() completed')
      
      console.log('Debug: About to call fetchNotifications()')
      await fetchNotifications(tutor)
      console.log('Debug: fetchNotifications() completed')
      
      console.log('Debug: About to call fetchMatchedStudents()')
      await fetchMatchedStudents(tutor)
      console.log('Debug: fetchMatchedStudents() completed')

      // Load profile data into form for editing
      const formData = {
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        bio: tutor?.bio || '',
        subjects: tutor?.subjects ? Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : String(tutor.subjects) : '',
        availability: tutor?.availability ? JSON.stringify(tutor.availability) : ''
      }
      setProfileFormData(formData)
      console.log('Debug: loadDashboardData completed successfully')

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }



  const fetchSessions = async (tutor: TutorData) => {
    try {
      setIsLoadingSessions(true)
      
      if (!tutor) return

      console.log('Debug: fetchSessions - tutorData.id =', tutor.id)
      console.log('Debug: fetchSessions - tutorData.profile_id =', tutor.profile_id)

      // Fetch institution sessions
      const { data: instSessions, error: instError } = await supabase
        .from('teacher_attendance')
        .select(`
          *,
          schools!inner(name)
        `)
        .eq('tutor_id', tutor.id)
        .order('session_date', { ascending: false })

      if (instError) {
        console.error('Error fetching institution sessions:', instError)
      } else {
        console.log('Debug: Institution sessions found:', instSessions)
        setInstitutionSessions(instSessions || [])
      }

      // Fetch home tutoring sessions
      const { data: homeSessions, error: homeError } = await supabase
        .from('home_tutoring_sessions')
        .select(`
          *,
          home_tutoring_requests!inner(student_name)
        `)
        .eq('tutor_id', tutor.id)
        .order('session_date', { ascending: false })

      if (homeError) {
        console.error('Error fetching home tutoring sessions:', homeError)
      } else {
        console.log('Debug: Home tutoring sessions found:', homeSessions)
        console.log('Debug: Number of home tutoring sessions:', homeSessions?.length || 0)
        setHomeTutoringSessions(homeSessions || [])
      }

      // Debug: Let's also check what sessions exist for any tutor
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('home_tutoring_sessions')
        .select('*')
        .limit(10)

      if (allSessionsError) {
        console.error('Error fetching all sessions:', allSessionsError)
      } else {
        console.log('Debug: All sessions in database:', allSessions)
        console.log('Debug: Number of all sessions:', allSessions?.length || 0)
        
        // Check if any of these sessions have the right tutor_id
        const sessionsForThisTutor = allSessions?.filter(s => s.tutor_id === tutor.id) || []
        console.log('Debug: Sessions for this tutor (from all sessions):', sessionsForThisTutor)
        console.log('Debug: Number of sessions for this tutor:', sessionsForThisTutor.length)
      }

    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const fetchPayments = async (tutor: TutorData) => {
    try {
      setIsLoadingPayments(true)
      
      if (!tutor) return

      const { data: paymentData, error } = await supabase
        .from('tutor_payments')
        .select('*')
        .eq('tutor_id', tutor.id)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('Error fetching payments:', error)
      } else {
        setPayments(paymentData || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const fetchPerformance = async (tutor: TutorData) => {
    try {
      setIsLoadingPerformance(true)
      
      if (!tutor) return

      const { data: perfData, error } = await supabase
        .from('tutor_performance')
        .select('*')
        .eq('tutor_id', tutor.id)
        .single()

      if (error) {
        console.error('Error fetching performance:', error)
      } else {
        setPerformance(perfData)
      }
    } catch (error) {
      console.error('Error fetching performance:', error)
    } finally {
      setIsLoadingPerformance(false)
    }
  }

  const fetchNotifications = async (tutor: TutorData) => {
    try {
      setIsLoadingNotifications(true)
      
      if (!tutor) return

      const { data: notifData, error } = await supabase
        .from('tutor_notifications')
        .select('*')
        .eq('tutor_id', tutor.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(notifData || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const fetchMatchedStudents = async (tutor: TutorData) => {
    try {
      console.log('Debug: fetchMatchedStudents started')
      console.log('Debug: tutor.id =', tutor.id)
      
      if (!tutor) return

      // Get accepted tutor proposals to find matched students
      console.log('Debug: Fetching accepted tutor proposals for tutor_id:', tutor.id)
      const { data: acceptedProposals, error: proposalsError } = await supabase
        .from('tutor_proposals')
        .select(`
          student_id,
          students!inner(name, parent_id),
          profiles!inner(full_name)
        `)
        .eq('tutor_id', tutor.id)
        .eq('status', 'accepted')

      console.log('Debug: Accepted proposals query result:', { acceptedProposals, proposalsError })

      if (proposalsError) {
        console.error('Error fetching matched students:', proposalsError)
        return
      }

      // Get home tutoring requests for additional context
      console.log('Debug: Fetching home tutoring requests with matched_tutor_id:', tutor.id)
      const { data: requests, error: requestsError } = await supabase
        .from('home_tutoring_requests')
        .select('student_id, subjects, matched_tutor_id, status')
        .eq('matched_tutor_id', tutor.id)

      console.log('Debug: Home tutoring requests query result:', { requests, requestsError })

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
      }

      // Let's also check ALL tutor proposals for this tutor to see what exists
      console.log('Debug: Fetching ALL tutor proposals for tutor_id:', tutor.id)
      const { data: allProposals, error: allProposalsError } = await supabase
        .from('tutor_proposals')
        .select('student_id, status, created_at')
        .eq('tutor_id', tutor.id)

      console.log('Debug: All proposals query result:', { allProposals, allProposalsError })

      // Let's also check ALL home tutoring requests to see if any have this tutor as matched
      console.log('Debug: Fetching ALL home tutoring requests to check for matches')
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('home_tutoring_requests')
        .select('id, student_id, matched_tutor_id, status')
        .limit(20)

      console.log('Debug: All requests query result:', { allRequests, allRequestsError })

      // Combine data to create matched students list
      let students = acceptedProposals?.map(proposal => {
        const request = requests?.find(r => r.student_id === proposal.student_id)
        return {
          student_id: proposal.student_id,
          student_name: (proposal.students as any).name,
          parent_id: (proposal.students as any).parent_id,
          parent_name: (proposal.profiles as any).full_name,
          subjects: request?.subjects || 'General'
        }
      }) || []

      // If no students found through proposals, try to find them through home tutoring requests
      if (students.length === 0 && requests && requests.length > 0) {
        console.log('Debug: No students found through proposals, trying to find through requests')
        
        // Get student details for the requests that have this tutor as matched_tutor_id
        const studentIds = requests.map(r => r.student_id)
        console.log('Debug: Student IDs from requests:', studentIds)
        
        if (studentIds.length > 0) {
          const { data: studentDetails, error: studentDetailsError } = await supabase
            .from('students')
            .select(`
              id,
              name,
              parent_id,
              profiles!inner(full_name)
            `)
            .in('id', studentIds)

          console.log('Debug: Student details query result:', { studentDetails, studentDetailsError })

          if (studentDetails && !studentDetailsError) {
            students = studentDetails.map(student => {
              const request = requests.find(r => r.student_id === student.id)
              return {
                student_id: student.id,
                student_name: student.name,
                parent_id: student.parent_id,
                parent_name: (student.profiles as any).full_name,
                subjects: request?.subjects || 'General'
              }
            })
            console.log('Debug: Students found through requests:', students)
          }
        }
      }

      console.log('Debug: Final matched students list:', students)
      console.log('Debug: Number of matched students:', students.length)

      setMatchedStudents(students)
      
      // Auto-select first student if available
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0].student_id)
        console.log('Debug: Auto-selected first student:', students[0].student_id)
      }
    } catch (error) {
      console.error('Error fetching matched students:', error)
    }
  }

  const loadProfileData = async () => {
    try {
      if (!tutorData) return

      // Load profile data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tutorData.profile_id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
      }

      // Load tutor-specific data
      const { data: tutorProfile, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', tutorData.id)
        .single()

      if (tutorError) {
        console.error('Error loading tutor profile:', tutorError)
      }

      // Populate form with existing data
      const formData = {
        fullName: profile?.full_name || userProfile?.full_name || '',
        email: profile?.email || userProfile?.email || '',
        phone: profile?.phone || '',
        bio: tutorProfile?.bio || tutorData?.bio || '',
        subjects: (() => {
          // Handle subjects from tutorProfile first
          if (tutorProfile?.subjects) {
            return Array.isArray(tutorProfile.subjects) ? tutorProfile.subjects.join(', ') : String(tutorProfile.subjects)
          }
          // Handle subjects from tutorData as fallback
          if (tutorData?.subjects) {
            return Array.isArray(tutorData.subjects) ? tutorData.subjects.join(', ') : String(tutorData.subjects)
          }
          return ''
        })(),
        availability: (() => {
          const availability = tutorProfile?.availability || tutorData?.availability || ''
          // Handle case where availability is an object
          if (typeof availability === 'object' && availability !== null) {
            // If it's an object, return empty string to start fresh
            return ''
          }
          return availability ? availability.toString() : ''
        })()
      }

      setProfileFormData(formData)
    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tutorData) return

    try {
      setIsUpdatingProfile(true)

      console.log('Updating profile with data:', profileFormData)
      console.log('Tutor ID:', tutorData.id)

      // Validate required fields
      if (!profileFormData.fullName.trim()) {
        alert('Full name is required')
        return
      }

      // Update profiles table
      console.log('Updating profiles table with:', {
        full_name: profileFormData.fullName.trim(),
        phone: profileFormData.phone.trim() || null
      })
      
      const { data: profileUpdateData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileFormData.fullName.trim(),
          phone: profileFormData.phone.trim() || null
        })
        .eq('id', tutorData.profile_id)
        .select() // This returns the updated data

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error(`Profile update failed: ${profileError.message}`)
      }
      
      console.log('Profile update successful:', profileUpdateData)

      // Prepare tutor data - ensure subjects is an array
      const subjectsArray = Array.isArray(profileFormData.subjects) 
        ? profileFormData.subjects 
        : profileFormData.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0)

      // Prepare availability - ensure it's a string
      const availabilityString = typeof profileFormData.availability === 'object' 
        ? JSON.stringify(profileFormData.availability)
        : profileFormData.availability || ''

      console.log('Subjects array:', subjectsArray)
      console.log('Availability string:', availabilityString)

      // Update tutors table
      console.log('Updating tutors table with:', {
        bio: profileFormData.bio.trim() || null,
        subjects: subjectsArray,
        availability: availabilityString.trim() || null
      })
      
      const { data: tutorUpdateData, error: tutorError } = await supabase
        .from('tutors')
        .update({
          bio: profileFormData.bio.trim() || null,
          subjects: subjectsArray.length > 0 ? subjectsArray : null,
          availability: availabilityString.trim() || null
        })
        .eq('id', tutorData.id)
        .select() // This returns the updated data

      if (tutorError) {
        console.error('Tutor update error:', tutorError)
        throw new Error(`Tutor profile update failed: ${tutorError.message}`)
      }
      
      console.log('Tutor update successful:', tutorUpdateData)

      // Immediately update the UI state with the form data we just submitted
      const updatedUserProfile: TutorProfile = {
        ...userProfile!,
        full_name: profileFormData.fullName.trim(),
        phone: profileFormData.phone.trim() || ''
      }
      
      const updatedTutorProfile: TutorData = {
        ...tutorData,
        bio: profileFormData.bio.trim() || '',
        subjects: subjectsArray,
        availability: availabilityString.trim() || ''
      }
      
      console.log('Immediately updating UI state...')
      console.log('New userProfile:', updatedUserProfile)
      console.log('New tutorData:', updatedTutorProfile)
      
      // Update states immediately with the submitted data for instant UI feedback
      setUserProfile(updatedUserProfile)
      setTutorData(updatedTutorProfile)
      setLastUpdate(Date.now())
      
      // Close modal and show success
      setShowProfileModal(false)
      alert('Profile updated successfully!')
      
      // IMPORTANT: Also refresh from database to ensure persistence
      // This happens in the background after the UI already updated
      setTimeout(async () => {
        console.log('Verifying database updates...')
        
        // Refresh from database to ensure data persistence
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', tutorData.profile_id)
          .single()
          
        const { data: verifyTutor } = await supabase
          .from('tutors')
          .select('*')
          .eq('id', tutorData.id)
          .single()
        
        if (verifyProfile) {
          console.log('Database profile verified:', verifyProfile)
          setUserProfile(verifyProfile)
        }
        
        if (verifyTutor) {
          console.log('Database tutor verified:', verifyTutor)
          setTutorData(verifyTutor)
        }
        
        console.log('Database verification complete')
      }, 500) // Small delay to let UI update first
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update profile: ${errorMessage}`)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const scheduleSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !tutorData) return

    try {
      setIsSubmitting(true)

      // Find the request for this student
      const request = await supabase
        .from('home_tutoring_requests')
        .select('id')
        .eq('student_id', selectedStudent)
        .eq('matched_tutor_id', tutorData.id)
        .single()

      if (request.error || !request.data) {
        throw new Error('No matching request found')
      }

      // Calculate duration
      const startTime = new Date(`2000-01-01T${proposeSessionForm.start_time}`)
      const endTime = new Date(`2000-01-01T${proposeSessionForm.end_time}`)
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

             // Create session proposal - Add created_by field to distinguish tutor-created sessions
       const { error: sessionError } = await supabase
         .from('home_tutoring_sessions')
         .insert({
           request_id: request.data.id, // Use the actual request ID for tutor-created sessions
           tutor_id: tutorData.id,
           student_id: selectedStudent,
           session_date: proposeSessionForm.session_date,
           start_time: proposeSessionForm.start_time,
           end_time: proposeSessionForm.end_time,
           duration_hours: durationHours,
           amount: 70000, // Add default amount in Sierra Leone Leones (SLL)
           status: 'scheduled', // Use 'scheduled' instead of 'proposed' to match database constraint
           notes: proposeSessionForm.notes,
           created_by: 'tutor' // Add this field to distinguish tutor-created sessions
         })

      if (sessionError) {
        throw sessionError
      }

      // Create notification for parent
      const student = matchedStudents.find(s => s.student_id === selectedStudent)
      if (student) {
        await supabase
          .from('parent_notifications')
          .insert({
            parent_id: student.parent_id,
            title: 'New Session Scheduled',
            message: `Tutor has scheduled a new session for ${student.student_name} on ${formatDate(proposeSessionForm.session_date)}`,
            notification_type: 'session'
          })
      }

      // Reset form and close modal
      setProposeSessionForm({
        session_date: '',
        start_time: '',
        end_time: '',
        notes: ''
      })
      setShowProposeSessionModal(false)
      
      // Refresh sessions
      if (tutorData) {
        await fetchSessions(tutorData)
      }
      
      alert('Session scheduled successfully!')
    } catch (error) {
      console.error('Error scheduling session:', error)
      alert('Failed to schedule session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSession = (session: HomeTutoringSession) => {
    // TODO: Implement session editing functionality
    console.log('Edit session:', session)
    alert('Session editing functionality coming soon!')
  }

  const handleSessionAction = async (sessionId: string, action: 'approve' | 'reject' | 'cancel') => {
    try {
      setIsSubmitting(true)
      
      // Fix: Use correct status values - 'approved' for approve, 'cancelled' for reject/cancel
      const newStatus = action === 'approve' ? 'approved' : 'cancelled'
      
      console.log(`Debug: Updating session ${sessionId} to status: ${newStatus}`)
      
      const { data, error } = await supabase
        .from('home_tutoring_sessions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()

      if (error) {
        console.error(`Error ${action}ing session:`, error)
        alert(`Error ${action}ing session: ${error.message}`)
        return
      }

      console.log(`Session ${action}d successfully:`, data)
      
             // Create notification for parent when tutor approves/rejects their session
       try {
         const session = homeTutoringSessions.find(s => s.id === sessionId)
         if (session && session.created_by !== 'tutor') {
           // This is a parent-created session, find the parent through the request
           const { data: requestData } = await supabase
             .from('home_tutoring_requests')
             .select('parent_id, student_id')
             .eq('id', session.request_id)
             .single()
           
           if (requestData) {
             await supabase
               .from('parent_notifications')
               .insert({
                 parent_id: requestData.parent_id,
                 title: `Session ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                 message: `Your session for ${formatDate(session.session_date)} has been ${action === 'approve' ? 'approved' : 'rejected'} by the tutor.`,
                 notification_type: 'session'
               })
           }
         }
       } catch (notifError) {
         console.error('Error creating parent notification:', notifError)
         // Don't fail the session action if notification fails
       }
      
      // Show success message
      const actionText = action === 'cancel' ? 'cancelled' : action === 'approve' ? 'approved' : 'rejected'
      alert(`Session ${actionText} successfully!`)
      
      // Refresh the dashboard data to show updated status
      await loadDashboardData()
      
    } catch (error) {
      console.error(`Error ${action}ing session:`, error)
      alert(`Error ${action}ing session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      if (!notification.is_read) {
        const { error } = await supabase
          .from('tutor_notifications')
          .update({ is_read: true })
          .eq('id', notification.id)

        if (error) {
          console.error('Error marking notification as read:', error)
        } else {
          // Update local state
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          )
        }
      }

      // Close dropdown
      setShowNotificationsDropdown(false)

      // Handle different notification types
      switch (notification.notification_type) {
        case 'home_tutoring':
          // Switch to sessions tab and show relevant session
          setActiveSection('sessions')
          break
        case 'session':
          // Switch to sessions tab
          setActiveSection('sessions')
          break
        default:
          // For other types, just close the dropdown
          break
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      if (!tutorData) return

      // Mark all notifications as read in database
      const { error } = await supabase
        .from('tutor_notifications')
        .update({ is_read: true })
        .eq('tutor_id', tutorData.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
      } else {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const formatAvailability = (availability: any) => {
    if (!availability) return 'Not set'
    
    const days = Object.entries(availability)
      .filter(([_, data]: [string, any]) => data.available)
      .map(([day, data]: [string, any]) => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1)
        return `${dayName}: ${data.hours || 'All day'}`
      })
    
    return days.length > 0 ? days.join(', ') : 'Not set'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (durationHours: number) => {
    const hours = Math.floor(durationHours)
    const minutes = Math.round((durationHours - hours) * 60)
    
    if (hours === 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`
    } else if (minutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`
    } else {
      return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalEarnings = () => {
    return payments
      .filter(p => p.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0)
  }

  const getUpcomingSessions = () => {
    const today = new Date()
    const upcoming = [...institutionSessions, ...homeTutoringSessions]
      .filter(session => new Date(session.session_date) >= today)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    
    return upcoming.slice(0, 5) // Return next 5 sessions
  }

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.is_read)
  }

  const getFilteredSessions = () => {
    if (!selectedStudent) return homeTutoringSessions // Show all sessions when no student is selected
    return homeTutoringSessions.filter(session => session.student_id === selectedStudent)
  }

  const getScheduledSessions = () => {
    console.log('Debug: getScheduledSessions called')
    console.log('Debug: selectedStudent =', selectedStudent)
    console.log('Debug: homeTutoringSessions =', homeTutoringSessions)
    console.log('Debug: Number of homeTutoringSessions:', homeTutoringSessions?.length || 0)
    
    const filteredSessions = getFilteredSessions()
    console.log('Debug: filteredSessions =', filteredSessions)
    console.log('Debug: Number of filteredSessions:', filteredSessions?.length || 0)
    
    // Show sessions that need approval (scheduled), are approved, or completed
    // According to updated schema: ['scheduled', 'approved', 'completed', 'cancelled', 'no_show']
    const scheduledSessions = filteredSessions.filter(session => 
      session.status === 'scheduled' || session.status === 'approved' || session.status === 'completed'
    )
    
    console.log('Debug: scheduledSessions =', scheduledSessions)
    console.log('Debug: Number of scheduledSessions:', scheduledSessions?.length || 0)
    
    return scheduledSessions
  }

  const getFilteredSessionsByStatus = () => {
    const baseFilteredSessions = getFilteredSessions()
    if (sessionFilter === 'all') return baseFilteredSessions
    return baseFilteredSessions.filter(session => session.status === sessionFilter)
  }

  const getCompletedSessions = () => {
    return getFilteredSessions().filter(session => session.status === 'completed')
  }

  const getSelectedStudentName = () => {
    const student = matchedStudents.find(s => s.student_id === selectedStudent)
    return student ? student.student_name : 'Unknown Student'
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-10 h-10 text-primary-600" />
                  </div>
                  <h2 key={`name-${lastUpdate}`} className="text-xl font-bold text-gray-900">{userProfile?.full_name || 'Loading...'}</h2>
                  <p className="text-gray-600">Qualified Tutor</p>
                  <div className="flex items-center justify-center mt-2">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {performance?.average_rating ? `${performance.average_rating.toFixed(1)}/5` : 'New Profile'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{userProfile?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 text-gray-400 mr-3" />
                    <span key={`phone-${lastUpdate}`} className="text-sm text-gray-600">{userProfile?.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Hours</span>
                    <span className="font-semibold text-gray-900">{performance?.total_hours || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold text-gray-900">
                      {performance?.average_rating ? `${performance.average_rating.toFixed(1)}/5` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-green-600">SLL {getTotalEarnings().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Assignments</span>
                    <span className="font-semibold text-gray-900">
                      {(performance?.active_institution_assignments || 0) + (performance?.active_home_assignments || 0)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
                  Upcoming Sessions
                </h3>
                {isLoadingSessions ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading sessions...</p>
                  </div>
                ) : getUpcomingSessions().length === 0 ? (
                  <p className="text-gray-500">No upcoming sessions scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingSessions().map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(session.session_date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {'session_time' in session ? session.session_time : `${session.start_time} - ${session.end_time}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {'school_name' in session ? session.school_name : session.student_name}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔔</span>
                  Recent Notifications
                </h3>
                {isLoadingNotifications ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-gray-500">No notifications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className={`border-l-4 ${notification.is_read ? 'border-gray-200' : 'border-primary-500'} pl-4 py-2`}>
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )

      case 'sessions':
        return (
          <div className="space-y-6">
            {/* Student Selector */}
            {matchedStudents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
                <div className="flex flex-wrap gap-3">
                  {matchedStudents.map((student) => (
                    <button
                      key={student.student_id}
                      onClick={() => setSelectedStudent(student.student_id)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedStudent === student.student_id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300 text-gray-700'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm text-gray-500">{student.subjects}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Session Management */}
            {selectedStudent && (
              <>
                {/* Session Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sessions for {getSelectedStudentName()}
                    </h3>
                    <button
                      onClick={() => setShowProposeSessionModal(true)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Schedule Session
                    </button>
                  </div>

                                     {/* Session Stats */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-yellow-50 p-4 rounded-lg">
                       <p className="text-sm text-gray-600">Pending Approval</p>
                       <p className="text-2xl font-bold text-yellow-600">{getFilteredSessions().filter(s => s.status === 'scheduled' && s.created_by !== 'tutor').length}</p>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-lg">
                       <p className="text-sm text-gray-600">My Sessions</p>
                       <p className="text-2xl font-bold text-blue-600">{getFilteredSessions().filter(s => s.status === 'scheduled' && s.created_by === 'tutor').length}</p>
                     </div>
                     <div className="bg-green-50 p-4 rounded-lg">
                       <p className="text-sm text-gray-600">Completed</p>
                       <p className="text-2xl font-bold text-green-600">{getCompletedSessions().length}</p>
                     </div>
                   </div>

                  {/* Session Filter Tabs */}
                  <div className="flex space-x-4 border-b border-gray-200 mb-6">
                    {[
                      { id: 'all', name: 'All', count: getFilteredSessions().length },
                      { id: 'scheduled', name: 'Scheduled', count: getFilteredSessions().filter(s => s.status === 'scheduled').length },
                      { id: 'approved', name: 'Approved', count: getFilteredSessions().filter(s => s.status === 'approved').length },
                      { id: 'completed', name: 'Completed', count: getFilteredSessions().filter(s => s.status === 'completed').length },
                      { id: 'cancelled', name: 'Cancelled', count: getFilteredSessions().filter(s => s.status === 'cancelled').length }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSessionFilter(filter.id)}
                        className={`py-2 px-3 text-sm font-medium border-b-2 ${
                          sessionFilter === filter.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {filter.name} ({filter.count})
                      </button>
                    ))}
                  </div>

                  {/* Sessions Display */}
                  {getFilteredSessionsByStatus().length > 0 ? (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">
                        {sessionFilter === 'all' ? 'All Sessions' : 
                         sessionFilter === 'scheduled' ? 'Scheduled Sessions' :
                         sessionFilter === 'approved' ? 'Approved Sessions' :
                         sessionFilter === 'completed' ? 'Completed Sessions' :
                         sessionFilter === 'cancelled' ? 'Cancelled Sessions' : 'Sessions'} 
                        ({getFilteredSessionsByStatus().length})
                      </h4>
                      <div className="space-y-3">
                        {getFilteredSessionsByStatus().map((session) => (
                          <div key={session.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {formatDate(session.session_date)} at {session.start_time}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Duration: {formatDuration(session.duration_hours)}
                                </p>
                                {session.notes && (
                                  <p className="text-sm text-gray-500 mt-1">Notes: {session.notes}</p>
                                )}
                              </div>
                                                                                            <div className="flex space-x-2">
                                 {/* Session Actions - Show different actions based on who created the session */}
                                 {/* Parent-created sessions (created_by !== 'tutor'): Show Approve/Reject */}
                                 {session.status === 'scheduled' && session.created_by !== 'tutor' && (
                                   <div className="flex space-x-2 mt-3">
                                     <button
                                       onClick={() => handleSessionAction(session.id, 'approve')}
                                       disabled={isSubmitting}
                                       className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                     >
                                       {isSubmitting ? 'Processing...' : 'Approve'}
                                     </button>
                                     <button
                                       onClick={() => handleSessionAction(session.id, 'reject')}
                                       disabled={isSubmitting}
                                       className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                     >
                                       {isSubmitting ? 'Processing...' : 'Reject'}
                                     </button>
                                   </div>
                                 )}
                                 {/* Tutor-created sessions (created_by === 'tutor'): Show Edit/Cancel */}
                                 {session.status === 'scheduled' && session.created_by === 'tutor' && (
                                   <div className="flex space-x-2 mt-3">
                                     <button
                                       onClick={() => handleEditSession(session)}
                                       disabled={isSubmitting}
                                       className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                     >
                                       Edit
                                     </button>
                                     <button
                                       onClick={() => handleSessionAction(session.id, 'cancel')}
                                       disabled={isSubmitting}
                                       className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                     >
                                       {isSubmitting ? 'Processing...' : 'Cancel'}
                                     </button>
                                   </div>
                                 )}
                                 
                                 {/* Show status badge for non-scheduled sessions */}
                                 {session.status !== 'scheduled' && (
                                   <div className="mt-3">
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                       session.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                       session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                       session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                       session.status === 'no_show' ? 'bg-orange-100 text-orange-800' :
                                       'bg-gray-100 text-gray-800'
                                     }`}>
                                       {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                     </span>
                                   </div>
                                 )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="mt-2 text-gray-600">No {sessionFilter === 'all' ? '' : sessionFilter} sessions found</p>
                      <p className="text-sm text-gray-500">
                        {sessionFilter === 'scheduled' ? 'No sessions waiting for approval' :
                         sessionFilter === 'approved' ? 'No approved sessions yet' :
                         sessionFilter === 'completed' ? 'No completed sessions yet' :
                         sessionFilter === 'cancelled' ? 'No cancelled sessions yet' :
                         'No sessions found for this student'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {matchedStudents.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <p className="text-gray-500">No matched students found. You need to be matched with students to manage sessions.</p>
              </div>
            )}
          </div>
        )

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              {isLoadingPayments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading payments...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <p className="text-gray-500">No payment history found.</p>
                  ) : (
                    payments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              SLL {payment.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">{payment.payment_type}</p>
                            <p className="text-sm text-gray-500">{formatDate(payment.payment_date)}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )

      // case 'performance': // Commented out for MVP
      //   return (
      //     <div className="space-y-6">
      //       <div className="bg-white rounded-2xl shadow-lg p-6">
      //         <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
      //         {isLoadingPerformance ? (
      //           <div className="text-center py-8">
      //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      //           <p className="mt-2 text-gray-6">Loading performance data...</p>
      //         </div>
      //       ) : performance ? (
      //         <div className="grid md:grid-cols-2 gap-6">
      //           <div className="space-y-4">
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Total Hours</span>
      //               <span className="font-semibold text-gray-900">{performance.total_hours}</span>
      //             </div>
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Average Rating</span>
      //               <span className="font-semibold text-gray-900">{performance.average_rating.toFixed(1)}/5</span>
      //             </div>
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Attendance Rate</span>
      //               <span className="font-semibold text-gray-900">{performance.overall_attendance_rate}%</span>
      //             </div>
      //           </div>
      //           <div className="space-y-4">
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Institution Assignments</span>
      //               <span className="font-semibold text-gray-900">{performance.active_institution_assignments}</span>
      //             </div>
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Home Tutoring Assignments</span>
      //               <span className="font-semibold text-gray-900">{performance.active_home_assignments}</span>
      //             </div>
      //         </div>
      //       ) : (
      //         <p className="text-gray-500">No performance data available.</p>
      //       )}
      //     </div>
      //   </div>
      //   )

      

      default:
        return null
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

  // Check if user is authenticated and has the right role
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = '/login'
    return null
  }
  
  if (user.role !== 'tutor') {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'parent') {
      window.location.href = '/dashboard-with-children'
    } else if (user.role === 'school_admin') {
      window.location.href = '/school-admin-dashboard'
    } else {
      window.location.href = '/login'
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leone-50 to-leone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leone-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leone-50 to-leone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-leone-600 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <AcademicCapIcon className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Tutor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p key={`header-name-${lastUpdate}`} className="font-medium text-gray-900">{userProfile?.full_name || 'Loading...'}</p>
              </div>
              
              {/* Notification Bell */}
              <div className="relative notifications-dropdown">
                <button 
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className={`p-2 rounded-lg transition-colors ${
                    notifications.length > 0 
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BellIcon className="w-5 h-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>

                  {/* Notifications Dropdown */}
                  {showNotificationsDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {notifications.filter(n => !n.is_read).length > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark All as Read
                          </button>
                        )}
                      </div>
                      <div className="p-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notification) => (
                              <div 
                                key={notification.id} 
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  notification.is_read 
                                    ? 'bg-gray-50 hover:bg-gray-100' 
                                    : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      notification.is_read ? 'text-gray-700' : 'text-blue-900'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                      notification.is_read ? 'text-gray-500' : 'text-blue-700'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatDate(notification.created_at)}
                                    </p>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileModal(true)
                          setShowProfileDropdown(false)
                          loadProfileData() // Load data when modal opens
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        Profile Settings
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          logout()
                          window.location.href = '/'
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 mb-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'sessions', name: 'Sessions', icon: '📅' },
            { id: 'payments', name: 'Payments', icon: '💰' }
            // { id: 'performance', name: 'Performance', icon: '📈' } // Commented out for MVP
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSectionContent()}
      </main>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  loadProfileData() // Reset form data
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={updateProfile} className="px-6 py-4">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.fullName}
                        onChange={(e) => setProfileFormData({...profileFormData, fullName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileFormData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+232 XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Professional Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={profileFormData.bio}
                        onChange={(e) => setProfileFormData({...profileFormData, bio: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell students and parents about your teaching experience, qualifications, and approach..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subjects
                      </label>
                      <input
                        type="text"
                        value={profileFormData.subjects}
                        onChange={(e) => setProfileFormData({...profileFormData, subjects: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Mathematics, Physics, Chemistry (comma-separated)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple subjects with commas</p>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Availability</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Days and Times
                    </label>
                    <textarea
                      value={profileFormData.availability}
                      onChange={(e) => setProfileFormData({...profileFormData, availability: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Monday-Friday: 3:00 PM - 8:00 PM, Saturday: 9:00 AM - 5:00 PM"
                    />
                    <p className="text-xs text-gray-500 mt-1">Describe your general availability schedule</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false)
                      loadProfileData() // Reset form data
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Session Proposal Modal */}
      {showProposeSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Schedule Session</h3>
              <button
                onClick={() => {
                  setShowProposeSessionModal(false)
                  setProposeSessionForm({
                    session_date: '',
                    start_time: '',
                    end_time: '',
                    notes: ''
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={scheduleSession} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {getSelectedStudentName()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    required
                    value={proposeSessionForm.session_date}
                    onChange={(e) => setProposeSessionForm({...proposeSessionForm, session_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={proposeSessionForm.start_time}
                      onChange={(e) => setProposeSessionForm({...proposeSessionForm, start_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={proposeSessionForm.end_time}
                      onChange={(e) => setProposeSessionForm({...proposeSessionForm, end_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={proposeSessionForm.notes}
                    onChange={(e) => setProposeSessionForm({...proposeSessionForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Any additional notes about the session..."
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProposeSessionModal(false)
                    setProposeSessionForm({
                      session_date: '',
                      start_time: '',
                      end_time: '',
                      notes: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
} 