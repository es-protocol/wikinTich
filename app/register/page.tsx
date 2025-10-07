'use client'

import { motion } from 'framer-motion'
import { HomeIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-primary-600 hover:text-primary-700">
                <span className="text-2xl font-bold">Tutor Link</span>
                <span className="ml-2 text-sm text-gray-500">Sierra Leone</span>
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login
              </Link>
              <Link href="/apply-tutor" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Apply to be a Tutor
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Choose Your
            <span className="text-primary-600"> Registration Type</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Select the option that best describes your role. We'll guide you through the registration process.
          </motion.p>
        </div>

        {/* Two Registration Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Parent/Student Option */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/home-tutoring" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full border-2 border-transparent group-hover:border-secondary-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary-200 transition-colors duration-300">
                    <HomeIcon className="w-12 h-12 text-secondary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Parent/Student</h2>
                  <p className="text-gray-600 mb-6">
                    Register to request home tutoring services for your child. Get personalized academic support.
                  </p>
                  <div className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-secondary-700 transition-colors duration-300">
                    Register as Parent
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Tutor Option */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/apply-tutor" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full border-2 border-transparent group-hover:border-primary-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-300">
                    <AcademicCapIcon className="w-12 h-12 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Tutor</h2>
                  <p className="text-gray-600 mb-6">
                    Apply to become a tutor and share your knowledge. Join our teaching community.
                  </p>
                  <div className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-primary-700 transition-colors duration-300">
                    Apply as Tutor
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Back to Home */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Tutor Link. Empowering education in Sierra Leone.</p>
        </div>
      </footer>
    </div>
  )
} 