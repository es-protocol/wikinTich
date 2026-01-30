'use client'

import {
    EmptyState,
    RequestCardSkeleton,
    SessionCardSkeleton,
    StudentCardSkeleton
} from '@/app/components/SkeletonLoader'
import { useAuth } from '@/lib/auth-context'
import { sanitizeInput } from '@/lib/security'
import { supabase } from '@/lib/supabase'
import {
    AcademicCapIcon,
    ArrowRightOnRectangleIcon,
    BellIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    CreditCardIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    UserIcon,
    UserPlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { FormEvent, Fragment, useEffect, useState } from 'react'

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
  request_id: string | null
  tutor_id: string
  student_id: string
  session_date: string
  start_time: string
  end_time: string
  duration_hours: number
  amount: number
  status: 'scheduled' | 'approved' | 'change_requested' | 'rescheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  created_at: string
  updated_at: string | null
  created_by?: string  // Add this field to track who created the session
  // New fields for session scheduling
  title?: string
  description?: string
  subjects?: string[]
  change_request_message?: string
  change_requested_at?: string
  change_requested_by?: 'tutor' | 'parent'
  is_recurring?: boolean
  recurrence_rule?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    interval: number
    days_of_week?: string[]
    end_date?: string
    end_after_occurrences?: number
  }
  recurring_parent_id?: string
  location_type?: 'home' | 'online' | 'other'
  location_address?: string
  meeting_link?: string
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

