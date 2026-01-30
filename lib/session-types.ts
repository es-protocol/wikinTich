/**
 * Session Scheduling Types
 *
 * Type definitions for the tutoring session scheduling system.
 * Maps to the home_tutoring_sessions database table.
 *
 * Clean Code Principles:
 * - Single Responsibility: Each type represents one concept
 * - Type Safety: Strict typing with const assertions
 * - No Magic Strings: All values defined as constants
 * - Documentation: JSDoc comments for all exports
 */

// ============================================
// Status & Enum Constants
// ============================================

/**
 * Session status values matching database constraint.
 * Represents the lifecycle of a tutoring session.
 */
export const SESSION_STATUS = {
  /** Initial state when session is proposed */
  SCHEDULED: 'scheduled',
  /** Other party has approved the session */
  APPROVED: 'approved',
  /** One party has requested changes to the session */
  CHANGE_REQUESTED: 'change_requested',
  /** Session was rescheduled after a change request */
  RESCHEDULED: 'rescheduled',
  /** Both parties have confirmed the session */
  CONFIRMED: 'confirmed',
  /** Session has been completed */
  COMPLETED: 'completed',
  /** Session was cancelled */
  CANCELLED: 'cancelled',
  /** One party did not attend */
  NO_SHOW: 'no_show',
} as const

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS]

/**
 * Party who created/proposed the session
 */
export const SESSION_CREATOR = {
  TUTOR: 'tutor',
  PARENT: 'parent',
} as const

export type SessionCreator = typeof SESSION_CREATOR[keyof typeof SESSION_CREATOR]

/**
 * Location type for the tutoring session
 */
export const SESSION_LOCATION_TYPE = {
  /** In-person at student's home */
  HOME: 'home',
  /** Virtual session via video call */
  ONLINE: 'online',
  /** Other location (library, cafe, etc.) */
  OTHER: 'other',
} as const

export type SessionLocationType = typeof SESSION_LOCATION_TYPE[keyof typeof SESSION_LOCATION_TYPE]

/**
 * Recurrence frequency for recurring sessions
 */
export const RECURRENCE_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const

export type RecurrenceFrequency = typeof RECURRENCE_FREQUENCY[keyof typeof RECURRENCE_FREQUENCY]

/**
 * Days of the week for scheduling
 */
export const DAYS_OF_WEEK = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
} as const

export type DayOfWeek = typeof DAYS_OF_WEEK[keyof typeof DAYS_OF_WEEK]

/**
 * Array of all days for iteration
 */
export const DAYS_OF_WEEK_ARRAY: DayOfWeek[] = [
  DAYS_OF_WEEK.MONDAY,
  DAYS_OF_WEEK.TUESDAY,
  DAYS_OF_WEEK.WEDNESDAY,
  DAYS_OF_WEEK.THURSDAY,
  DAYS_OF_WEEK.FRIDAY,
  DAYS_OF_WEEK.SATURDAY,
  DAYS_OF_WEEK.SUNDAY,
]

// ============================================
// Interface Definitions
// ============================================

/**
 * Recurrence rule structure stored in JSONB column.
 * Defines the pattern for recurring sessions.
 */
export interface RecurrenceRule {
  /** How often the session repeats */
  frequency: RecurrenceFrequency
  /** Interval between occurrences (e.g., every 2 weeks) */
  interval: number
  /** For weekly frequency: which days of the week */
  days_of_week?: DayOfWeek[]
  /** For monthly frequency: which day of the month (1-31) */
  day_of_month?: number
  /** End date for the recurrence (ISO date string) */
  end_date?: string
  /** Alternative: end after N occurrences */
  end_after_occurrences?: number
}

/**
 * Main tutoring session interface.
 * Maps directly to the home_tutoring_sessions table.
 */
export interface TutoringSession {
  // Primary identifiers
  id: string
  request_id: string
  tutor_id: string
  student_id: string | null
  parent_id: string | null

