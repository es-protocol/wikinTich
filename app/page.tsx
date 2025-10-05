'use client'

import { motion } from 'framer-motion'
import { HomeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-primary-600">Tutor Link</h1>
              <span className="ml-2 text-xs sm:text-sm text-gray-500">Sierra Leone</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base">
                Login
              </Link>
              <Link href="/apply-tutor" className="text-secondary-600 hover:text-secondary-700 font-medium text-sm sm:text-base">
                Apply to be a Tutor
              </Link>
              <Link href="/register" className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 font-medium text-sm sm:text-base">
                Register
              </Link>
              <Link href="/super-admin-login" className="text-gray-600 hover:text-gray-700 font-medium text-xs sm:text-sm">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6"
          >
            Connecting Education in
            <span className="text-primary-600"> Sierra Leone</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2"
          >
            Connect with qualified tutors for personalized home tutoring sessions. Get the academic support your child needs in Sierra Leone.
          </motion.p>
        </div>

        {/* Home Tutoring Pathway */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/home-tutoring" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 h-full border-2 border-transparent group-hover:border-secondary-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-secondary-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-secondary-200 transition-colors duration-300">
                    <HomeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Home Tutoring</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Find qualified tutors for personalized home tutoring sessions. Get the academic support your child needs.
                  </p>
                  <div className="bg-secondary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium group-hover:bg-secondary-700 transition-colors duration-300 text-sm sm:text-base">
                    Request for Tutors
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 sm:mt-20 text-center"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Why Choose Tutor Link?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-leone-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">💰</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Secure Payments</h4>
              <p className="text-gray-600 text-sm sm:text-base">All payments in Leones through secure mobile money transactions</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🎓</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Qualified Educators</h4>
              <p className="text-gray-600 text-sm sm:text-base">Verified teachers and tutors with proper qualifications</p>
            </div>
            <div className="text-center sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">💬</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Easy Communication</h4>
              <p className="text-gray-600 text-sm sm:text-base">Built-in messaging system for seamless coordination</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
          <p className="text-sm sm:text-base">&copy; 2024 Tutor Link. Empowering education in Sierra Leone.</p>
        </div>
      </footer>
    </div>
  )
} 