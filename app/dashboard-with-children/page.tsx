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
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface Student {
  id: string
  parent_id: string
  name: string
  age: number
  grade_level: string
  school_name: string
  created_at: string
  updated_at: string
}

interface TutoringRequest {
  id: string
  parent_id: string
  student_name: string
  student_age: number
  grade_level: string
  subjects: string
  preferred_schedule: string
  location: string
  additional_requirements: string
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  matched_tutor_id: string | null
  matched_at: string | null
  student_id: string | null
}

interface Session {
  id: string
  request_id: string
  tutor_id: string
  session_date: string
  start_time: string
  end_time: string
  duration_hours: number
  amount: number
  status: 'proposed' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'in_progress' | 'scheduled'
  notes: string
  created_at: string
  student_id: string | null
}

interface NewChildForm {
  name: string
  age: string
  grade_level: string
  school_name: string
}

interface EditChildForm {
  name: string
  age: string
  grade_level: string
  school_name: string
}

interface ProfileForm {
  full_name: string
  email: string
  phone: string
}

interface TutorProposal {
  id: string
  student_id: string
  tutor_id: string
  proposed_by: string
  status: 'pending' | 'accepted' | 'rejected'
  proposed_at: string
  responded_at: string | null
  response_notes: string | null
  created_at: string
  updated_at: string
}