  // Session details
  title: string | null
  description: string | null
  subjects: string[] | null
  session_date: string // ISO date (YYYY-MM-DD)
  start_time: string // Time string (HH:MM:SS)
  end_time: string // Time string (HH:MM:SS)
  duration_hours: number
  amount: number

  // Status tracking
  status: SessionStatus
  created_by: SessionCreator | null
  tutor_attendance_status: string | null

  // Notes
  notes: string | null
  tutor_notes: string | null

  // Change request tracking
  change_request_message: string | null
  change_requested_at: string | null
  change_requested_by: SessionCreator | null

  // Recurring session fields
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
  recurring_parent_id: string | null

  // Location details
  location_type: SessionLocationType
  location_address: string | null
  meeting_link: string | null

  // Timestamps
  created_at: string
  updated_at: string
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancelled_by: SessionCreator | null
  cancellation_reason: string | null
}

/**
 * Session with joined relationship data for display purposes.
 * Extends TutoringSession with denormalized fields from related tables.
 */
export interface TutoringSessionWithDetails extends TutoringSession {
  // Student information (joined from students table)
  student_name?: string
  student_grade?: string

  // Tutor information (joined from tutors/profiles tables)
  tutor_name?: string
  tutor_email?: string
  tutor_phone?: string

  // Parent information (joined from profiles table)
  parent_name?: string
  parent_email?: string
  parent_phone?: string

  // Request information (joined from home_tutoring_requests)
  request_subjects?: string[]
}

/**
 * Form data for creating a new session.
 * Required fields are enforced at compile time.
 */
export interface CreateSessionInput {
  /** ID of the tutoring request this session is for */
  request_id: string
  /** ID of the student */
  student_id: string
  /** ID of the parent (for notifications and access control) */
  parent_id: string
  /** Date of the session (YYYY-MM-DD) */
  session_date: string
  /** Start time (HH:MM) */
  start_time: string
  /** End time (HH:MM) */
  end_time: string
  /** Optional session title */
  title?: string
  /** Optional session description */
  description?: string
  /** Subjects to cover in this session */
  subjects?: string[]
  /** Location type */
  location_type?: SessionLocationType
  /** Physical address for home/other sessions */
  location_address?: string
  /** Meeting URL for online sessions */
  meeting_link?: string
  /** General notes visible to both parties */
  notes?: string
  /** Whether this is a recurring session */
  is_recurring?: boolean
  /** Recurrence pattern if recurring */
  recurrence_rule?: RecurrenceRule
}

/**
 * Form data for requesting changes to a session.
 */
export interface ChangeRequestInput {
  /** ID of the session to request changes for */
  session_id: string
  /** Message explaining the requested changes */
  message: string
  /** Optional: suggested alternative dates */
  preferred_dates?: string[]
  /** Optional: suggested alternative times */
  preferred_times?: string[]
}

/**
 * Form data for rescheduling a session.
 */
export interface RescheduleSessionInput {
  /** ID of the session to reschedule */
  session_id: string
  /** New date (YYYY-MM-DD) */
  new_date: string
  /** New start time (HH:MM) */
  new_start_time: string
  /** New end time (HH:MM) */
  new_end_time: string
  /** Optional message explaining the reschedule */
  message?: string
}

/**
 * Form data for cancelling a session.
 */
export interface CancelSessionInput {
  /** ID of the session to cancel */
  session_id: string
  /** Reason for cancellation */
  reason: string
  /** Whether to cancel all future recurring instances */
  cancel_recurring_series?: boolean
}

/**
 * API response for session list endpoints.
 */
export interface SessionListResponse {
  /** Array of sessions with joined details */
  sessions: TutoringSessionWithDetails[]
  /** Total count of sessions matching filters */
  total_count: number
  /** Whether there are more sessions to load */
  has_more: boolean
}

/**
 * API response for single session operations.
 */
