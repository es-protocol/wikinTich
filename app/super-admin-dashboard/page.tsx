'use client'

import { supabase } from '@/lib/supabase'
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

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
  pendingTutors: number
  pendingRequests: number
  totalRevenue: number
  averageRating: number
}

interface Tutor {
  id: string
  profile_id: string
  bio: string
  subjects: string[]
  availability?: Record<string, { available?: boolean; hours?: string }> | null
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

interface AdminNotification {
  id: string
  admin_id: string
  title: string
  message: string
  notification_type: 'new_request' | 'tutor_assigned' | 'request_updated' | 'request_cancelled' | 'system' | 'whatsapp_request'
  related_entity_type: 'home_tutoring_request' | 'pending_registration' | 'tutor' | 'parent' | 'system' | null
  related_entity_id: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

interface PendingRegistration {
  id: string
  parent_name: string
  parent_email: string
  student_name: string
  grade_level: string
  subjects: string
  created_at: string
  expires_at: string
}

function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
  onClose,
}: {
  notification: AdminNotification
  onMarkAsRead: (id: string) => void
  onNavigate: (notification: AdminNotification) => void
  onClose: () => void
}) {
  const timeAgo = getTimeAgo(notification.created_at)

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
    onNavigate(notification)
    onClose()
  }

  return (
    <li
      onClick={handleClick}
      className={`
        px-4 py-3 cursor-pointer transition-colors
        ${!notification.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
      `}
    >
      <div className="flex items-start gap-3">
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">{timeAgo}</p>
        </div>

        {notification.priority === 'critical' && (
          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            Urgent
          </span>
        )}
      </div>
    </li>
  )
}

