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

        {/* Tutoring Options */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Home Tutoring Pathway */}
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
                    Request via Website
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* WhatsApp Request Pathway */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/whatsapp-request" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 h-full border-2 border-transparent group-hover:border-green-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-green-200 transition-colors duration-300">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">WhatsApp Request</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Prefer WhatsApp? Send us a quick message and we'll help you find the perfect tutor for your child.
                  </p>
                  <div className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium group-hover:bg-green-700 transition-colors duration-300 text-sm sm:text-base inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Request via WhatsApp
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