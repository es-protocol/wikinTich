'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function WhatsAppRequestComingSoon() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center"
        >
          {/* Icon */}
          <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 sm:mb-8">
            <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Coming Soon!
          </h1>

          {/* WhatsApp Icon */}
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <h2 className="text-2xl font-bold text-green-600">WhatsApp Request</h2>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            We're working on making it even easier for you to request tutors directly via WhatsApp. 
            This feature will be available soon!
          </p>

          {/* Features Coming */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Expect:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span>Instant tutor requests via WhatsApp</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span>Real-time responses from our team</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span>Easy communication in your preferred language</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span>Quick tutor matching and scheduling</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/home-tutoring')}
              className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary-700 transition-colors duration-300"
            >
              Request via Website Instead
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-colors duration-300 inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          {/* Timeline */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Expected Launch: <span className="font-semibold text-gray-700">Q1 2026</span>
            </p>
          </div>
        </motion.div>

        {/* Alternative Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 text-sm">
            Need immediate assistance? Email us at{' '}
            <a href="mailto:support@tutorlink.com" className="text-green-600 hover:text-green-700 font-medium">
              support@tutorlink.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

