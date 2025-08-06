'use client'

import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function HomeTutoringSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Request Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for submitting your home tutoring request! Please verify your email address to access your dashboard and track your request.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What happens next?
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <p className="text-gray-700">We'll review your tutoring requirements and find suitable tutors</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <p className="text-gray-700">Qualified tutors will be notified of your request</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <p className="text-gray-700">You'll receive notifications when tutors are available</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  4
                </div>
                <p className="text-gray-700">Schedule sessions and start learning!</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/verify-email"
              className="block w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
            >
              Verify Email & Access Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Return to Home
            </Link>
            <p className="text-sm text-gray-500">
              Email verification is required to access your dashboard and track your request.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 