// Weekly Schedule Component
const WeeklyScheduleView = ({ 
  sessions, 
  students, 
  getTutorName, 
  formatDuration 
}: { 
  sessions: Session[]
  students: Student[]
  getTutorName: (tutorId: string | null) => string
  formatDuration: (durationHours: number) => string
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  // Get the start of the current week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }
  
  // Generate week days
  const getWeekDays = () => {
    const weekStart = getWeekStart(currentWeek)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }
  
  // Get sessions for a specific day
  const getSessionsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return sessions.filter(session => session.session_date === dateStr)
  }
  
  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() - 7)
    setCurrentWeek(newDate)
  }
  
  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + 7)
    setCurrentWeek(newDate)
  }
  
  // Get student name by ID
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student ? student.name : 'Unknown Student'
  }
  
  // Format time for display
  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds if present
  }
  
  const weekDays = getWeekDays()
  
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Sessions</h3>
        <p className="text-gray-600">You don't have any approved tutoring sessions yet.</p>
        <p className="text-sm text-gray-500 mt-1">Sessions will appear here once they are approved by tutors.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous Week
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {getWeekStart(currentWeek).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {getWeekStart(currentWeek).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        
        <button
          onClick={goToNextWeek}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Next Week
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-8 gap-1 bg-gray-100 rounded-lg p-1">
        {/* Time column header */}
        <div className="bg-gray-50 rounded p-2 text-center">
          <span className="text-xs font-medium text-gray-500">Time</span>
        </div>
        
        {/* Day headers */}
        {weekDays.map((day, index) => (
          <div key={index} className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs font-medium text-gray-900">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-xs text-gray-500">
              {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
        
        {/* Time slots */}
        {Array.from({ length: 14 }, (_, hourIndex) => {
          const hour = 8 + hourIndex // Start from 8 AM
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`
          
          return (
            <Fragment key={hourIndex}>
              {/* Time label */}
              <div className="bg-gray-50 rounded p-2 text-center">
                <span className="text-xs font-medium text-gray-500">{timeSlot}</span>
              </div>
              
              {/* Day columns */}
              {weekDays.map((day, dayIndex) => {
                const daySessions = getSessionsForDay(day)
                const hourSessions = daySessions.filter(session => {
                  const sessionHour = parseInt(session.start_time.split(':')[0])
                  return sessionHour === hour
                })
                
                return (
                  <div key={dayIndex} className="min-h-[60px] bg-white rounded p-1 relative">
                    {hourSessions.map((session, sessionIndex) => (
                      <div
                        key={session.id}
                        className="absolute inset-1 bg-blue-100 border border-blue-300 rounded text-xs p-1 overflow-hidden"
                        style={{
                          top: `${(sessionIndex * 25)}px`,
                          height: '20px',
                          zIndex: sessionIndex + 1
                        }}
                      >
                        <div className="font-medium text-blue-900 truncate">
                          {getStudentName(session.student_id)}
                        </div>
                        <div className="text-blue-700 truncate">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </div>
                        <div className="text-blue-600 truncate">
                          {getTutorName(session.tutor_id)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
                         </Fragment>
          )
        })}
      </div>
      
      {/* Session Details List */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
        <div className="space-y-3">
          {sessions
            .filter(session => {
              const sessionDate = new Date(session.session_date)
              const weekStart = getWeekStart(currentWeek)
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekStart.getDate() + 6)
              return sessionDate >= weekStart && sessionDate <= weekEnd
            })
            .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
            .map(session => (
              <div key={session.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {new Date(session.session_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)} ({formatDuration(session.duration_hours)})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Student: {getStudentName(session.student_id)} • Tutor: {getTutorName(session.tutor_id)}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        Notes: {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {session.amount.toLocaleString()} Leones
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardWithChildren() {
  const { user, isLoading: authLoading } = useAuth()
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
  
  // Session action modal states
  const [showRequestChangeModal, setShowRequestChangeModal] = useState(false)
  const [sessionForChangeRequest, setSessionForChangeRequest] = useState<Session | null>(null)
  const [changeRequestMessage, setChangeRequestMessage] = useState('')
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false)
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false)
  const [showChildDetailsModal, setShowChildDetailsModal] = useState(false)
  const [showEditChildModal, setShowEditChildModal] = useState(false)
  const [selectedChildForDetails, setSelectedChildForDetails] = useState<Student | null>(null)
  const [selectedChildForEdit, setSelectedChildForEdit] = useState<Student | null>(null)
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
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
  const [selectedStudentForSession, setSelectedStudentForSession] = useState<string>('')
  
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
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: ''
  })

  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    notificationType: string
    message: string
    sessionId?: string
    timestamp: Date
    is_read: boolean
  }>>([])

  // CSRF token for session state-changing requests (accept, request-change, cancel)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  const fetchUserProfile = async () => {
    try {
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const response = await fetch(`/api/dashboard?userId=${user.id}&type=profile`, {
        credentials: 'include' // Include session cookie
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching user profile:', result.error)
        return
      }

      setUserProfile(result.data)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile()
    }
  }, [user, authLoading])

  // Fetch CSRF token when user is loaded (required for session accept/request-change/cancel)
  useEffect(() => {
    if (!user) return
    const loadCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (data?.token) setCsrfToken(data.token)
      } catch {
        // Non-blocking; session APIs will return 400 if token missing
      }
    }
    loadCsrfToken()
  }, [user])

  useEffect(() => {
    if (userProfile) {
      fetchStudents()
    }
  }, [userProfile])

  useEffect(() => {
    if (userProfile) {
      // Fetch requests first, then fetch tutor data with the requests
      const loadData = async () => {
        try {
          // Fetch requests first (we need them for tutor data)
          const requests = await fetchTutoringRequests()
          
          // Run remaining data fetching in parallel
          await Promise.all([
            fetchSessions(),
            fetchTutorData(requests),
            fetchStudentProgress(),
            fetchSessionReports(),
            fetchParentNotifications()
          ])
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        }
      }
      loadData()
    }
  }, [userProfile, selectedStudent])

  useEffect(() => {
    if (!userProfile) {
      return
    }

    const interval = setInterval(() => {
      fetchParentNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [userProfile])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close notifications dropdown
      if (showNotificationsDropdown && !target.closest('.notifications-dropdown')) {
        setShowNotificationsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationsDropdown])

  // Note: No automatic notifications for pending sessions
  // Parents only receive notifications when tutors approve/reject or propose sessions

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      
      if (!userProfile) return

      const response = await fetch(`/api/dashboard?userId=${userProfile.id}&type=students`, {
        credentials: 'include' // Include session cookie
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching students:', result.error)
        return
      }

      setStudents(result.data || [])
      
      // Auto-select first child if available
      if (result.data && result.data.length > 0 && !selectedStudent) {
        setSelectedStudent(result.data[0])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchTutoringRequests = async (): Promise<TutoringRequest[]> => {
    try {
      setIsLoadingRequests(true)
      
      if (!userProfile) return []

      const response = await fetch(`/api/dashboard?userId=${userProfile.id}&type=requests`, {
        credentials: 'include' // Include session cookie
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching tutoring requests:', result.error)
        return []
      }

      // Filter by selected student if one is selected
      let filteredRequests = result.data || []
      if (selectedStudent) {
        filteredRequests = filteredRequests.filter((req: any) => req.student_id === selectedStudent.id)
      }

      setTutoringRequests(filteredRequests)
      return filteredRequests
    } catch (error) {
      console.error('Error fetching tutoring requests:', error)
      return []
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true)
      
      if (!userProfile) return

      // Use dedicated parent sessions API (reliable join); dashboard API sessions query can fail on tutors join
      const url = selectedStudent
        ? `/api/parent/sessions?limit=200&student_id=${selectedStudent.id}`
        : '/api/parent/sessions?limit=200'
      const response = await fetch(url, {
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching sessions:', result.error)
        setSessions([])
        return
      }

      const sessionsList = result.sessions ?? result.data ?? []
      setSessions(sessionsList)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleNewChild = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          parent_id: userProfile.id,
          name: sanitizeInput(newChildForm.name),
          age: parseInt(newChildForm.age),
          grade_level: sanitizeInput(newChildForm.grade_level),
          school_name: sanitizeInput(newChildForm.school_name)
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

  const handleNewRequest = async (e: FormEvent) => {
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
          subjects: sanitizeInput(newRequestForm.subjects),
          preferred_schedule: sanitizeInput(newRequestForm.preferred_schedule),
          location: newRequestForm.location,
          additional_requirements: sanitizeInput(newRequestForm.additional_requirements),
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

  const handleSessionAction = async (sessionId: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      // For approve action, use the new API
      if (action === 'approve') {
        setIsSubmitting(true)
        const response = await fetch(`/api/parent/sessions/${sessionId}/accept`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ csrf_token: csrfToken ?? '' }),
        })
        
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to accept session')
        }
        
        await fetchSessions()
        setShowSessionDetailsModal(false)
        setSelectedSession(null)
        alert('Session accepted successfully!')
        return
      }

      // For reject, show cancel modal
      if (action === 'reject') {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
          setSessionToCancel(session)
          setShowCancelSessionModal(true)
        }
        return
      }

      // For complete (backwards compatible)
      const newStatus = action === 'complete' ? 'completed' : 'scheduled'
      
      const { error } = await supabase
        .from('home_tutoring_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId)
        .select()

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
      alert(error instanceof Error ? error.message : 'Failed to update session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Request Change for a session
  const handleRequestChange = async () => {
    if (!sessionForChangeRequest || !changeRequestMessage.trim()) {
      alert('Please provide a message explaining the changes you need')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/parent/sessions/${sessionForChangeRequest.id}/request-change`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csrf_token: csrfToken ?? '', message: changeRequestMessage }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request change')
      }

      // Reset modal state
      setShowRequestChangeModal(false)
      setSessionForChangeRequest(null)
      setChangeRequestMessage('')
      
      await fetchSessions()
      alert('Change request sent successfully! The tutor will be notified.')
    } catch (error) {
      console.error('Error requesting change:', error)
      alert(error instanceof Error ? error.message : 'Failed to request change. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel session with reason
  const handleCancelSession = async () => {
    if (!sessionToCancel || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/parent/sessions/${sessionToCancel.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csrf_token: csrfToken ?? '', reason: cancelReason }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel session')
      }

      // Reset modal state
      setShowCancelSessionModal(false)
      setSessionToCancel(null)
      setCancelReason('')
      setShowSessionDetailsModal(false)
      setSelectedSession(null)
      
      await fetchSessions()
      alert('Session cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling session:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open request change modal
  const openRequestChangeModal = (session: Session) => {
    setSessionForChangeRequest(session)
    setChangeRequestMessage('')
    setShowRequestChangeModal(true)
  }

  // Open cancel modal
  const openCancelModal = (session: Session) => {
    setSessionToCancel(session)
    setCancelReason('')
    setShowCancelSessionModal(true)
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

  const handleUpdateChild = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedChildForEdit) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('students')
        .update({
          name: sanitizeInput(editChildForm.name),
          age: parseInt(editChildForm.age),
          grade_level: sanitizeInput(editChildForm.grade_level),
          school_name: sanitizeInput(editChildForm.school_name),
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
    if (!confirm('Are you sure you want to delete this child? This action cannot be undone. All associated tutoring requests, sessions, and data will also be deleted.')) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // First, delete related sessions
      const { error: sessionsError } = await supabase
        .from('home_tutoring_sessions')
        .delete()
        .eq('student_id', childId)

      if (sessionsError) {
        console.error('Error deleting sessions:', sessionsError)
      }

      // Delete related tutoring requests
      const { error: requestsError } = await supabase
        .from('home_tutoring_requests')
        .delete()
        .eq('student_id', childId)

      if (requestsError) {
        console.error('Error deleting requests:', requestsError)
      }

      // Finally, delete the child
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', childId)

      if (error) {
        console.error('Error deleting child:', error)
        alert('Failed to delete child. Please try again.')
        return
      }

      // Refresh all data
      await Promise.all([
        fetchStudents(),
        fetchTutoringRequests(),
        fetchSessions()
      ])

      // Clear selected student if it was the deleted one
      if (selectedStudent?.id === childId) {
        setSelectedStudent(null)
      }

      // Close any open modals
      setShowChildDetailsModal(false)
      setShowEditChildModal(false)
      setSelectedChildForDetails(null)
      setSelectedChildForEdit(null)

      alert('Child and all associated data deleted successfully!')
    } catch (error) {
      console.error('Error deleting child:', error)
      alert('Failed to delete child. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    // Find the session and open the cancel modal
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      openCancelModal(session)
      return
    }
    
    // Fallback to direct delete if session not found
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('home_tutoring_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting session:', error)
        alert('Failed to delete session. Please try again.')
        return
      }

      await fetchSessions()
      alert('Session deleted successfully!')
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session. Please try again.')
    }
  }

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!userProfile?.id) {
        throw new Error('No user profile found')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: sanitizeInput(profileForm.full_name),
          phone: sanitizeInput(profileForm.phone)
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

  const fetchTutorData = async (requests?: TutoringRequest[]) => {
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

      // Use passed requests or fall back to state
      const requestsToUse = requests || tutoringRequests
      
      // Get matched tutor IDs from tutoring requests
      const matchedTutorIds = requestsToUse
        .filter(r => r.matched_tutor_id)
        .map(r => r.matched_tutor_id as string)
      
      const uniqueTutorIds = Array.from(new Set(matchedTutorIds))
      
      if (uniqueTutorIds.length > 0) {
        // Fetch tutor display info via API (bypasses RLS)
        const response = await fetch(`/api/parent/matched-tutor?tutor_ids=${uniqueTutorIds.join(',')}`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const transformedInfo = data.tutors?.map((tutor: any) => ({
            id: tutor.tutor_id,
            tutor_id: tutor.tutor_id,
            display_name: tutor.display_name,
            subjects_taught: Array.isArray(tutor.subjects) ? tutor.subjects.filter((s: any) => s !== null && s !== undefined) : (tutor.subjects ? [tutor.subjects] : []),
            experience_years: 0,
            education_level: 'Not specified',
            bio_summary: tutor.bio || 'No bio available',
            availability_summary: 'Not specified',
            rating: 0,
            total_reviews: 0,
            is_featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })) || []
          setTutorDisplayInfo(transformedInfo)
        } else {
          console.error('Error fetching tutor display info via API:', response.status)
        }
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

  const fetchParentNotifications = async () => {
    try {
      if (!userProfile) return
      
      const response = await fetch(`/api/dashboard?userId=${userProfile.id}&type=notifications`, {
        credentials: 'include' // Include session cookie
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching parent notifications:', result.error)
        return
      }

      // Transform notifications to match the local state format
      const transformedNotifications = (result.data || []).map((notif: any) => {
        return {
          id: notif.id,
          title: notif.title || 'Notification',
          notificationType: notif.notification_type || 'system',
          message: notif.message,
          sessionId: undefined, // Could be extracted from message if needed
          timestamp: new Date(notif.created_at),
          is_read: notif.is_read || false // Use existing is_read field or default to false
        }
      })
      setNotifications(transformedNotifications)
    } catch (error) {
      console.error('Error fetching parent notifications:', error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark notification as read via API (persists; client Supabase can be blocked by RLS)
      if (!notification.is_read) {
        const response = await fetch('/api/parent/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationIds: [notification.id] }),
        })
        if (response.ok) {
          setNotifications(prev =>
            prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
          )
        }
      }

      // Close dropdown
      setShowNotificationsDropdown(false)

      // Handle different notification types
      switch (notification.notificationType) {
        case 'match':
          setActiveSection('requests')
          break
        case 'session':
        case 'home_tutoring':
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
      if (!userProfile) return

      const response = await fetch('/api/parent/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAll: true }),
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
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
          response_notes: sanitizeInput(notes)
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
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'no_show':
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

  const getFilteredRequests = () => {
    if (requestFilter === 'all') return tutoringRequests
    return tutoringRequests.filter(request => request.status === requestFilter)
  }

  const getFilteredSessions = () => {
    if (sessionFilter === 'all') return sessions
    
    // Group related statuses
    if (sessionFilter === 'pending') {
      return sessions.filter(s => s.status === 'scheduled' || s.status === 'rescheduled')
    }
    if (sessionFilter === 'approved') {
      return sessions.filter(s => s.status === 'approved' || s.status === 'confirmed')
    }
    if (sessionFilter === 'cancelled') {
      return sessions.filter(s => s.status === 'cancelled' || s.status === 'no_show')
    }
    
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
        (s.status === 'completed' || s.status === 'scheduled')
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
            {/* Children Management */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StudentCardSkeleton />
                  <StudentCardSkeleton />
                  <StudentCardSkeleton />
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

            {/* Child Selection Prompt */}
            {!selectedStudent && students.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <UserIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Child</h3>
                <p className="text-blue-700 mb-4">
                  Use the child selector in the header above to view detailed information for a specific child.
                </p>
                <p className="text-sm text-blue-600">
                  You can also click on any child card above to select them.
                </p>
              </div>
            )}

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
                        <p className="text-sm text-gray-500 mt-1">Sessions will appear here once tutors propose them.</p>
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
                                  Duration: {formatDuration(session.duration_hours)}
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
                            disabled={isSubmitting}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => handleEditChild(student)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteChild(student.id)}
                            disabled={isSubmitting}
                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete child"
                          >
                            <TrashIcon className="w-4 h-4" />
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
              {!selectedStudent ? (
                <EmptyState
                  icon={UserIcon}
                  title="No child selected"
                  description="Please select a child to view their tutoring requests"
                />
              ) : isLoadingRequests ? (
                <div className="space-y-4">
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
                  <RequestCardSkeleton />
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
              </div>
              
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                {[
                  { id: 'all', name: 'All', count: sessions.length },
                  { id: 'pending', name: 'Pending', count: sessions.filter(s => s.status === 'scheduled' || s.status === 'rescheduled').length },
                  { id: 'change_requested', name: 'Change Requested', count: sessions.filter(s => s.status === 'change_requested').length },
                  { id: 'approved', name: 'Approved', count: sessions.filter(s => s.status === 'approved' || s.status === 'confirmed').length },
                  { id: 'completed', name: 'Completed', count: sessions.filter(s => s.status === 'completed').length },
                  { id: 'cancelled', name: 'Cancelled', count: sessions.filter(s => s.status === 'cancelled' || s.status === 'no_show').length }
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
              {!selectedStudent ? (
                <EmptyState
                  icon={UserIcon}
                  title="No child selected"
                  description="Please select a child to view their sessions"
                />
              ) : isLoadingSessions ? (
                <div className="space-y-4">
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                </div>
              ) : getFilteredSessions().length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">No {sessionFilter === 'all' ? '' : sessionFilter === 'pending' ? 'pending ' : sessionFilter + ' '}sessions found</p>
                  <p className="text-sm text-gray-500">
                    {sessionFilter === 'change_requested' ? 'No sessions awaiting tutor response' : 'Sessions will appear here once tutors are matched and propose them'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredSessions().map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        session.status === 'change_requested'
                          ? 'border-orange-200 bg-orange-50'
                          : session.status === 'approved' || session.status === 'confirmed'
                          ? 'border-blue-200 bg-blue-50'
                          : session.status === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : session.status === 'cancelled' || session.status === 'no_show'
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {session.title || `Session on ${formatDate(session.session_date)}`}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                              session.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                              session.status === 'change_requested' ? 'bg-orange-100 text-orange-800' :
                              session.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              session.status === 'completed' ? 'bg-green-100 text-green-800' :
                              session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              session.status === 'no_show' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status === 'change_requested' ? 'Change Requested' : 
                               session.status === 'no_show' ? 'No Show' :
                               session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </span>
                            {session.is_recurring && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Recurring
                              </span>
                            )}
                            {session.created_by === 'tutor' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Proposed by Tutor
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(session.session_date)} • {session.start_time} - {session.end_time} ({formatDuration(session.duration_hours)})
                          </p>
                          {session.location_type && (
                            <p className="text-sm text-gray-500 mt-1">
                              Location: {session.location_type === 'home' ? 'At Home' : session.location_type === 'online' ? 'Online' : 'Other'}
                              {session.location_type === 'online' && session.meeting_link && (
                                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-600 hover:underline">
                                  Join Meeting
                                </a>
                              )}
                            </p>
                          )}
                          {session.notes && (
                            <p className="text-sm text-gray-500 mt-1">Notes: {session.notes}</p>
                          )}
                          
                          {/* Change Request Message - if parent requested change */}
                          {session.status === 'change_requested' && session.change_request_message && (
                            <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200">
                              <p className="text-sm font-medium text-orange-800">Your Change Request:</p>
                              <p className="text-sm text-orange-700 mt-1">{session.change_request_message}</p>
                              <p className="text-xs text-orange-600 mt-1">Waiting for tutor to respond...</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(session.created_at)}
                          </p>
                          
                          {/* Session Actions */}
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedSession(session)
                                setShowSessionDetailsModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                            
                            {/* Tutor-proposed sessions (scheduled/rescheduled): Accept / Request Change / Decline */}
                            {(session.status === 'scheduled' || session.status === 'rescheduled') && session.created_by === 'tutor' && (
                              <>
                                <button
                                  onClick={() => handleSessionAction(session.id, 'approve')}
                                  disabled={isSubmitting}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSubmitting ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => openRequestChangeModal(session)}
                                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                                >
                                  Request Change
                                </button>
                                <button
                                  onClick={() => openCancelModal(session)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            
                            {/* Parent-created sessions (scheduled): Cancel only */}
                            {session.status === 'scheduled' && session.created_by === 'parent' && (
                              <button
                                onClick={() => openCancelModal(session)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                            
                            {/* Approved/Confirmed sessions: Can still cancel */}
                            {(session.status === 'approved' || session.status === 'confirmed') && (
                              <button
                                onClick={() => openCancelModal(session)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel Session
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'my-schedule':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Weekly Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">View all your approved tutoring sessions in a weekly calendar format</p>
            </div>
            <div className="p-6">
              {!selectedStudent ? (
                <div className="text-center py-8">
                  <UserIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-600">Please select a child to view schedule</p>
                  <p className="text-sm text-gray-500">Use the child selector in the header above</p>
                </div>
              ) : isLoadingSessions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading schedule...</p>
                </div>
              ) : (
                <WeeklyScheduleView 
                  sessions={sessions.filter(s => s.status === 'approved')}
                  students={students}
                  getTutorName={getTutorName}
                  formatDuration={formatDuration}
                />
              )}
            </div>
          </div>
        )

      // case 'student-progress': // Commented out for MVP
      //   return (
      //     <div className="bg-white rounded-lg shadow">
      //       <div className="px-6 py-4 border-b border-gray-200">
      //         <h3 className="text-lg font-medium text-gray-900">Student Progress</h3>
      //       </div>
      //       <div className="p-6">
      //         {isLoadingProgress ? (
      //           <div className="text-center py-8">
      //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      //             <p className="mt-2 text-gray-600">Loading progress data...</p>
      //           </div>
      //         ) : getFilteredProgress().length === 0 ? (
      //           <div className="text-center py-8">
      //           <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto" />
      //           <p className="mt-2 text-gray-600">No progress data yet</p>
      //           <p className="text-sm text-gray-500">Track your child's progress over time</p>
      //         </div>
      //       ) : (
      //         <div className="space-y-4">
      //           {getFilteredProgress().map((progress) => (
      //             <motion.div
      //               key={progress.id}
      //               initial={{ opacity: 0, y: 10 }}
      //               animate={{ opacity: 1, y: 0 }}
      //               className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      //             >
      //               <div className="flex items-center justify-between">
      //                 <div className="flex-1">
      //                   <div className="flex items-center space-x-3">
      //                     <h4 className="text-lg font-medium text-gray-900">{progress.subject}</h4>
      //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(progress.mastery_level)}`}>
      //                       {getStatusIcon(progress.mastery_level)}
      //                       <span className="ml-1">{progress.mastery_level}</span>
      //                     </span>
      //                   </div>
      //                   <p className="text-sm text-gray-600 mt-1">
      //                     Attendance Rate: {progress.attendance_rate}%
      //                     </p>
      //                     <p className="text-sm text-gray-500 mt-1">
      //                       Last Updated: {formatDate(progress.last_updated)}
      //                     </p>
      //                   </div>
      //                   <div className="text-right">
      //                     <p className="text-sm text-gray-500">
      //                       Created: {formatDate(progress.created_at)}
      //                     </p>
      //                     <button
      //                       onClick={() => {
      //                         setSelectedProgress(progress)
      //                         setShowProgressModal(true)
      //                       }}
      //                       className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
      //                     >
      //                       View Details
      //                       </button>
      //                     </div>
      //                   </div>
      //                 </motion.div>
      //               ))}
      //             </div>
      //           )}
      //         </div>
      //       </div>
      //     )

      // case 'session-reports': // Commented out for MVP
      //   return (
      //     <div className="bg-white rounded-lg shadow">
      //       <div className="px-6 py-4 border-b border-gray-200">
      //         <h3 className="text-lg font-medium text-gray-900">Session Reports</h3>
      //       </div>
      //       <div className="p-6">
      //         {isLoadingReports ? (
      //           <div className="text-center py-8">
      //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      //             <p className="mt-2 text-gray-600">Loading reports data...</p>
      //           </div>
      //         ) : getFilteredReports().length === 0 ? (
      //           <div className="text-center py-8">
      //           <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
      //           <p className="mt-2 text-gray-600">No reports yet</p>
      //           <p className="text-sm text-gray-500">Track your child's progress after each session</p>
      //         </div>
      //       ) : (
      //         <div className="space-y-4">
      //           {getFilteredReports().map((report) => (
      //             <motion.div
      //               key={report.id}
      //               initial={{ opacity: 0, y: 10 }}
      //               animate={{ opacity: 1, y: 0 }}
      //               className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      //             >
      //               <div className="flex items-center justify-between">
      //                 <div className="flex-1">
      //                   <div className="flex items-center space-x-3">
      //                     <h4 className="text-lg font-medium text-gray-900">{report.topics_covered}</h4>
      //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.student_engagement)}`}>
      //                       {getStatusIcon(report.student_engagement)}
      //                       <span className="ml-1">{report.student_engagement}</span>
      //                     </span>
      //                   </div>
      //                   <p className="text-sm text-gray-600 mt-1">
      //                         Areas for Improvement: {report.areas_for_improvement}
      //                       </p>
      //                       <p className="text-sm text-gray-500 mt-1">
      //                         Homework Assigned: {report.homework_assigned}
      //                       </p>
      //                       <p className="text-sm text-gray-500 mt-1">
      //                         Next Session Focus: {report.next_session_focus}
      //                       </p>
      //                       <p className="text-sm text-gray-600 mt-1">
      //                         Tutor Notes: {report.tutor_notes}
      //                       </p>
      //                     </div>
      //                     <div className="text-right">
      //                       <p className="text-sm text-gray-500">
      //                         Created: {formatDate(report.created_at)}
      //                       </p>
      //                       <button
      //                         onClick={() => {
      //                           setSelectedReport(report)
      //                           setShowReportModal(true)
      //                         }}
      //                         className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
      //                       >
      //                         View Details
      //                       </button>
      //                     </div>
      //                   </div>
      //                 </motion.div>
      //               ))}
      //             </div>
      //           )}
      //         </div>
      //       </div>
      //     )

      // case 'tutor-proposals': // Commented out for MVP
      //   return (
      //     <div className="bg-white rounded-lg shadow">
      //       <div className="px-6 py-4 border-b border-gray-200">
      //         <h3 className="text-lg font-medium text-gray-900">
      //           Tutor Proposals {selectedStudent ? `for ${selectedStudent.name}` : ''}
      //         </h3>
      //       </div>
      //       <div className="p-6">
      //         {!selectedStudent ? (
      //           <div className="text-center py-8">
      //           <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto" />
      //           <p className="mt-2 text-gray-600">Please select a child to view tutor proposals</p>
      //         </div>
      //       ) : isLoadingTutorData ? (
      //         <div className="text-center py-8">
      //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      //           <p className="mt-2 text-gray-600">Loading tutor proposals...</p>
      //         </div>
      //       ) : (
      //         <div className="space-y-6">
      //           {/* Pending Proposals */}
      //           <div>
      //             <h4 className="text-lg font-medium text-gray-900 mb-4">Pending Proposals</h4>
      //             {getPendingProposals().length === 0 ? (
      //               <div className="text-center py-6 bg-gray-50 rounded-lg">
      //             <AcademicCapIcon className="w-8 h-8 text-gray-400 mx-auto" />
      //             <p className="mt-2 text-gray-600">No pending proposals</p>
      //           </div>
      //         ) : (
      //           <div className="space-y-4">
      //             {getPendingProposals().map((proposal) => {
      //               const tutorInfo = getTutorDisplayInfo(proposal.tutor_id)
      //               return (
      //                 <motion.div
      //                   key={proposal.id}
      //                   initial={{ opacity: 0, y: 10 }}
      //                   animate={{ opacity: 1, y: 0 }}
      //                   className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      //                 >
      //                   <div className="flex items-start justify-between">
      //                     <div className="flex-1">
      //                       <div className="flex items-center space-x-3">
      //                         <h5 className="text-lg font-medium text-gray-900">
      //                           {tutorInfo?.display_name || 'Tutor'}
      //                         </h5>
      //                         {tutorInfo?.is_featured && (
      //                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      //                             Featured
      //                           </span>
      //                         )}
      //                       </div>
      //                       <p className="text-sm text-gray-600 mt-1">
      //                         Subjects: {tutorInfo?.subjects_taught?.join(', ')}
      //                       </p>
      //                       <p className="text-sm text-gray-500 mt-1">
      //                         Experience: {tutorInfo?.experience_years} years • {tutorInfo?.education_level}
      //                       </p>
      //                       
      //                       <p className="text-sm text-gray-500 mt-1">
      //                         Availability: {tutorInfo?.availability_summary}
      //                       </p>
      //                       <div className="flex items-center mt-2">
      //                         <div className="flex items-center">
      //                           {[...Array(5)].map((_, i) => (
      //                             <svg
      //                               key={i}
      //                               className={`w-4 h-4 ${
      //                                 i < Math.floor(tutorInfo?.rating || 0)
      //                                   ? 'text-yellow-400'
      //                                   : 'text-gray-300'
      //                               }`}
      //                               fill="currentColor"
      //                               viewBox="0 0 20 20"
      //                             >
      //                               <svg d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      //                             </svg>
      //                           ))}
      //                           <span className="ml-1 text-sm text-gray-600">
      //                             {tutorInfo?.rating} ({tutorInfo?.total_reviews} reviews)
      //                           </span>
      //                         </div>
      //                       </div>
      //                       <p className="text-sm text-gray-500 mt-2">
      //                         Proposed: {formatDate(proposal.proposed_at)}
      //                       </p>
      //                     </div>
      //                     <div className="flex flex-col space-y-2 ml-4">
      //                       <button
      //                         onClick={() => {
      //                           setSelectedTutor(tutorInfo || null)
      //                           setShowTutorDetailsModal(true)
      //                         }}
      //                         className="text-primary-600 hover:text-primary-700 text-sm font-medium"
      //                       >
      //                         View Details
      //                         </button>
      //                       <button
      //                         onClick={() => {
      //                           setSelectedProposal(proposal)
      //                           setShowTutorProposalsModal(true)
      //                         }}
      //                         className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
      //                       >
      //                         Respond
      //                         </button>
      //                     </div>
      //                   </div>
      //                 </motion.div>
      //               ))
      //             )}
      //           </div>
      //         </div>

      //         {/* Accepted Proposals */}
      //         <div>
      //           <h4 className="text-lg font-medium text-gray-900 mb-4">Accepted Proposals</h4>
      //           {getAcceptedProposals().length === 0 ? (
      //             <div className="text-center py-6 bg-gray-50 rounded-lg">
      //               <CheckCircleIcon className="w-8 h-8 text-gray-400 mx-auto" />
      //               <p className="mt-2 text-gray-600">No accepted proposals</p>
      //             </div>
      //           ) : (
      //             <div className="space-y-4">
      //               {getAcceptedProposals().map((proposal) => {
      //                 const tutorInfo = getTutorDisplayInfo(proposal.tutor_id)
      //                 return (
      //                   <motion.div
      //                     key={proposal.id}
      //                     initial={{ opacity: 0, y: 10 }}
      //                     animate={{ opacity: 1, y: 0 }}
      //                     className="border border-green-200 bg-green-50 rounded-lg p-4"
      //                   >
      //                     <div className="flex items-center space-x-3">
      //                       <div className="flex-1">
      //                         <div className="flex items-center space-x-3">
      //                           <h5 className="text-lg font-medium text-gray-900">
      //                             {tutorInfo?.display_name || 'Tutor'}
      //                           </h5>
      //                           <span className="inline-flex items-center px-2.5 py-0.500 rounded-full text-xs font-medium bg-green-100 text-green-800">
      //                             Accepted
      //                           </span>
      //                         </div>
      //                         <p className="text-sm text-gray-600 mt-1">
      //                           Subjects: {tutorInfo?.subjects_taught?.join(', ')}
      //                         </p>
      //                         <p className="text-sm text-gray-500 mt-1">
      //                           Accepted: {formatDate(proposal.responded_at || '')}
      //                         </p>
      //                         {proposal.response_notes && (
      //                           <p className="text-sm text-gray-600 mt-1">
      //                             Notes: {proposal.response_notes}
      //                           </p>
      //                         )}
      //                       </div>
      //                       <button
      //                         onClick={() => {
      //                           setSelectedTutor(tutorInfo || null)
      //                           setShowTutorDetailsModal(true)
      //                         }}
      //                         className="text-primary-600 hover:text-primary-700 text-sm font-medium"
      //                       >
      //                         View Details
      //                       </button>
      //                     </div>
      //                   </motion.div>
      //                 )
      //               })}
      //             </div>
      //           )}
      //         </div>
      //       </div>
      //     )}
      //   </div>
      // </div>
      // )

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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
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
  
  if (user.role !== 'parent') {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'school_admin') {
      window.location.href = '/school-admin-dashboard'
    } else if (user.role === 'tutor') {
      window.location.href = '/tutor-dashboard'
    } else {
      window.location.href = '/login'
    }
    return null
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
              
              {/* Child Selector - Always Visible */}
              {students.length > 0 && (
                <div className="ml-8">
                  <label htmlFor="child-selector" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Child
                  </label>
                  <select
                    id="child-selector"
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const student = students.find(s => s.id === e.target.value)
                      setSelectedStudent(student || null)
                    }}
                    className="block w-48 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="">Choose a child...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade_level})
                      </option>
                    ))}
                  </select>
                  {!selectedStudent && (
                    <p className="text-xs text-amber-600 mt-1">
                      Select a child to view detailed information
                    </p>
                  )}
                </div>
              )}
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
                                    notification.is_read ? 'text-gray-600' : 'text-blue-700'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.timestamp.toLocaleString()}
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
              
              <button 
                onClick={() => setShowQuickActionsModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={() => {
                  localStorage.clear()
                  window.location.href = '/login'
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Logout</span>
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
              { id: 'children', name: 'Children', icon: UserGroupIcon },
              { id: 'requests', name: 'Requests', icon: DocumentTextIcon },
                              { id: 'sessions', name: 'Sessions', icon: CalendarIcon },
                { id: 'my-schedule', name: 'Schedule', icon: CalendarDaysIcon },
                // { id: 'student-progress', name: 'Progress', icon: AcademicCapIcon }, // Commented out for MVP
                // { id: 'session-reports', name: 'Reports', icon: DocumentTextIcon }, // Commented out for MVP
                // { id: 'tutor-proposals', name: 'Proposals', icon: AcademicCapIcon }, // Commented out for MVP
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                  <p className="text-sm text-gray-600">Tutor: {getTutorName(selectedRequest.matched_tutor_id)}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
              <button
                onClick={() => setShowSessionDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {selectedSession.title && (
                  <h4 className="text-lg font-medium text-gray-900">{selectedSession.title}</h4>
                )}
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedSession.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    selectedSession.status === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                    selectedSession.status === 'change_requested' ? 'bg-orange-100 text-orange-800' :
                    selectedSession.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    selectedSession.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedSession.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedSession.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSession.status === 'change_requested' ? 'Change Requested' : 
                     selectedSession.status === 'no_show' ? 'No Show' :
                     selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                  </span>
                  {selectedSession.is_recurring && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Recurring
                    </span>
                  )}
                  {selectedSession.created_by === 'tutor' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      Proposed by Tutor
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedSession.session_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">{selectedSession.start_time} - {selectedSession.end_time}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{formatDuration(selectedSession.duration_hours)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">{selectedSession.amount.toLocaleString()} Leones</p>
                  </div>
                </div>
                
                {selectedSession.location_type && (
                  <div className="text-sm">
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedSession.location_type === 'home' ? 'At Home' : selectedSession.location_type === 'online' ? 'Online' : 'Other'}
                      {selectedSession.location_type === 'online' && selectedSession.meeting_link && (
                        <a href={selectedSession.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-600 hover:underline">
                          Join Meeting
                        </a>
                      )}
                    </p>
                  </div>
                )}
                
                {selectedSession.notes && (
                  <div className="text-sm">
                    <p className="text-gray-500">Notes</p>
                    <p className="text-gray-900">{selectedSession.notes}</p>
                  </div>
                )}
                
                {/* Change Request Message */}
                {selectedSession.status === 'change_requested' && selectedSession.change_request_message && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-800">Your Change Request:</p>
                    <p className="text-sm text-orange-700 mt-1">{selectedSession.change_request_message}</p>
                    <p className="text-xs text-orange-600 mt-2">Waiting for tutor to respond...</p>
                  </div>
                )}
              </div>
              
              {/* Session Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Tutor-proposed sessions (scheduled/rescheduled): Accept / Request Change / Decline */}
                {(selectedSession.status === 'scheduled' || selectedSession.status === 'rescheduled') && selectedSession.created_by === 'tutor' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleSessionAction(selectedSession.id, 'approve')}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Accepting...' : 'Accept Session'}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowSessionDetailsModal(false)
                          openRequestChangeModal(selectedSession)
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Request Change
                      </button>
                      <button
                        onClick={() => {
                          setShowSessionDetailsModal(false)
                          openCancelModal(selectedSession)
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Approved/Confirmed sessions */}
                {(selectedSession.status === 'approved' || selectedSession.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      setShowSessionDetailsModal(false)
                      openCancelModal(selectedSession)
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Session
                  </button>
                )}
                
                <button
                  onClick={() => setShowSessionDetailsModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Request Change Modal */}
      {showRequestChangeModal && sessionForChangeRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Request Change</h3>
              <button
                onClick={() => {
                  setShowRequestChangeModal(false)
                  setSessionForChangeRequest(null)
                  setChangeRequestMessage('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Session Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Session:</strong> {formatDate(sessionForChangeRequest.session_date)} at {sessionForChangeRequest.start_time}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Duration:</strong> {formatDuration(sessionForChangeRequest.duration_hours)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What changes do you need? *
                </label>
                <textarea
                  value={changeRequestMessage}
                  onChange={(e) => setChangeRequestMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="E.g., Can we reschedule to 3pm instead of 2pm? Or move to a different day?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The tutor will be notified and can propose a new time.
                </p>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestChangeModal(false)
                    setSessionForChangeRequest(null)
                    setChangeRequestMessage('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChange}
                  disabled={isSubmitting || !changeRequestMessage.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {showCancelSessionModal && sessionToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Cancel Session</h3>
              <button
                onClick={() => {
                  setShowCancelSessionModal(false)
                  setSessionToCancel(null)
                  setCancelReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  You are about to cancel the session on <strong>{formatDate(sessionToCancel.session_date)}</strong> at <strong>{sessionToCancel.start_time}</strong>.
                </p>
                {sessionToCancel.is_recurring && (
                  <p className="text-sm text-red-700 mt-2">
                    Note: This will only cancel this single session, not the entire series.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="Please provide a reason..."
                />
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelSessionModal(false)
                    setSessionToCancel(null)
                    setCancelReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Keep Session
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={isSubmitting || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Cancelling...' : 'Cancel Session'}
                </button>
              </div>
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
                     disabled={isSubmitting}
                     className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Edit Child
                   </button>
                   <button
                     onClick={() => handleDeleteChild(selectedChildForDetails.id)}
                     disabled={isSubmitting}
                     className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSubmitting ? 'Deleting...' : 'Delete Child'}
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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