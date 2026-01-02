'use client'

import { AVAILABLE_SUBJECTS } from '@/lib/constants'

interface SubjectSelectionProps {
  selectedSubjects: string[]
  onSubjectsChange: (subjects: string[]) => void
  label?: string
  required?: boolean
  error?: string
  touched?: boolean
}

/**
 * Reusable Subject Selection Component
 * 
 * Displays a grid of checkboxes for selecting subjects.
 * Used in both tutor application and parent home tutoring request forms.
 * 
 * @param selectedSubjects - Array of selected subject strings
 * @param onSubjectsChange - Callback function that receives the updated array of subjects
 * @param label - Custom label text (default: "Subjects")
 * @param required - Whether the field is required
 * @param error - Error message to display
 * @param touched - Whether the field has been touched/interacted with
 */
export default function SubjectSelection({
  selectedSubjects,
  onSubjectsChange,
  label = 'Subjects',
  required = false,
  error,
  touched
}: SubjectSelectionProps) {
  const handleSubjectToggle = (subject: string) => {
    const newSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject]
    onSubjectsChange(newSubjects)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">
        {label} {required && '*'}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {AVAILABLE_SUBJECTS.map((subject) => (
          <label key={subject} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedSubjects.includes(subject)}
              onChange={() => handleSubjectToggle(subject)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">{subject}</span>
          </label>
        ))}
      </div>
      {touched && error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}