interface TutorDisplayInfo {
  id: string
  tutor_id: string
  display_name: string
  subjects_taught: string[]
  experience_years: number
  education_level: string
  bio_summary: string
  availability_summary: string
  rating: number
  total_reviews: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

interface TutorReview {
  id: string
  tutor_id: string
  parent_id: string
  student_id: string
  rating: number
  review_text: string
  session_date: string
  created_at: string
  updated_at: string
}

interface StudentProgress {
  id: string
  student_id: string
  subject: string
  mastery_level: 'beginner' | 'intermediate' | 'advanced'
  attendance_rate: number
  last_updated: string
  created_at: string
  updated_at: string
}

interface SessionReport {
  id: string
  session_id: string
  tutor_id: string
  student_id: string
  session_date: string
  topics_covered: string
  student_engagement: string
  areas_for_improvement: string
  homework_assigned: string
  next_session_focus: string
  tutor_notes: string
  created_at: string
  updated_at: string
}

export default function DashboardWithChildren() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [tutoringRequests, setTutoringRequests] = useState<TutoringRequest[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  
  // Filter states
  const [requestFilter, setRequestFilter] = useState<string>('all')
  const [sessionFilter, setSessionFilter] = useState<string>('all')
  
  // Modal states
  const [showNewChildModal, setShowNewChildModal] = useState(false)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false)
  const [showChildDetailsModal, setShowChildDetailsModal] = useState(false)
  const [showEditChildModal, setShowEditChildModal] = useState(false)
  const [selectedChildForDetails, setSelectedChildForDetails] = useState<Student | null>(null)
  const [selectedChildForEdit, setSelectedChildForEdit] = useState<Student | null>(null)
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // Tutor matching states
  const [tutorProposals, setTutorProposals] = useState<TutorProposal[]>([])
  const [tutorDisplayInfo, setTutorDisplayInfo] = useState<TutorDisplayInfo[]>([])
  const [tutorReviews, setTutorReviews] = useState<TutorReview[]>([])
  const [isLoadingTutorData, setIsLoadingTutorData] = useState(true)
  const [showTutorProposalsModal, setShowTutorProposalsModal] = useState(false)
  const [showTutorDetailsModal, setShowTutorDetailsModal] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState<TutorDisplayInfo | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<TutorProposal | null>(null)
  const [proposalResponse, setProposalResponse] = useState({ action: '', notes: '' })
  const [selectedRequest, setSelectedRequest] = useState<TutoringRequest | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  
  // Student Progress and Session Reports states
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([])
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [isLoadingReports, setIsLoadingReports] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedProgress, setSelectedProgress] = useState<StudentProgress | null>(null)
  const [selectedReport, setSelectedReport] = useState<SessionReport | null>(null)
  
  // Form states
  const [newChildForm, setNewChildForm] = useState<NewChildForm>({
    name: '',
    age: '',
    grade_level: '',
    school_name: ''
  })
  const [editChildForm, setEditChildForm] = useState<EditChildForm>({
    name: '',
    age: '',
    grade_level: '',
    school_name: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New form states for requests and sessions
  const [newRequestForm, setNewRequestForm] = useState({
    student_id: '',
    subjects: '',
    preferred_schedule: '',
    location: 'home_visit',
    additional_requirements: ''
  })
  const [newSessionForm, setNewSessionForm] = useState({
    student_id: '',
    request_id: '',
    session_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  })
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: ''
  })

  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'session_proposed' | 'session_approved' | 'session_rejected'
    message: string
    sessionId?: string
    timestamp: Date
  }>>([])

  const fetchUserProfile = async () => {
    try {
      // Get email from localStorage (set during registration/verification)
      const email = localStorage.getItem('pendingVerificationEmail')
      
      if (!email) {
        console.error('No email found in localStorage')
        // Redirect to home tutoring form if no email
        window.location.href = '/home-tutoring'
        return
      }

      // Fetch user profile from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', 'parent')
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Redirect to home tutoring form if profile not found
        window.location.href = '/home-tutoring'
        return
      }

      if (!profile) {
        console.error('Profile not found')
        window.location.href = '/home-tutoring'
        return
      }

      // Check if email is verified
      if (!profile.email_verified) {
        // Redirect to email verification
        window.location.href = `/verify-email?email=${email}`
        return
      }

      setUserProfile(profile)
      setIsLoading(false)
      
      // Clear the pending verification email from localStorage after successful load
      localStorage.removeItem('pendingVerificationEmail')
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      window.location.href = '/home-tutoring'
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (userProfile) {
      fetchStudents()
    }
  }, [userProfile])

  useEffect(() => {
    if (userProfile) {
      fetchTutoringRequests()
      fetchSessions()
      fetchTutorData()
      fetchStudentProgress()
      fetchSessionReports()
    }
  }, [userProfile, selectedStudent])

  // Check for pending session approvals
  useEffect(() => {
    const pendingSessions = sessions.filter(s => s.status === 'proposed')
    if (pendingSessions.length > 0) {
      const newNotifications = pendingSessions.map(session => ({
        id: session.id,
        type: 'session_proposed' as const,
        message: `New session proposed for ${session.session_date} - ${session.start_time} to ${session.end_time}`,
        sessionId: session.id,
        timestamp: new Date(session.created_at)
      }))
      setNotifications(prev => [...prev, ...newNotifications])
    }
  }, [sessions])

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', userProfile.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching students:', error)
        return
      }

      setStudents(studentsData || [])
      
      // Auto-select first child if available
      if (studentsData && studentsData.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsData[0])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchTutoringRequests = async () => {
    try {
      setIsLoadingRequests(true)
      
      let query = supabase
        .from('home_tutoring_requests')
        .select('*')
        .eq('parent_id', userProfile.id)
        .order('created_at', { ascending: false })

      // Filter by selected student if one is selected
      if (selectedStudent) {
        query = query.eq('student_id', selectedStudent.id)
      }

      const { data: requests, error } = await query

      if (error) {
        console.error('Error fetching tutoring requests:', error)
        return
      }

      setTutoringRequests(requests || [])
    } catch (error) {
      console.error('Error fetching tutoring requests:', error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true)
      
      let query = supabase
        .from('home_tutoring_sessions')
        .select(`
          *,
          home_tutoring_requests!inner(parent_id)
        `)
        .eq('home_tutoring_requests.parent_id', userProfile.id)
        .order('session_date', { ascending: false })

      // Filter by selected student if one is selected
      if (selectedStudent) {
        query = query.eq('student_id', selectedStudent.id)
      }

      const { data: sessionsData, error } = await query

      if (error) {
        console.error('Error fetching sessions:', error)
        return
      }

      setSessions(sessionsData || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleNewChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          parent_id: userProfile.id,
          name: newChildForm.name,
          age: parseInt(newChildForm.age),
          grade_level: newChildForm.grade_level,
          school_name: newChildForm.school_name
        }])
        .select()

      if (error) {
        console.error('Error creating child:', error)
        alert('Failed to create child profile. Please try again.')
        return
      }

      setNewChildForm({
        name: '',
        age: '',
        grade_level: '',
        school_name: ''
      })
      setShowNewChildModal(false)
      await fetchStudents()
      alert('Child profile created successfully!')
    } catch (error) {
      console.error('Error creating child:', error)
      alert('Failed to create child profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!selectedStudent) {
        alert('Please select a child first')
        return
      }

      const { data, error } = await supabase
        .from('home_tutoring_requests')
        .insert([{
          parent_id: userProfile.id,
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
          student_age: selectedStudent.age,
          grade_level: selectedStudent.grade_level,
          subjects: newRequestForm.subjects,
          preferred_schedule: newRequestForm.preferred_schedule,
          location: newRequestForm.location,
          additional_requirements: newRequestForm.additional_requirements,
          status: 'pending'
        }])
        .select()

      if (error) {
        console.error('Error creating request:', error)
        alert('Failed to create request. Please try again.')
        return
      }

      setNewRequestForm({
        student_id: '',
        subjects: '',
        preferred_schedule: '',
        location: 'home_visit',
        additional_requirements: ''
      })
      setShowNewRequestModal(false)
      await fetchTutoringRequests()
      alert('Tutor request created successfully!')
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!newSessionForm.student_id) {
        alert('Please select a child first')
        return
      }

      // Find the selected student
      const selectedStudentForSession = students.find(s => s.id === newSessionForm.student_id)
      if (!selectedStudentForSession) {
        alert('Selected child not found')
        return
      }

      // If a specific request is selected, use that
      let matchedRequest = null
      let tutorId = null

      if (newSessionForm.request_id) {
        matchedRequest = tutoringRequests.find(r => r.id === newSessionForm.request_id)
        if (matchedRequest && matchedRequest.matched_tutor_id) {
          tutorId = matchedRequest.matched_tutor_id
        }
      } else {
        // Find any matched request for this student
        matchedRequest = tutoringRequests.find(r => 
          r.student_id === newSessionForm.student_id && 
          (r.status === 'matched' || r.status === 'in_progress')
        )
        if (matchedRequest && matchedRequest.matched_tutor_id) {
          tutorId = matchedRequest.matched_tutor_id
        }
      }

      if (!tutorId) {
        alert('No matched tutor found for this child. Please wait for a tutor to be assigned.')
        return
      }

      // Calculate duration from start and end time
      const startTime = new Date(`2000-01-01T${newSessionForm.start_time}`)
      const endTime = new Date(`2000-01-01T${newSessionForm.end_time}`)
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

      const { data, error } = await supabase
        .from('home_tutoring_sessions')
        .insert([{
          request_id: matchedRequest?.id || null,
          tutor_id: tutorId,
          student_id: newSessionForm.student_id,
          session_date: newSessionForm.session_date,
          start_time: newSessionForm.start_time,
          end_time: newSessionForm.end_time,
          duration_hours: durationHours,
          amount: 70000, // Default amount
          status: 'scheduled', // Parent schedules, tutor can approve/reject
          notes: newSessionForm.notes
        }])
        .select()

      if (error) {
        console.error('Error creating session:', error)
        console.error('Session data being inserted:', {
          request_id: matchedRequest?.id || null,
          tutor_id: tutorId,
          student_id: newSessionForm.student_id,
          session_date: newSessionForm.session_date,
          start_time: newSessionForm.start_time,
          end_time: newSessionForm.end_time,
          duration_hours: durationHours,
          amount: 70000,
          status: 'scheduled',
          notes: newSessionForm.notes
        })
        alert(`Failed to create session: ${error.message}`)
        return
      }

      setNewSessionForm({
        student_id: '',
        request_id: '',
        session_date: '',
        start_time: '',
        end_time: '',
        notes: ''
      })
      setShowNewSessionModal(false)
      await fetchSessions()
      alert('Session scheduled successfully! The tutor will be notified and can approve or suggest changes.')
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSessionAction = async (sessionId: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      let newStatus = 'proposed'
      if (action === 'approve') newStatus = 'approved'
      else if (action === 'reject') newStatus = 'rejected'
      else if (action === 'complete') newStatus = 'completed'
      
      const { error } = await supabase
        .from('home_tutoring_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating session:', error)
        alert('Failed to update session. Please try again.')
        return
      }

      await fetchSessions()
      setShowSessionDetailsModal(false)
      setSelectedSession(null)
      
      alert(`Session ${action}d successfully!`)
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Failed to update session. Please try again.')
    }
  }

  const handleViewChildDetails = (child: Student) => {
    setSelectedChildForDetails(child)
    setShowChildDetailsModal(true)
  }

  const handleEditChild = (child: Student) => {
    setSelectedChildForEdit(child)
    setEditChildForm({
      name: child.name,
      age: child.age.toString(),
      grade_level: child.grade_level,
      school_name: child.school_name
    })
    setShowEditChildModal(true)
  }

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChildForEdit) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('students')
        .update({
          name: editChildForm.name,
          age: parseInt(editChildForm.age),
          grade_level: editChildForm.grade_level,
          school_name: editChildForm.school_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChildForEdit.id)

      if (error) {
        console.error('Error updating child:', error)
        alert('Failed to update child. Please try again.')
        return
      }

      setShowEditChildModal(false)
      setSelectedChildForEdit(null)
      setEditChildForm({ name: '', age: '', grade_level: '', school_name: '' })
      await fetchStudents()
      alert('Child updated successfully!')
    } catch (error) {
      console.error('Error updating child:', error)
      alert('Failed to update child. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', childId)

      if (error) {
        console.error('Error deleting child:', error)
        alert('Failed to delete child. Please try again.')
        return
      }

      await fetchStudents()
      if (selectedStudent?.id === childId) {
        setSelectedStudent(null)
      }
      alert('Child deleted successfully!')
    } catch (error) {
      console.error('Error deleting child:', error)
      alert('Failed to delete child. Please try again.')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!userProfile?.id) {
        throw new Error('No user profile found')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone
        })
        .eq('id', userProfile.id)

      if (error) {
        throw error
      }

      // Update user profile state directly
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          full_name: profileForm.full_name,
          phone: profileForm.phone
        })
      }
      
      // Close modal
      setShowProfileModal(false)
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchTutorData = async () => {
    try {
      setIsLoadingTutorData(true)
      
      // Fetch tutor proposals
      const { data: proposals, error: proposalsError } = await supabase
        .from('tutor_proposals')
        .select('*')
        .order('created_at', { ascending: false })

      if (proposalsError) {
        console.error('Error fetching tutor proposals:', proposalsError)
      } else {
        setTutorProposals(proposals || [])
      }

      // Fetch tutor display info
      const { data: displayInfo, error: displayError } = await supabase
        .from('tutor_display_info')
        .select('*')

      if (displayError) {
        console.error('Error fetching tutor display info:', displayError)
      } else {
        setTutorDisplayInfo(displayInfo || [])
      }

      // Fetch tutor reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('tutor_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching tutor reviews:', reviewsError)
      } else {
        setTutorReviews(reviews || [])
      }
    } catch (error) {
      console.error('Error fetching tutor data:', error)
    } finally {
      setIsLoadingTutorData(false)
    }
  }

  const fetchStudentProgress = async () => {
    try {
      setIsLoadingProgress(true)
      
      if (!selectedStudent) {
        setStudentProgress([])
        return
      }

      const { data: progress, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('last_updated', { ascending: false })

      if (error) {
        console.error('Error fetching student progress:', error)
      } else {
        setStudentProgress(progress || [])
      }
    } catch (error) {
      console.error('Error fetching student progress:', error)
    } finally {
      setIsLoadingProgress(false)
    }
  }

  const fetchSessionReports = async () => {
    try {
      setIsLoadingReports(true)
      
      if (!selectedStudent) {
        setSessionReports([])
        return
      }

      const { data: reports, error } = await supabase
        .from('session_reports')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('session_date', { ascending: false })

      if (error) {
        console.error('Error fetching session reports:', error)
      } else {
        setSessionReports(reports || [])
      }
    } catch (error) {
      console.error('Error fetching session reports:', error)
    } finally {
      setIsLoadingReports(false)
    }
  }

  const handleProposalResponse = async (proposalId: string, action: 'accept' | 'reject', notes: string) => {
    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('tutor_proposals')
        .update({
          status: action === 'accept' ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
          response_notes: notes
        })
        .eq('id', proposalId)

      if (error) {
        console.error('Error updating proposal:', error)
        alert('Failed to update proposal. Please try again.')
        return
      }

      // If accepted, update the home tutoring request
      if (action === 'accept') {
        const proposal = tutorProposals.find(p => p.id === proposalId)
        if (proposal) {
          const { error: requestError } = await supabase
            .from('home_tutoring_requests')
            .update({
              matched_tutor_id: proposal.tutor_id,
              accepted_proposal_id: proposalId,
              status: 'matched'
            })
            .eq('student_id', proposal.student_id)
            .eq('status', 'pending')

          if (requestError) {
            console.error('Error updating request:', requestError)
          }
        }
      }

      setShowTutorProposalsModal(false)
      setSelectedProposal(null)
      setProposalResponse({ action: '', notes: '' })
      await fetchTutorData()
      await fetchTutoringRequests()
      alert(`Proposal ${action}ed successfully!`)
    } catch (error) {
      console.error('Error responding to proposal:', error)
      alert('Failed to respond to proposal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTutorDisplayInfo = (tutorId: string) => {
    return tutorDisplayInfo.find(t => t.tutor_id === tutorId)
  }

  const getTutorReviews = (tutorId: string) => {
    return tutorReviews.filter(r => r.tutor_id === tutorId)
  }

  const getPendingProposals = () => {
    if (!selectedStudent) return []
    return tutorProposals.filter(p => p.student_id === selectedStudent.id && p.status === 'pending')
  }

  const getAcceptedProposals = () => {
    if (!selectedStudent) return []
    return tutorProposals.filter(p => p.student_id === selectedStudent.id && p.status === 'accepted')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800'
      case 'matched':
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'proposed':
        return <ClockIcon className="w-4 h-4" />
      case 'matched':
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'in_progress':
        return <AcademicCapIcon className="w-4 h-4" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled':
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

  const getFilteredRequests = () => {
    if (requestFilter === 'all') return tutoringRequests
    return tutoringRequests.filter(request => request.status === requestFilter)
  }

  const getFilteredSessions = () => {
    if (sessionFilter === 'all') return sessions
    return sessions.filter(session => session.status === sessionFilter)
  }

  const getActiveRequests = () => {
    return tutoringRequests.filter(r => r.status === 'matched' || r.status === 'in_progress')
  }

  const getCompletedSessions = () => {
    return sessions.filter(s => s.status === 'completed')
  }

  const getUpcomingSessions = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return sessions.filter(s => {
      const sessionDate = new Date(s.session_date)
      sessionDate.setHours(0, 0, 0, 0)
      
      return (
        sessionDate >= today && 
        (s.status === 'approved' || s.status === 'scheduled' || s.status === 'in_progress')
      )
    }).sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
  }

  const getTutorName = (tutorId: string | null) => {
    if (!tutorId) return 'Not assigned'
    const tutor = tutorDisplayInfo.find(t => t.tutor_id === tutorId)
    return tutor ? tutor.display_name : 'Unknown Tutor'
  }

  const getMasteryLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-red-100 text-red-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFilteredProgress = () => {
    if (!selectedStudent) return []
    return studentProgress.filter(progress => progress.student_id === selectedStudent.id)
  }

  const getFilteredReports = () => {
    if (!selectedStudent) return []
    return sessionReports.filter(report => report.student_id === selectedStudent.id)
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Child Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">My Children</h3>
                <button 
                  onClick={() => setShowNewChildModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Add Child
                </button>
              </div>
              
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading children...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No children added yet</p>
                  <button 
                    onClick={() => setShowNewChildModal(true)}
                    className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Add Your First Child
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedStudent?.id === student.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          selectedStudent?.id === student.id
                            ? 'bg-primary-100'
                            : 'bg-gray-100'
                        }`}>
                          <UserIcon className={`w-6 h-6 ${
                            selectedStudent?.id === student.id
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.grade_level}</p>
                          <p className="text-sm text-gray-500">{student.school_name}</p>
                        </div>
                        {selectedStudent?.id === student.id && (
                          <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Child Overview */}
            {selectedStudent && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Overview for {selectedStudent.name}
                  </h3>
                </div>
                <div className="p-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-primary-50 rounded-lg p-4 cursor-pointer hover:bg-primary-100 hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        setActiveSection('requests')
                        setRequestFilter('matched')
                      }}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <AcademicCapIcon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Requests</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {getActiveRequests().length}
                          </p>
                          {getActiveRequests().some(r => r.matched_tutor_id) && (
                            <p className="text-xs text-primary-600 mt-1">
                              {getActiveRequests().filter(r => r.matched_tutor_id).length} with matched tutors
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        setActiveSection('sessions')
                        setSessionFilter('completed')
                      }}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CalendarDaysIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {getCompletedSessions().length}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        setActiveSection('requests')
                        setRequestFilter('all')
                      }}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Requests</p>
                          <p className="text-2xl font-bold text-gray-900">{tutoringRequests.length}</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-orange-50 rounded-lg p-4 cursor-pointer hover:bg-orange-100 hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        setActiveSection('sessions')
                        setSessionFilter('approved')
                      }}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <ClockIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {getUpcomingSessions().length}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Recent Activity</h4>
                    {tutoringRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-600">No requests yet for {selectedStudent.name}</p>
                        <button 
                          onClick={() => setShowNewRequestModal(true)}
                          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                        >
                          Request a Tutor
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tutoringRequests.slice(0, 3).map((request) => (
                          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{request.subjects}</p>
                                <p className="text-sm text-gray-600">{request.grade_level}</p>
                                <p className="text-sm text-gray-500">{request.preferred_schedule}</p>
                                {request.matched_tutor_id && (
                                  <p className="text-sm text-primary-600 font-medium mt-1">
                                    Matched with:{' '}
                                    <button
                                      onClick={() => {
                                        const tutorInfo = getTutorDisplayInfo(request.matched_tutor_id!)
                                        setSelectedTutor(tutorInfo || null)
                                        setShowTutorDetailsModal(true)
                                      }}
                                      className="text-primary-600 hover:text-primary-700 underline hover:no-underline transition-colors"
                                    >
                                      {getTutorName(request.matched_tutor_id)}
                                    </button>
                                  </p>
                                )}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Sessions */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Upcoming Sessions</h4>
                    {getUpcomingSessions().length === 0 ? (
                      <div className="text-center py-8">
                        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-600">No upcoming sessions for {selectedStudent.name}</p>
                        <button 
                          onClick={() => setShowNewSessionModal(true)}
                          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                        >
                          Schedule Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getUpcomingSessions().slice(0, 3).map((session) => (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {formatDate(session.session_date)} at {session.start_time}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Duration: {session.duration_hours} hours
                                </p>
                                <p className="text-sm text-gray-500">
                                  {session.notes || 'No additional notes'}
                                </p>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                {getStatusIcon(session.status)}
                                <span className="ml-1">{session.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                        {getUpcomingSessions().length > 3 && (
                          <div className="text-center pt-2">
                            <button 
                              onClick={() => setActiveSection('sessions')}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              View all {getUpcomingSessions().length} upcoming sessions →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'children':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Manage Children</h3>
              <button 
                onClick={() => setShowNewChildModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Add Child
              </button>
            </div>
            <div className="p-6">
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading children...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No children added yet</p>
                  <button 
                    onClick={() => setShowNewChildModal(true)}
                    className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Add Your First Child
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <UserIcon className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.age} years old</p>
                            <p className="text-sm text-gray-500">{student.grade_level} • {student.school_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewChildDetails(student)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => handleEditChild(student)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'requests':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Requests {selectedStudent ? `for ${selectedStudent.name}` : ''}
                </h3>
                <button 
                  onClick={() => setShowNewRequestModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Request
                </button>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-4 border-b border-gray-200">
                {[
                  { id: 'all', name: 'All', count: tutoringRequests.length },
                  { id: 'pending', name: 'Pending', count: tutoringRequests.filter(r => r.status === 'pending').length },
                  { id: 'matched', name: 'Matched', count: tutoringRequests.filter(r => r.status === 'matched').length },
                  { id: 'in_progress', name: 'In Progress', count: tutoringRequests.filter(r => r.status === 'in_progress').length },
                  { id: 'completed', name: 'Completed', count: tutoringRequests.filter(r => r.status === 'completed').length },
                  { id: 'cancelled', name: 'Cancelled', count: tutoringRequests.filter(r => r.status === 'cancelled').length }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setRequestFilter(filter.id)}
                    className={`py-2 px-3 text-sm font-medium border-b-2 ${
                      requestFilter === filter.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {filter.name} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              ) : getFilteredRequests().length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No requests found</p>
                  {requestFilter === 'all' && (
                    <button 
                      onClick={() => setShowNewRequestModal(true)}
                      className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Create Your First Request
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredRequests().map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{request.student_name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{request.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.grade_level} • {request.subjects}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {request.preferred_schedule} • {request.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(request.created_at)}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRequestDetailsModal(true)
                            }}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'sessions':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Sessions {selectedStudent ? `for ${selectedStudent.name}` : ''}
                </h3>
                <button 
                  onClick={() => setShowNewSessionModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Schedule Session
                </button>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-4 border-b border-gray-200">
                {[
                  { id: 'all', name: 'All', count: sessions.length },
                  { id: 'proposed', name: 'Proposed', count: sessions.filter(s => s.status === 'proposed').length },
                  { id: 'approved', name: 'Approved', count: sessions.filter(s => s.status === 'approved').length },
                  { id: 'completed', name: 'Completed', count: sessions.filter(s => s.status === 'completed').length },
                  { id: 'cancelled', name: 'Cancelled', count: sessions.filter(s => s.status === 'cancelled').length }
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
            </div>
            <div className="p-6">
              {isLoadingSessions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading sessions...</p>
                </div>
              ) : getFilteredSessions().length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No sessions found</p>
                  <p className="text-sm text-gray-500">Schedule sessions once tutors are matched</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredSessions().map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              Session on {formatDate(session.session_date)}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)}
                              <span className="ml-1">{session.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {session.start_time} - {session.end_time} ({session.duration_hours} hours)
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Amount: {session.amount.toLocaleString()} Leones
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(session.created_at)}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedSession(session)
                              setShowSessionDetailsModal(true)
                            }}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'student-progress':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Student Progress</h3>
            </div>
            <div className="p-6">
              {isLoadingProgress ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading progress data...</p>
                </div>
              ) : getFilteredProgress().length === 0 ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No progress data yet</p>
                  <p className="text-sm text-gray-500">Track your child's progress over time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredProgress().map((progress) => (
                    <motion.div
                      key={progress.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{progress.subject}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(progress.mastery_level)}`}>
                              {getStatusIcon(progress.mastery_level)}
                              <span className="ml-1">{progress.mastery_level}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Attendance Rate: {progress.attendance_rate}%
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Last Updated: {formatDate(progress.last_updated)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(progress.created_at)}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedProgress(progress)
                              setShowProgressModal(true)
                            }}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'session-reports':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Session Reports</h3>
            </div>
            <div className="p-6">
              {isLoadingReports ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reports data...</p>
                </div>
              ) : getFilteredReports().length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No reports yet</p>
                  <p className="text-sm text-gray-500">Track your child's progress after each session</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredReports().map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{report.topics_covered}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.student_engagement)}`}>
                              {getStatusIcon(report.student_engagement)}
                              <span className="ml-1">{report.student_engagement}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Areas for Improvement: {report.areas_for_improvement}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Homework Assigned: {report.homework_assigned}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Next Session Focus: {report.next_session_focus}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Tutor Notes: {report.tutor_notes}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(report.created_at)}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedReport(report)
                              setShowReportModal(true)
                            }}
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'tutor-proposals':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Tutor Proposals {selectedStudent ? `for ${selectedStudent.name}` : ''}
              </h3>
            </div>
            <div className="p-6">
              {!selectedStudent ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">Please select a child to view tutor proposals</p>
                </div>
              ) : isLoadingTutorData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading tutor proposals...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Proposals */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Pending Proposals</h4>
                    {getPendingProposals().length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <AcademicCapIcon className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-600">No pending proposals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getPendingProposals().map((proposal) => {
                          const tutorInfo = getTutorDisplayInfo(proposal.tutor_id)
                          return (
                            <motion.div
                              key={proposal.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h5 className="text-lg font-medium text-gray-900">
                                      {tutorInfo?.display_name || 'Tutor'}
                                    </h5>
                                    {tutorInfo?.is_featured && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Featured
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Subjects: {tutorInfo?.subjects_taught?.join(', ')}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Experience: {tutorInfo?.experience_years} years • {tutorInfo?.education_level}
                                  </p>
                                  
                                  <p className="text-sm text-gray-500 mt-1">
                                    Availability: {tutorInfo?.availability_summary}
                                  </p>
                                  <div className="flex items-center mt-2">
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < Math.floor(tutorInfo?.rating || 0)
                                              ? 'text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                      <span className="ml-1 text-sm text-gray-600">
                                        {tutorInfo?.rating} ({tutorInfo?.total_reviews} reviews)
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-2">
                                    Proposed: {formatDate(proposal.proposed_at)}
                                  </p>
                                </div>
                                <div className="flex flex-col space-y-2 ml-4">
                                  <button
                                    onClick={() => {
                                      setSelectedTutor(tutorInfo || null)
                                      setShowTutorDetailsModal(true)
                                    }}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProposal(proposal)
                                      setShowTutorProposalsModal(true)
                                    }}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
                                  >
                                    Respond
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Accepted Proposals */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Accepted Proposals</h4>
                    {getAcceptedProposals().length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <CheckCircleIcon className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-600">No accepted proposals</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getAcceptedProposals().map((proposal) => {
                          const tutorInfo = getTutorDisplayInfo(proposal.tutor_id)
                          return (
                            <motion.div
                              key={proposal.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-green-200 bg-green-50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h5 className="text-lg font-medium text-gray-900">
                                      {tutorInfo?.display_name || 'Tutor'}
                                    </h5>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Accepted
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Subjects: {tutorInfo?.subjects_taught?.join(', ')}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Accepted: {formatDate(proposal.responded_at || '')}
                                  </p>
                                  {proposal.response_notes && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Notes: {proposal.response_notes}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedTutor(tutorInfo || null)
                                    setShowTutorDetailsModal(true)
                                  }}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-600">No payments yet</p>
              <p className="text-sm text-gray-500">Payment history will appear here once sessions are completed</p>
            </div>
          </div>
        )

      default:
        return null
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
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
              <span className="ml-2 text-sm text-gray-500">(With Child Management)</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  setProfileForm({
                    full_name: userProfile?.full_name || '',
                    email: userProfile?.email || '',
                    phone: userProfile?.phone || ''
                  })
                  setShowProfileModal(true)
                }}
                className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{userProfile?.full_name}</span>
              </button>
              
              {/* Notification Bell */}
              {notifications.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationsModal(true)}
                    className="bg-yellow-100 text-yellow-800 p-2 rounded-lg hover:bg-yellow-200"
                  >
                    <BellIcon className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => setShowQuickActionsModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: UserIcon },
              { id: 'children', name: 'My Children', icon: UserGroupIcon },
              { id: 'requests', name: 'Requests', icon: DocumentTextIcon },
              { id: 'sessions', name: 'Sessions', icon: CalendarIcon },
              { id: 'student-progress', name: 'Student Progress', icon: AcademicCapIcon },
              { id: 'session-reports', name: 'Session Reports', icon: DocumentTextIcon },
              { id: 'tutor-proposals', name: 'Tutor Proposals', icon: AcademicCapIcon },
              { id: 'payments', name: 'Payments', icon: CreditCardIcon }
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
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Section Content */}
        {renderSectionContent()}
      </main>

      {/* Add Child Modal */}
      {showNewChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Add Child</h3>
              <button
                onClick={() => setShowNewChildModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleNewChild} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newChildForm.name}
                    onChange={(e) => setNewChildForm({...newChildForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="25"
                    value={newChildForm.age}
                    onChange={(e) => setNewChildForm({...newChildForm, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level
                  </label>
                  <select
                    required
                    value={newChildForm.grade_level}
                    onChange={(e) => setNewChildForm({...newChildForm, grade_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    <option value="Primary 1">Primary 1</option>
                    <option value="Primary 2">Primary 2</option>
                    <option value="Primary 3">Primary 3</option>
                    <option value="Primary 4">Primary 4</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 6">Primary 6</option>
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                    <option value="SSS 1">SSS 1</option>
                    <option value="SSS 2">SSS 2</option>
                    <option value="SSS 3">SSS 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={newChildForm.school_name}
                    onChange={(e) => setNewChildForm({...newChildForm, school_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Child'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">New Tutor Request</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleNewRequest} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child
                  </label>
                  <select
                    required
                    value={newRequestForm.student_id}
                    onChange={(e) => setNewRequestForm({...newRequestForm, student_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a child</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects
                  </label>
                  <input
                    type="text"
                    required
                    value={newRequestForm.subjects}
                    onChange={(e) => setNewRequestForm({...newRequestForm, subjects: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Schedule
                  </label>
                  <input
                    type="text"
                    required
                    value={newRequestForm.preferred_schedule}
                    onChange={(e) => setNewRequestForm({...newRequestForm, preferred_schedule: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    required
                    value={newRequestForm.location}
                    onChange={(e) => setNewRequestForm({...newRequestForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="home_visit">Home Visit</option>
                    <option value="online_session">Online Session</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Requirements
                  </label>
                  <textarea
                    value={newRequestForm.additional_requirements}
                    onChange={(e) => setNewRequestForm({...newRequestForm, additional_requirements: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Schedule New Session</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleNewSession} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Child
                  </label>
                  <select
                    required
                    value={newSessionForm.student_id}
                    onChange={(e) => setNewSessionForm({...newSessionForm, student_id: e.target.value, request_id: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a child</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name} - {student.grade_level}</option>
                    ))}
                  </select>
                </div>
                {newSessionForm.student_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request (Optional)
                    </label>
                    <select
                      value={newSessionForm.request_id}
                      onChange={(e) => setNewSessionForm({...newSessionForm, request_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">No specific request</option>
                      {tutoringRequests.filter(r => r.student_id === newSessionForm.student_id && (r.status === 'matched' || r.status === 'in_progress')).map(r => (
                        <option key={r.id} value={r.id}>{r.subjects} - {r.status}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newSessionForm.session_date}
                    onChange={(e) => setNewSessionForm({...newSessionForm, session_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newSessionForm.start_time}
                    onChange={(e) => setNewSessionForm({...newSessionForm, start_time: e.target.value})}
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
                    value={newSessionForm.end_time}
                    onChange={(e) => setNewSessionForm({...newSessionForm, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (for tutor)
                  </label>
                  <textarea
                    value={newSessionForm.notes}
                    onChange={(e) => setNewSessionForm({...newSessionForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Actions Modal */}
      {showQuickActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              <button
                onClick={() => setShowQuickActionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setSelectedStudent(null) // Clear selected student
                  setActiveSection('requests')
                  setRequestFilter('all')
                  setShowQuickActionsModal(false)
                }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View All Requests</span>
                </div>
                <PlusIcon className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  setSelectedStudent(null) // Clear selected student
                  setActiveSection('sessions')
                  setSessionFilter('all')
                  setShowQuickActionsModal(false)
                }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View All Sessions</span>
                </div>
                <PlusIcon className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  setSelectedStudent(null) // Clear selected student
                  setActiveSection('payments')
                  setShowQuickActionsModal(false)
                }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <CreditCardIcon className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View Payment History</span>
                </div>
                <PlusIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
              <button
                onClick={() => setShowRequestDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">Request Details</h4>
                <p className="text-sm text-gray-600">Student: {selectedRequest.student_name}</p>
                <p className="text-sm text-gray-600">Subjects: {selectedRequest.subjects}</p>
                <p className="text-sm text-gray-600">Grade Level: {selectedRequest.grade_level}</p>
                <p className="text-sm text-gray-600">Preferred Schedule: {selectedRequest.preferred_schedule}</p>
                <p className="text-sm text-gray-600">Location: {selectedRequest.location}</p>
                <p className="text-sm text-gray-600">Additional Requirements: {selectedRequest.additional_requirements}</p>
                <p className="text-sm text-gray-600">Status: {selectedRequest.status.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600">Created At: {formatDate(selectedRequest.created_at)}</p>
              </div>
              {selectedRequest.matched_tutor_id && (
                <div>
                  <h4 className="text-md font-medium text-gray-900">Tutor Details</h4>
                  <p className="text-sm text-gray-600">Tutor: {selectedRequest.matched_tutor_id}</p>
                  <p className="text-sm text-gray-600">Matched At: {selectedRequest.matched_at ? formatDate(selectedRequest.matched_at) : 'N/A'}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <button
                  onClick={() => {
                    setSelectedRequest(null)
                    setShowRequestDetailsModal(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
              <button
                onClick={() => setShowSessionDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-900">Session Details</h4>
                <p className="text-sm text-gray-600">Date: {formatDate(selectedSession.session_date)}</p>
                <p className="text-sm text-gray-600">Time: {selectedSession.start_time} - {selectedSession.end_time}</p>
                <p className="text-sm text-gray-600">Duration: {selectedSession.duration_hours} hours</p>
                <p className="text-sm text-gray-600">Amount: {selectedSession.amount.toLocaleString()} Leones</p>
                <p className="text-sm text-gray-600">Status: {selectedSession.status.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600">Notes: {selectedSession.notes}</p>
                <p className="text-sm text-gray-600">Created At: {formatDate(selectedSession.created_at)}</p>
              </div>
              {selectedSession.status === 'proposed' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'approve')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Session
                  </button>
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Session
                  </button>
                </div>
              )}
              {selectedSession.status === 'approved' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'complete')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Session
                  </button>
                </div>
              )}
              {selectedSession.status === 'in_progress' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'complete')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Session
                  </button>
                </div>
              )}
              {selectedSession.status === 'rejected' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'approve')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Session
                  </button>
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'complete')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
              {selectedSession.status === 'completed' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSessionAction(selectedSession.id, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Session
                  </button>
                </div>
              )}
            </div>
          </motion.div>
                 </div>
       )}

       {/* Notifications Modal */}
       {showNotificationsModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
               <button
                 onClick={() => setShowNotificationsModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               {notifications.length === 0 ? (
                 <div className="text-center py-8">
                   <BellIcon className="w-12 h-12 text-gray-400 mx-auto" />
                   <p className="mt-2 text-gray-600">No notifications</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {notifications.map((notification) => (
                     <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <p className="text-sm text-gray-900">{notification.message}</p>
                           <p className="text-xs text-gray-500 mt-1">
                             {notification.timestamp.toLocaleString()}
                           </p>
                         </div>
                         {notification.type === 'session_proposed' && (
                           <button
                             onClick={() => {
                               const session = sessions.find(s => s.id === notification.sessionId)
                               if (session) {
                                 setSelectedSession(session)
                                 setShowSessionDetailsModal(true)
                                 setShowNotificationsModal(false)
                               }
                             }}
                             className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                           >
                             Review
                           </button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </motion.div>
         </div>
       )}

       {/* Child Details Modal */}
       {showChildDetailsModal && selectedChildForDetails && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Child Details</h3>
               <button
                 onClick={() => {
                   setShowChildDetailsModal(false)
                   setSelectedChildForDetails(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               <div className="space-y-4">
                 <div className="flex items-center space-x-4">
                   <div className="p-3 bg-primary-100 rounded-lg">
                     <UserIcon className="w-8 h-8 text-primary-600" />
                   </div>
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900">{selectedChildForDetails.name}</h4>
                     <p className="text-sm text-gray-600">{selectedChildForDetails.age} years old</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                     <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedChildForDetails.grade_level}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                     <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedChildForDetails.school_name}</p>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Added On</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {formatDate(selectedChildForDetails.created_at)}
                   </p>
                 </div>

                 <div className="flex space-x-3 pt-4">
                   <button
                     onClick={() => {
                       setShowChildDetailsModal(false)
                       setSelectedChildForDetails(null)
                       handleEditChild(selectedChildForDetails)
                     }}
                     className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                   >
                     Edit Child
                   </button>
                   <button
                     onClick={() => handleDeleteChild(selectedChildForDetails.id)}
                     className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                   >
                     Delete Child
                   </button>
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       )}

       {/* Edit Child Modal */}
       {showEditChildModal && selectedChildForEdit && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Edit Child</h3>
               <button
                 onClick={() => {
                   setShowEditChildModal(false)
                   setSelectedChildForEdit(null)
                   setEditChildForm({ name: '', age: '', grade_level: '', school_name: '' })
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <form onSubmit={handleUpdateChild} className="px-6 py-4">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Child's Name
                   </label>
                   <input
                     type="text"
                     required
                     value={editChildForm.name}
                     onChange={(e) => setEditChildForm({...editChildForm, name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Age
                   </label>
                   <input
                     type="number"
                     required
                     min="1"
                     max="25"
                     value={editChildForm.age}
                     onChange={(e) => setEditChildForm({...editChildForm, age: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Grade Level
                   </label>
                   <select
                     required
                     value={editChildForm.grade_level}
                     onChange={(e) => setEditChildForm({...editChildForm, grade_level: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   >
                     <option value="">Select Grade</option>
                     <option value="Primary 1">Primary 1</option>
                     <option value="Primary 2">Primary 2</option>
                     <option value="Primary 3">Primary 3</option>
                     <option value="Primary 4">Primary 4</option>
                     <option value="Primary 5">Primary 5</option>
                     <option value="Primary 6">Primary 6</option>
                     <option value="JSS 1">JSS 1</option>
                     <option value="JSS 2">JSS 2</option>
                     <option value="JSS 3">JSS 3</option>
                     <option value="SSS 1">SSS 1</option>
                     <option value="SSS 2">SSS 2</option>
                     <option value="SSS 3">SSS 3</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     School Name
                   </label>
                   <input
                     type="text"
                     required
                     value={editChildForm.school_name}
                     onChange={(e) => setEditChildForm({...editChildForm, school_name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
                 <div className="flex space-x-3 pt-4">
                   <button
                     type="submit"
                     disabled={isSubmitting}
                     className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                   >
                     {isSubmitting ? 'Updating...' : 'Update Child'}
                   </button>
                   <button
                     type="button"
                     onClick={() => {
                       setShowEditChildModal(false)
                       setSelectedChildForEdit(null)
                       setEditChildForm({ name: '', age: '', grade_level: '', school_name: '' })
                     }}
                     className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             </form>
           </motion.div>
         </div>
       )}

       {/* Tutor Details Modal */}
       {showTutorDetailsModal && selectedTutor && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Tutor Details</h3>
               <button
                 onClick={() => {
                   setShowTutorDetailsModal(false)
                   setSelectedTutor(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               <div className="space-y-6">
                 {/* Tutor Header */}
                 <div className="flex items-start space-x-4">
                   <div className="p-3 bg-primary-100 rounded-lg">
                     <AcademicCapIcon className="w-8 h-8 text-primary-600" />
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center space-x-3">
                       <h4 className="text-xl font-semibold text-gray-900">{selectedTutor.display_name}</h4>
                       {selectedTutor.is_featured && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                           Featured
                         </span>
                       )}
                     </div>
                     <p className="text-sm text-gray-600 mt-1">{selectedTutor.education_level}</p>
                     <div className="flex items-center mt-2">
                       <div className="flex items-center">
                         {[...Array(5)].map((_, i) => (
                           <svg
                             key={i}
                             className={`w-4 h-4 ${
                               i < Math.floor(selectedTutor.rating)
                                 ? 'text-yellow-400'
                                 : 'text-gray-300'
                             }`}
                             fill="currentColor"
                             viewBox="0 0 20 20"
                           >
                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                           </svg>
                         ))}
                         <span className="ml-1 text-sm text-gray-600">
                           {selectedTutor.rating} ({selectedTutor.total_reviews} reviews)
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Tutor Information Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                     <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                       {selectedTutor.subjects_taught.join(', ')}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                     <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                       {selectedTutor.experience_years} years
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                     <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                       {selectedTutor.availability_summary}
                     </p>
                   </div>
                 </div>

                 {/* Bio */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedTutor.bio_summary}
                   </p>
                 </div>

                 {/* Reviews */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">Recent Reviews</label>
                   {getTutorReviews(selectedTutor.tutor_id).length === 0 ? (
                     <p className="text-sm text-gray-500">No reviews yet</p>
                   ) : (
                     <div className="space-y-3">
                       {getTutorReviews(selectedTutor.tutor_id).slice(0, 3).map((review) => (
                         <div key={review.id} className="border border-gray-200 rounded-lg p-3">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center">
                               {[...Array(5)].map((_, i) => (
                                 <svg
                                   key={i}
                                   className={`w-3 h-3 ${
                                     i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                   }`}
                                   fill="currentColor"
                                   viewBox="0 0 20 20"
                                 >
                                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                 </svg>
                               ))}
                             </div>
                             <span className="text-xs text-gray-500">
                               {formatDate(review.session_date)}
                             </span>
                           </div>
                           <p className="text-sm text-gray-900">{review.review_text}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       )}

       {/* Tutor Proposal Response Modal */}
       {showTutorProposalsModal && selectedProposal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Respond to Proposal</h3>
               <button
                 onClick={() => {
                   setShowTutorProposalsModal(false)
                   setSelectedProposal(null)
                   setProposalResponse({ action: '', notes: '' })
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Your Response
                   </label>
                   <div className="space-y-2">
                     <label className="flex items-center">
                       <input
                         type="radio"
                         name="action"
                         value="accept"
                         checked={proposalResponse.action === 'accept'}
                         onChange={(e) => setProposalResponse({...proposalResponse, action: e.target.value})}
                         className="mr-2"
                       />
                       <span className="text-sm text-gray-900">Accept this tutor</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="radio"
                         name="action"
                         value="reject"
                         checked={proposalResponse.action === 'reject'}
                         onChange={(e) => setProposalResponse({...proposalResponse, action: e.target.value})}
                         className="mr-2"
                       />
                       <span className="text-sm text-gray-900">Decline this tutor</span>
                     </label>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Notes (Optional)
                   </label>
                   <textarea
                     value={proposalResponse.notes}
                     onChange={(e) => setProposalResponse({...proposalResponse, notes: e.target.value})}
                     rows={3}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Add any notes about your decision..."
                   />
                 </div>
                 <div className="flex space-x-3 pt-4">
                   <button
                     onClick={() => {
                       if (!proposalResponse.action) {
                         alert('Please select an action')
                         return
                       }
                       handleProposalResponse(selectedProposal.id, proposalResponse.action as 'accept' | 'reject', proposalResponse.notes)
                     }}
                     disabled={isSubmitting || !proposalResponse.action}
                     className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                   >
                     {isSubmitting ? 'Submitting...' : 'Submit Response'}
                   </button>
                   <button
                     onClick={() => {
                       setShowTutorProposalsModal(false)
                       setSelectedProposal(null)
                       setProposalResponse({ action: '', notes: '' })
                     }}
                     className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       )}

       {/* Profile Management Modal */}
       {showProfileModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
               <button
                 onClick={() => setShowProfileModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <form onSubmit={handleUpdateProfile} className="px-6 py-4">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Full Name
                   </label>
                   <input
                     type="text"
                     required
                     value={profileForm.full_name}
                     onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email Address
                   </label>
                   <input
                     type="email"
                     required
                     value={profileForm.email}
                     disabled
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                   />
                   <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Phone Number
                   </label>
                   <input
                     type="tel"
                     required
                     value={profileForm.phone}
                     onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   />
                 </div>
               </div>
               <div className="mt-6 flex space-x-3">
                 <button
                   type="button"
                   onClick={() => setShowProfileModal(false)}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   disabled={isSubmitting}
                   className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                 >
                   {isSubmitting ? 'Updating...' : 'Update Profile'}
                 </button>
               </div>
             </form>
           </motion.div>
         </div>
       )}

       {/* Student Progress Detail Modal */}
       {showProgressModal && selectedProgress && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Student Progress Details</h3>
               <button
                 onClick={() => {
                   setShowProgressModal(false)
                   setSelectedProgress(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                   <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedProgress.subject}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Mastery Level</label>
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMasteryLevelColor(selectedProgress.mastery_level)}`}>
                     {selectedProgress.mastery_level}
                   </span>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate</label>
                   <p className={`text-lg font-medium ${getAttendanceColor(selectedProgress.attendance_rate)} bg-gray-50 px-3 py-2 rounded-lg`}>
                     {selectedProgress.attendance_rate}%
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {formatDate(selectedProgress.last_updated)}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {formatDate(selectedProgress.created_at)}
                   </p>
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       )}

       {/* Session Report Detail Modal */}
       {showReportModal && selectedReport && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
           >
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-gray-900">Session Report Details</h3>
               <button
                 onClick={() => {
                   setShowReportModal(false)
                   setSelectedReport(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6">
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
                   <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {formatDate(selectedReport.session_date)}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Topics Covered</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.topics_covered}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Student Engagement</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.student_engagement}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.areas_for_improvement}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Homework Assigned</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.homework_assigned}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Next Session Focus</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.next_session_focus}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tutor Notes</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {selectedReport.tutor_notes}
                   </p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                   <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                     {formatDate(selectedReport.created_at)}
                   </p>
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       )}
     </div>
   )
 } 