export interface SessionOperationResponse {
  /** Whether the operation succeeded */
  success: boolean
  /** The session data (on success) */
  session?: TutoringSession
  /** Error message (on failure) */
  error?: string
  /** Additional message for the user */
  message?: string
}

/**
 * Filter options for fetching sessions.
 */
export interface SessionFilterOptions {
  /** Filter by status */
  status?: SessionStatus | SessionStatus[]
  /** Filter by student ID */
  student_id?: string
  /** Filter by date range start */
  from_date?: string
  /** Filter by date range end */
  to_date?: string
  /** Include only recurring sessions */
  recurring_only?: boolean
  /** Pagination: number of items per page */
  limit?: number
  /** Pagination: offset for pagination */
  offset?: number
  /** Sort order for results */
  sort_order?: 'asc' | 'desc'
}

// ============================================
// Validation Constants
// ============================================

/**
 * Session validation rules for input sanitization and validation.
 */
export const SESSION_VALIDATION = {
  /** Maximum title length */
  MAX_TITLE_LENGTH: 255,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum notes length */
  MAX_NOTES_LENGTH: 1000,
  /** Maximum cancellation reason length */
  MAX_CANCELLATION_REASON_LENGTH: 500,
  /** Maximum change request message length */
  MAX_CHANGE_REQUEST_MESSAGE_LENGTH: 1000,
  /** Minimum session duration in minutes */
  MIN_SESSION_DURATION_MINUTES: 30,
  /** Maximum session duration in minutes (8 hours) */
  MAX_SESSION_DURATION_MINUTES: 480,
  /** Maximum recurring session instances to generate */
  MAX_RECURRING_INSTANCES: 52,
  /** Maximum days in advance a session can be scheduled */
  MAX_ADVANCE_BOOKING_DAYS: 90,
  /** Maximum subjects per session */
  MAX_SUBJECTS_PER_SESSION: 5,
  /** Maximum URL length for meeting links */
  MAX_MEETING_LINK_LENGTH: 500,
  /** Maximum address length */
  MAX_ADDRESS_LENGTH: 500,
} as const

/**
 * Default values for new sessions.
 */
export const SESSION_DEFAULTS = {
  /** Default session amount in Leones */
  DEFAULT_AMOUNT: 70000,
  /** Default location type */
  DEFAULT_LOCATION_TYPE: SESSION_LOCATION_TYPE.HOME,
  /** Default session status for new sessions */
  DEFAULT_STATUS: SESSION_STATUS.SCHEDULED,
  /** Default recurrence interval */
  DEFAULT_RECURRENCE_INTERVAL: 1,
  /** Default pagination limit */
  DEFAULT_PAGE_LIMIT: 20,
  /** Maximum pagination limit */
  MAX_PAGE_LIMIT: 100,
} as const

// ============================================
// UI Display Helpers
// ============================================

/**
 * Human-readable labels for session statuses.
 */
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  [SESSION_STATUS.SCHEDULED]: 'Scheduled',
  [SESSION_STATUS.APPROVED]: 'Approved',
  [SESSION_STATUS.CHANGE_REQUESTED]: 'Change Requested',
  [SESSION_STATUS.RESCHEDULED]: 'Rescheduled',
  [SESSION_STATUS.CONFIRMED]: 'Confirmed',
  [SESSION_STATUS.COMPLETED]: 'Completed',
  [SESSION_STATUS.CANCELLED]: 'Cancelled',
  [SESSION_STATUS.NO_SHOW]: 'No Show',
}

/**
 * CSS color classes for session status badges.
 * Uses Tailwind CSS classes consistent with existing codebase.
 */
