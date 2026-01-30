/**
 * Session Validation Service
 *
 * Handles validation for tutoring session operations.
 * Follows clean code principles:
 * - Single Responsibility: Each function validates one aspect
 * - Pure Functions: No side effects, easy to test
 * - Security: Input validation and sanitization
 */

import { sanitizeTextInput } from '@/lib/services/input-sanitization-service'
import {
  SESSION_VALIDATION,
  SESSION_STATUS,
  SESSION_LOCATION_TYPE,
  RECURRENCE_FREQUENCY,
  DAYS_OF_WEEK,
  isValidSessionStatus,
  isValidLocationType,
  isValidRecurrenceFrequency,
  isValidDayOfWeek,
  type SessionStatus,
  type RecurrenceRule,
  type CreateSessionInput,
} from '@/lib/session-types'
import { SESSION_ERROR_MESSAGES } from '@/lib/constants'

// ============================================
// Types
// ============================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface SanitizedSessionInput {
  request_id: string
  student_id: string
  parent_id: string
  session_date: string
  start_time: string
  end_time: string
  title: string | null
  description: string | null
  subjects: string[] | null
  location_type: string
  location_address: string | null
  meeting_link: string | null
  notes: string | null
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
}

// ============================================
// Date/Time Validation
// ============================================

/**
 * Validates that a date string is in ISO format (YYYY-MM-DD)
 */
export function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Validates that a time string is in HH:MM or HH:MM:SS format (e.g. from DB or time inputs)
 */
export function isValidTimeFormat(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') return false
  const trimmed = timeString.trim()
  const hhMm = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  const hhMmSs = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
  return hhMm.test(trimmed) || hhMmSs.test(trimmed)
}

/**
 * Normalizes a time string to HH:MM for storage/API (strips optional seconds)
 */
export function normalizeTimeToHHMM(timeString: string): string {
  if (!timeString || typeof timeString !== 'string') return timeString
  const trimmed = timeString.trim()
  const parts = trimmed.split(':')
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, '0')
    const m = parts[1].padStart(2, '0')
    return `${h}:${m}`
  }
  return trimmed
}

/**
 * Validates that a session date is in the future
 */
export function isDateInFuture(dateString: string): boolean {
  const sessionDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return sessionDate >= today
}

/**
 * Validates that end time is after start time
 */
export function isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  return endTotalMinutes > startTotalMinutes
}

/**
 * Calculates session duration in minutes
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  return endTotalMinutes - startTotalMinutes
}

/**
 * Calculates session duration in hours (for database storage)
 */
export function calculateDurationHours(startTime: string, endTime: string): number {
  const minutes = calculateDurationMinutes(startTime, endTime)
  return Math.round((minutes / 60) * 100) / 100 // Round to 2 decimal places
}

/**
 * Validates session duration is within allowed limits
 */
