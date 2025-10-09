/**
 * Main Navigation Component
 * 
 * Reusable navigation bar used across public pages
 * 
 * Clean Code Principles:
 * - DRY: Single source of truth for navigation
 * - Maintainability: Update once, applies everywhere
 * - Consistency: Same styling across all pages
 */

import Link from 'next/link'

export default function MainNavigation() {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors duration-200">
              Tutor Link
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base">
              Login
            </Link>
            <Link href="/apply-tutor/under-construction" className="text-secondary-600 hover:text-secondary-700 font-medium text-sm sm:text-base">
              Apply to be a Tutor
            </Link>
            <Link href="/register" className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 font-medium text-sm sm:text-base">
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