export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  [SESSION_STATUS.SCHEDULED]: 'bg-yellow-100 text-yellow-800',
  [SESSION_STATUS.APPROVED]: 'bg-blue-100 text-blue-800',
  [SESSION_STATUS.CHANGE_REQUESTED]: 'bg-orange-100 text-orange-800',
  [SESSION_STATUS.RESCHEDULED]: 'bg-purple-100 text-purple-800',
  [SESSION_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [SESSION_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [SESSION_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [SESSION_STATUS.NO_SHOW]: 'bg-gray-100 text-gray-800',
}

/**
 * Human-readable labels for location types.
 */
export const LOCATION_TYPE_LABELS: Record<SessionLocationType, string> = {
  [SESSION_LOCATION_TYPE.HOME]: 'At Home',
  [SESSION_LOCATION_TYPE.ONLINE]: 'Online',
  [SESSION_LOCATION_TYPE.OTHER]: 'Other Location',
}

/**
 * Human-readable labels for days of the week.
 */
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DAYS_OF_WEEK.MONDAY]: 'Monday',
  [DAYS_OF_WEEK.TUESDAY]: 'Tuesday',
  [DAYS_OF_WEEK.WEDNESDAY]: 'Wednesday',
  [DAYS_OF_WEEK.THURSDAY]: 'Thursday',
  [DAYS_OF_WEEK.FRIDAY]: 'Friday',
  [DAYS_OF_WEEK.SATURDAY]: 'Saturday',
  [DAYS_OF_WEEK.SUNDAY]: 'Sunday',
}

/**
 * Short labels for days of the week (for compact UI).
 */
export const DAY_OF_WEEK_SHORT_LABELS: Record<DayOfWeek, string> = {
  [DAYS_OF_WEEK.MONDAY]: 'Mon',
  [DAYS_OF_WEEK.TUESDAY]: 'Tue',
  [DAYS_OF_WEEK.WEDNESDAY]: 'Wed',
  [DAYS_OF_WEEK.THURSDAY]: 'Thu',
  [DAYS_OF_WEEK.FRIDAY]: 'Fri',
  [DAYS_OF_WEEK.SATURDAY]: 'Sat',
  [DAYS_OF_WEEK.SUNDAY]: 'Sun',
}

/**
 * Human-readable labels for recurrence frequencies.
 */
export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  [RECURRENCE_FREQUENCY.DAILY]: 'Daily',
  [RECURRENCE_FREQUENCY.WEEKLY]: 'Weekly',
  [RECURRENCE_FREQUENCY.BIWEEKLY]: 'Every 2 Weeks',
  [RECURRENCE_FREQUENCY.MONTHLY]: 'Monthly',
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if a string is a valid SessionStatus.
 * @param value - The value to check
 * @returns True if the value is a valid SessionStatus
 */
export function isValidSessionStatus(value: string): value is SessionStatus {
  return Object.values(SESSION_STATUS).includes(value as SessionStatus)
}

/**
 * Type guard to check if a string is a valid SessionCreator.
 * @param value - The value to check
 * @returns True if the value is a valid SessionCreator
 */
export function isValidSessionCreator(value: string): value is SessionCreator {
  return Object.values(SESSION_CREATOR).includes(value as SessionCreator)
}

/**
 * Type guard to check if a string is a valid SessionLocationType.
 * @param value - The value to check
 * @returns True if the value is a valid SessionLocationType
 */
export function isValidLocationType(value: string): value is SessionLocationType {
  return Object.values(SESSION_LOCATION_TYPE).includes(value as SessionLocationType)
}

/**
 * Type guard to check if a string is a valid RecurrenceFrequency.
 * @param value - The value to check
 * @returns True if the value is a valid RecurrenceFrequency
 */
export function isValidRecurrenceFrequency(value: string): value is RecurrenceFrequency {
  return Object.values(RECURRENCE_FREQUENCY).includes(value as RecurrenceFrequency)
}

/**
 * Type guard to check if a string is a valid DayOfWeek.
 * @param value - The value to check
 * @returns True if the value is a valid DayOfWeek
 */
export function isValidDayOfWeek(value: string): value is DayOfWeek {
  return Object.values(DAYS_OF_WEEK).includes(value as DayOfWeek)
}
