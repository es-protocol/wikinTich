'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ClockIcon, ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function TutorUnderConstruction() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center"
        >
          {/* Icon */}
          <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-primary-100 rounded-full flex items-center justify-center mb-6 sm:mb-8">
            <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Still Under Construction
          </h1>

          {/* Tutor Icon */}
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <AcademicCapIcon className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-primary-600">Tutor Application</h2>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            We're still working on the tutor application system. 
            This feature will be available soon!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/home-tutoring')}
              className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-300"
            >
              Request Tutoring Instead
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors duration-300 inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