function NotificationsDropdown({
  isOpen,
  notifications,
  isLoading,
  unreadCount,
  onClose,
  onMarkAsRead,
  onNavigate,
}: {
  isOpen: boolean
  notifications: AdminNotification[]
  isLoading: boolean
  unreadCount: number
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onNavigate: (notification: AdminNotification) => void
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notifications-dropdown-container')) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-[500px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-500">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">You'll see new requests here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onNavigate={onNavigate}
                onClose={onClose}
              />
            ))}
          </ul>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 text-center flex-shrink-0">
          <button
            onClick={() => {
              onClose()
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Notifications →
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationBadge({
  count,
  isLoading,
  onClick,
}: {
  count: number
  isLoading: boolean
  onClick: () => void
}) {
  if (isLoading) {
    return (
      <div className="relative flex items-center">
        <button
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Loading notifications"
          disabled
        >
          <BellIcon className="w-6 h-6" />
          <div className="absolute top-1 right-1 h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex items-center">
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={`${count} unread notification${count !== 1 ? 's' : ''}`}
        onClick={onClick}
      >
        <BellIcon className={`w-6 h-6 ${count > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
        {count > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [userProfile, setUserProfile] = useState<SuperAdminProfile | null>(null)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(false)

  // Data states
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [requests, setRequests] = useState<HomeTutoringRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingTutors, setIsLoadingTutors] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const [isLoadingPendingRegistrations, setIsLoadingPendingRegistrations] = useState(false)

  // Matching states
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<HomeTutoringRequest | null>(null)
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([])
  const [selectedTutorId, setSelectedTutorId] = useState('')
  const [isMatching, setIsMatching] = useState(false)
  const [tutorSearchTerm, setTutorSearchTerm] = useState('')
  const [tutorSubjectFilter, setTutorSubjectFilter] = useState('all')
  const [tutorAvailabilityFilter, setTutorAvailabilityFilter] = useState('all')
  const [confirmMatch, setConfirmMatch] = useState(false)
  
  // Filter states
  const [tutorFilter, setTutorFilter] = useState('all') // all, verified, pending
  const [requestFilter, setRequestFilter] = useState('all') // all, pending, matched
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
      fetchPendingRegistrations()
    }
  }, [userProfile])

  useEffect(() => {
    if (userProfile) {
      fetchTutors()
    }
  }, [tutorFilter, searchTerm])

  useEffect(() => {
    if (userProfile) {
      fetchRequests()
    }
  }, [requestFilter, userProfile])

  useEffect(() => {
    if (!userProfile) {
      return
    }

    fetchUnreadCount()

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [userProfile])

  const checkSuperAdminStatus = async () => {
    try {
      // Verify session via secure API endpoint
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        // Session invalid or expired - redirect to login
        window.location.href = '/super-admin-login'
        return
      }

      const sessionData = await response.json()
      const user = sessionData.user

      // Verify user has super_admin role
      if (!user || user.role !== 'super_admin') {
        setError('Access denied. Super admin privileges required.')
        return
      }

      // Set user profile from session data
      const superAdminProfile = {
        id: user.id,
        full_name: user.full_name || 'Super Admin',
        email: user.email,
        role: 'super_admin'
      }
      setUserProfile(superAdminProfile)
    } catch (error) {
      console.error('Error checking super admin status:', error)
      setError('Failed to verify super admin status')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!userProfile) {
      return
    }

    try {
      setIsLoadingNotifications(true)

      const response = await fetch('/api/admin/notifications?unread_only=true&limit=1', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch notifications')
          return
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }

      const data = await response.json()
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const fetchNotifications = async () => {
    if (!userProfile) {
      return
    }

    try {
      setIsFetchingNotifications(true)

      const response = await fetch('/api/admin/notifications?limit=10', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch notifications')
          return
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data.notifications || [])

      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setIsFetchingNotifications(false)
    }
  }

  const handleBadgeClick = () => {
    if (!isDropdownOpen) {
      fetchNotifications()
    }
    setIsDropdownOpen((prev) => !prev)
  }

  const handleNotificationNavigate = (notification: AdminNotification) => {
    switch (notification.notification_type) {
      case 'new_request':
      case 'tutor_assigned':
      case 'request_updated':
      case 'request_cancelled':
        // All request-related notifications navigate to the Requests tab
        setActiveSection('requests')
        break
      case 'whatsapp_request':
        setActiveSection('pending-registrations')
        break
      default:
        setActiveSection('overview')
        break
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!userProfile) {
      return
    }

    const notification = notifications.find((item) => item.id === notificationId)
    if (notification?.is_read) {
      return
    }

    const optimisticReadAt = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, is_read: true, read_at: optimisticReadAt }
          : item
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to mark notification as read')
          await Promise.all([fetchNotifications(), fetchUnreadCount()])
          return
        }
        throw new Error(`Failed to mark as read: ${response.status}`)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
    }
  }

  const fetchSystemStats = async () => {
    try {
      // Use server-side API to fetch stats (bypasses RLS restrictions)
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch admin stats')
          return
        }
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }

      const stats = await response.json()

      setSystemStats({
        totalTutors: stats.totalTutors || 0,
        totalStudents: stats.totalStudents || 0,
        totalRequests: stats.totalRequests || 0,
        pendingTutors: stats.pendingTutors || 0,
        pendingRequests: stats.pendingRequests || 0,
        totalRevenue: stats.totalRevenue || 0,
        averageRating: stats.averageRating || 0,
      })
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const fetchTutors = async () => {
    try {
      setIsLoadingTutors(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (tutorFilter !== 'all') {
        params.set('filter', tutorFilter)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const url = `/api/admin/tutors${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch tutors')
          return
        }
        throw new Error(`Failed to fetch tutors: ${response.status}`)
      }

      const data = await response.json()
      setTutors(data.tutors || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setIsLoadingTutors(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setIsLoadingRequests(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (requestFilter !== 'all') {
        params.set('status', requestFilter)
      }

      const url = `/api/admin/requests${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch requests')
          return
        }
        throw new Error(`Failed to fetch requests: ${response.status}`)
      }

      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true)
      
      const response = await fetch('/api/admin/students', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Not authorized to fetch students')
          return
        }
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const fetchPendingRegistrations = async () => {
    try {
      setIsLoadingPendingRegistrations(true)

      const response = await fetch('/api/admin/pending-registrations', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Error fetching pending registrations:', response.status)
        return
      }

      const data = await response.json()
      setPendingRegistrations(data.pending_registrations || [])
    } catch (error) {
      console.error('Error fetching pending registrations:', error)
    } finally {
      setIsLoadingPendingRegistrations(false)
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
      await fetchSystemStats()

      alert(`Institution request ${status} successfully!`)
    } catch (error) {
      console.error('Error updating institution request status:', error)
      alert(`Failed to update institution request status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  const openMatchModal = async (request: HomeTutoringRequest) => {
    setSelectedRequest(request)
    setSelectedTutorId('')
    setTutorSearchTerm('')
    setTutorSubjectFilter('all')
    setTutorAvailabilityFilter('all')
    setConfirmMatch(false)
    
    try {
      // Fetch available tutors (verified tutors) via API
      const response = await fetch('/api/admin/tutors/available', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Error fetching available tutors:', response.status)
        alert('Failed to load available tutors. Please try again.')
        return
      }

      const data = await response.json()
      setAvailableTutors(data.tutors || [])
      setShowMatchModal(true)
    } catch (error) {
      console.error('Error fetching available tutors:', error)
      alert('Failed to load available tutors. Please try again.')
    }
  }

  const matchTutorToRequest = async () => {
    if (!selectedRequest || !selectedTutorId) {
      alert('Please select a tutor to match')
      return
    }

    try {
      setIsMatching(true)

      // Use API to perform the match
      const response = await fetch('/api/admin/match', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          tutorId: selectedTutorId,
          studentName: selectedRequest.student_name,
          subjects: selectedRequest.subjects,
          parentId: selectedRequest.parent_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error matching tutor:', errorData)
        alert(errorData.error || 'Failed to match tutor to request')
        return
      }

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

  const requestSubjects = useMemo(() => {
    if (!selectedRequest?.subjects) {
      return []
    }
    return selectedRequest.subjects
      .split(',')
      .map((subject) => subject.trim())
      .filter((subject) => subject.length > 0)
  }, [selectedRequest])

  const filteredTutors = useMemo(() => {
    const searchLower = tutorSearchTerm.trim().toLowerCase()

    return availableTutors.filter((tutor) => {
      const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : []
      const subjectMatch =
        tutorSubjectFilter === 'all' ||
        subjects.some((subject) => subject.toLowerCase() === tutorSubjectFilter.toLowerCase())

      const availabilityMatch =
        tutorAvailabilityFilter === 'all' ||
        Boolean(tutor.availability && Object.values(tutor.availability).some((slot) => slot?.available))

      const nameMatch =
        searchLower.length === 0 ||
        tutor.profiles.full_name.toLowerCase().includes(searchLower) ||
        tutor.profiles.email.toLowerCase().includes(searchLower)

      return subjectMatch && availabilityMatch && nameMatch
    })
  }, [
    availableTutors,
    tutorSearchTerm,
    tutorSubjectFilter,
    tutorAvailabilityFilter,
  ])

  const selectedTutor = useMemo(() => {
    return availableTutors.find((tutor) => tutor.id === selectedTutorId) || null
  }, [availableTutors, selectedTutorId])


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

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear login state
      localStorage.removeItem('superAdminLoggedIn')
      localStorage.removeItem('superAdminEmail')
      
      // Redirect to login page
      window.location.href = '/super-admin-login'
    }
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
                  onClick={() =>
                    setActiveSection(
                      pendingRegistrations.length > 0 ? 'pending-registrations' : 'requests'
                    )
                  }
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

      case 'pending-registrations':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Pending Registrations</h2>
              <button
                onClick={fetchPendingRegistrations}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isLoadingPendingRegistrations ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading pending registrations...</p>
                </div>
              ) : pendingRegistrations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No pending registrations right now.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingRegistrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {registration.parent_name || 'Parent'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {registration.parent_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {registration.student_name || 'Student'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Grade {registration.grade_level || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {registration.subjects || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Awaiting Verification
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(registration.created_at)}
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
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CogIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="notifications-dropdown-container relative">
                <NotificationBadge
                  count={unreadCount}
                  isLoading={isLoadingNotifications}
                  onClick={handleBadgeClick}
                />
                <NotificationsDropdown
                  isOpen={isDropdownOpen}
                  notifications={notifications}
                  isLoading={isFetchingNotifications}
                  unreadCount={unreadCount}
                  onClose={() => setIsDropdownOpen(false)}
                  onMarkAsRead={markAsRead}
                  onNavigate={handleNotificationNavigate}
                />
              </div>
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

      {/* Navigation Tabs - positioned below fixed header */}
      <div className="pt-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'tutors', name: 'Tutors', icon: AcademicCapIcon },
              { id: 'requests', name: 'Requests', icon: ClockIcon },
              { id: 'pending-registrations', name: 'Pending Registrations', icon: ExclamationTriangleIcon },
              { id: 'students', name: 'Students', icon: UserGroupIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Student:</strong> {selectedRequest.student_name}</p>
                  <p><strong>Subjects:</strong> {selectedRequest.subjects}</p>
                  <p><strong>Grade Level:</strong> {selectedRequest.grade_level}</p>
                  <p><strong>Schedule:</strong> {selectedRequest.preferred_schedule}</p>
                  <p><strong>Location:</strong> {selectedRequest.location}</p>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Parent:</strong> {selectedRequest.profiles.full_name}</p>
                  <p>{selectedRequest.profiles.email}</p>
                  <p>{selectedRequest.profiles.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Available Tutors</h4>
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <input
                    type="text"
                    value={tutorSearchTerm}
                    onChange={(event) => setTutorSearchTerm(event.target.value)}
                    placeholder="Search by name or email"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={tutorSubjectFilter}
                      onChange={(event) => setTutorSubjectFilter(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="all">All subjects</option>
                      {requestSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    <select
                      value={tutorAvailabilityFilter}
                      onChange={(event) => setTutorAvailabilityFilter(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="all">Any availability</option>
                      <option value="available">Has availability</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Showing verified tutors only.</p>
                </div>

                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                  {filteredTutors.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-6">
                      No tutors match the current filters.
                    </div>
                  ) : (
                    filteredTutors.map((tutor) => {
                      const subjects = Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : tutor.subjects
                      const isSelected = tutor.id === selectedTutorId
                      return (
                        <button
                          key={tutor.id}
                          type="button"
                          onClick={() => setSelectedTutorId(tutor.id)}
                          className={`w-full text-left border rounded-lg p-3 transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{tutor.profiles.full_name}</p>
                              <p className="text-xs text-gray-500">{tutor.profiles.email}</p>
                              <p className="text-xs text-gray-600 mt-1">{subjects}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {tutor.availability ? 'Availability set' : 'No availability'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Selected tutor:</strong>{' '}
                {selectedTutor ? selectedTutor.profiles.full_name : 'None selected'}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={confirmMatch}
                  onChange={(event) => setConfirmMatch(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                I confirm this tutor match is correct.
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowMatchModal(false)}
                 className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
               >
                 Cancel
               </button>
               <button
                 onClick={matchTutorToRequest}
                disabled={!selectedTutorId || !confirmMatch || isMatching}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isMatching ? 'Matching...' : 'Match Tutor'}
               </button>
             </div>
           </div>
         </div>
       )}

     </div>
   )
 } 