export function isValidDuration(startTime: string, endTime: string): ValidationResult {
  const errors: string[] = []
  const durationMinutes = calculateDurationMinutes(startTime, endTime)

  if (durationMinutes < SESSION_VALIDATION.MIN_SESSION_DURATION_MINUTES) {
    errors.push(SESSION_ERROR_MESSAGES.SESSION_DURATION_TOO_SHORT)
  }

  if (durationMinutes > SESSION_VALIDATION.MAX_SESSION_DURATION_MINUTES) {
    errors.push(SESSION_ERROR_MESSAGES.SESSION_DURATION_TOO_LONG)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates that the session date is not too far in the future
 */
export function isWithinBookingWindow(dateString: string): boolean {
  const sessionDate = new Date(dateString)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + SESSION_VALIDATION.MAX_ADVANCE_BOOKING_DAYS)

  return sessionDate <= maxDate
}

// ============================================
// UUID Validation
// ============================================

/**
 * Validates UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// ============================================
// URL Validation
// ============================================

/**
 * Validates meeting link URL format
 */
export function isValidMeetingLink(url: string): boolean {
  if (!url || url.length === 0) return true // Optional field

  try {
    const parsedUrl = new URL(url)
    // Only allow https URLs for security
    return parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

// ============================================
// Recurrence Rule Validation
// ============================================

/**
 * Validates a recurrence rule object
 */
export function validateRecurrenceRule(rule: RecurrenceRule): ValidationResult {
  const errors: string[] = []

  // Validate frequency
  if (!isValidRecurrenceFrequency(rule.frequency)) {
    errors.push('Invalid recurrence frequency')
  }

  // Validate interval
  if (!Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 12) {
    errors.push('Recurrence interval must be between 1 and 12')
  }

  // Validate days_of_week for weekly frequency
  if (rule.frequency === RECURRENCE_FREQUENCY.WEEKLY || rule.frequency === RECURRENCE_FREQUENCY.BIWEEKLY) {
    if (rule.days_of_week && rule.days_of_week.length > 0) {
      for (const day of rule.days_of_week) {
        if (!isValidDayOfWeek(day)) {
          errors.push(`Invalid day of week: ${day}`)
        }
      }
    }
  }

  // Validate day_of_month for monthly frequency
  if (rule.frequency === RECURRENCE_FREQUENCY.MONTHLY) {
    if (rule.day_of_month !== undefined) {
      if (!Number.isInteger(rule.day_of_month) || rule.day_of_month < 1 || rule.day_of_month > 31) {
        errors.push('Day of month must be between 1 and 31')
      }
    }
  }

  // Validate end conditions
  if (rule.end_date && !isValidDateFormat(rule.end_date)) {
    errors.push('Invalid end date format')
  }

  if (rule.end_after_occurrences !== undefined) {
    if (!Number.isInteger(rule.end_after_occurrences) ||
        rule.end_after_occurrences < 1 ||
        rule.end_after_occurrences > SESSION_VALIDATION.MAX_RECURRING_INSTANCES) {
      errors.push(`End after occurrences must be between 1 and ${SESSION_VALIDATION.MAX_RECURRING_INSTANCES}`)
    }
  }

  // Must have at least one end condition
  if (!rule.end_date && !rule.end_after_occurrences) {
    errors.push('Recurring sessions must have an end date or occurrence limit')
  }

  return { isValid: errors.length === 0, errors }
}

// ============================================
// Session Status Validation
// ============================================

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: SessionStatus,
  newStatus: SessionStatus,
  actorRole: 'tutor' | 'parent'
): ValidationResult {
  const errors: string[] = []

  // Define allowed transitions
  const allowedTransitions: Record<SessionStatus, { tutor: SessionStatus[]; parent: SessionStatus[] }> = {
    [SESSION_STATUS.SCHEDULED]: {
      tutor: [SESSION_STATUS.RESCHEDULED, SESSION_STATUS.CANCELLED],
      parent: [SESSION_STATUS.APPROVED, SESSION_STATUS.CHANGE_REQUESTED, SESSION_STATUS.CANCELLED],
    },
    [SESSION_STATUS.APPROVED]: {
      tutor: [SESSION_STATUS.CONFIRMED, SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED, SESSION_STATUS.NO_SHOW],
      parent: [SESSION_STATUS.CHANGE_REQUESTED, SESSION_STATUS.CANCELLED],
    },
    [SESSION_STATUS.CHANGE_REQUESTED]: {
      tutor: [SESSION_STATUS.RESCHEDULED, SESSION_STATUS.CANCELLED],
      parent: [SESSION_STATUS.CANCELLED],
    },
    [SESSION_STATUS.RESCHEDULED]: {
      tutor: [SESSION_STATUS.CANCELLED],
      parent: [SESSION_STATUS.APPROVED, SESSION_STATUS.CHANGE_REQUESTED, SESSION_STATUS.CANCELLED],
    },
    [SESSION_STATUS.CONFIRMED]: {
      tutor: [SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED, SESSION_STATUS.NO_SHOW],
      parent: [SESSION_STATUS.CANCELLED],
    },
    [SESSION_STATUS.COMPLETED]: {
      tutor: [],
      parent: [],
    },
    [SESSION_STATUS.CANCELLED]: {
      tutor: [],
      parent: [],
    },
    [SESSION_STATUS.NO_SHOW]: {
      tutor: [],
      parent: [],
    },
  }

  const allowed = allowedTransitions[currentStatus]?.[actorRole] || []

  if (!allowed.includes(newStatus)) {
    errors.push(SESSION_ERROR_MESSAGES.INVALID_SESSION_STATUS)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Checks if a session can be modified (not in a terminal state and not in the past)
 */
export function canModifySession(
  status: SessionStatus,
  sessionDate: string
): ValidationResult {
  const errors: string[] = []

  // Terminal states
  const terminalStates: SessionStatus[] = [
    SESSION_STATUS.COMPLETED,
    SESSION_STATUS.CANCELLED,
    SESSION_STATUS.NO_SHOW,
  ]

  if (terminalStates.includes(status)) {
    if (status === SESSION_STATUS.COMPLETED) {
      errors.push(SESSION_ERROR_MESSAGES.SESSION_ALREADY_COMPLETED)
    } else if (status === SESSION_STATUS.CANCELLED) {
      errors.push(SESSION_ERROR_MESSAGES.SESSION_ALREADY_CANCELLED)
    } else {
      errors.push(SESSION_ERROR_MESSAGES.INVALID_SESSION_STATUS)
    }
  }

  // Check if session is in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sessionDateObj = new Date(sessionDate)

  if (sessionDateObj < today) {
    errors.push(SESSION_ERROR_MESSAGES.CANNOT_MODIFY_PAST_SESSION)
  }

  return { isValid: errors.length === 0, errors }
}

// ============================================
// Full Session Validation
// ============================================

/**
 * Validates all fields of a create session input
 */
export function validateCreateSessionInput(input: CreateSessionInput): ValidationResult {
  const errors: string[] = []

  // Validate required UUIDs
  if (!isValidUUID(input.request_id)) {
    errors.push('Invalid request ID')
  }
  if (!isValidUUID(input.student_id)) {
    errors.push('Invalid student ID')
  }
  if (!isValidUUID(input.parent_id)) {
    errors.push('Invalid parent ID')
  }

  // Validate date
  if (!isValidDateFormat(input.session_date)) {
    errors.push('Invalid session date format (use YYYY-MM-DD)')
  } else if (!isDateInFuture(input.session_date)) {
    errors.push(SESSION_ERROR_MESSAGES.INVALID_SESSION_DATE)
  } else if (!isWithinBookingWindow(input.session_date)) {
    errors.push(`Sessions cannot be scheduled more than ${SESSION_VALIDATION.MAX_ADVANCE_BOOKING_DAYS} days in advance`)
  }

  // Validate times
  if (!isValidTimeFormat(input.start_time)) {
    errors.push('Invalid start time format (use HH:MM)')
  }
  if (!isValidTimeFormat(input.end_time)) {
    errors.push('Invalid end time format (use HH:MM)')
  }

  // Validate time ordering and duration
  if (isValidTimeFormat(input.start_time) && isValidTimeFormat(input.end_time)) {
    if (!isEndTimeAfterStartTime(input.start_time, input.end_time)) {
      errors.push(SESSION_ERROR_MESSAGES.INVALID_SESSION_TIME)
    } else {
      const durationValidation = isValidDuration(input.start_time, input.end_time)
      errors.push(...durationValidation.errors)
    }
  }

  // Validate optional fields
  if (input.title && input.title.length > SESSION_VALIDATION.MAX_TITLE_LENGTH) {
    errors.push(`Title cannot exceed ${SESSION_VALIDATION.MAX_TITLE_LENGTH} characters`)
  }

  if (input.description && input.description.length > SESSION_VALIDATION.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description cannot exceed ${SESSION_VALIDATION.MAX_DESCRIPTION_LENGTH} characters`)
  }

  if (input.notes && input.notes.length > SESSION_VALIDATION.MAX_NOTES_LENGTH) {
    errors.push(`Notes cannot exceed ${SESSION_VALIDATION.MAX_NOTES_LENGTH} characters`)
  }

  if (input.location_type && !isValidLocationType(input.location_type)) {
    errors.push('Invalid location type')
  }

  if (input.meeting_link && !isValidMeetingLink(input.meeting_link)) {
    errors.push('Meeting link must be a valid HTTPS URL')
  }

  if (input.subjects && input.subjects.length > SESSION_VALIDATION.MAX_SUBJECTS_PER_SESSION) {
    errors.push(`Cannot have more than ${SESSION_VALIDATION.MAX_SUBJECTS_PER_SESSION} subjects per session`)
  }

  // Validate recurrence rule if present
  if (input.is_recurring && input.recurrence_rule) {
    const recurrenceValidation = validateRecurrenceRule(input.recurrence_rule)
    errors.push(...recurrenceValidation.errors)
  } else if (input.is_recurring && !input.recurrence_rule) {
    errors.push(SESSION_ERROR_MESSAGES.INVALID_RECURRENCE_RULE)
  }

  return { isValid: errors.length === 0, errors }
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitizes create session input for safe database storage
 */
export function sanitizeSessionInput(input: CreateSessionInput): SanitizedSessionInput {
  return {
    request_id: input.request_id.trim(),
    student_id: input.student_id.trim(),
    parent_id: input.parent_id.trim(),
    session_date: input.session_date.trim(),
    start_time: input.start_time.trim(),
    end_time: input.end_time.trim(),
    title: input.title ? sanitizeTextInput(input.title).substring(0, SESSION_VALIDATION.MAX_TITLE_LENGTH) : null,
    description: input.description ? sanitizeTextInput(input.description).substring(0, SESSION_VALIDATION.MAX_DESCRIPTION_LENGTH) : null,
    subjects: input.subjects ? input.subjects.map(s => sanitizeTextInput(s)).slice(0, SESSION_VALIDATION.MAX_SUBJECTS_PER_SESSION) : null,
    location_type: input.location_type || SESSION_LOCATION_TYPE.HOME,
    location_address: input.location_address ? sanitizeTextInput(input.location_address).substring(0, SESSION_VALIDATION.MAX_ADDRESS_LENGTH) : null,
    meeting_link: input.meeting_link ? input.meeting_link.trim().substring(0, SESSION_VALIDATION.MAX_MEETING_LINK_LENGTH) : null,
    notes: input.notes ? sanitizeTextInput(input.notes).substring(0, SESSION_VALIDATION.MAX_NOTES_LENGTH) : null,
    is_recurring: input.is_recurring || false,
    recurrence_rule: input.recurrence_rule || null,
  }
}
