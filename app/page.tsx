'use client'

import { motion } from 'framer-motion'
import { BuildingOffice2Icon, HomeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Tutor Link</h1>
              <span className="ml-2 text-sm text-gray-500">Sierra Leone</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login
              </Link>
              <Link href="/apply-tutor" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Apply to be a Tutor
              </Link>
              <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium">
                Register
              </Link>
              <Link href="/super-admin-login" className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Connecting Education in
            <span className="text-primary-600"> Sierra Leone</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Choose your pathway to quality education. Whether you're an institution seeking teachers or a student needing home tutoring, we've got you covered.
          </motion.p>
        </div>

        {/* Two Main Pathways */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Institutions Pathway */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/institutions" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full border-2 border-transparent group-hover:border-primary-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-300">
                    <BuildingOffice2Icon className="w-12 h-12 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Institutions</h2>
                  <p className="text-gray-600 mb-6">
                    Request qualified teachers for your educational institution. We'll match you with the best educators for your needs.
                  </p>
                  <div className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-primary-700 transition-colors duration-300">
                    Request for Teachers
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Home Tutoring Pathway */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link href="/home-tutoring" className="block">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full border-2 border-transparent group-hover:border-secondary-200 transition-all duration-300">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary-200 transition-colors duration-300">
                    <HomeIcon className="w-12 h-12 text-secondary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Home Tutoring</h2>
                  <p className="text-gray-600 mb-6">
                    Find qualified tutors for personalized home tutoring sessions. Get the academic support your child needs.
                  </p>
                  <div className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-secondary-700 transition-colors duration-300">
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
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Tutor Link?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-leone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Payments</h4>
              <p className="text-gray-600">All payments in Leones through secure mobile money transactions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Qualified Educators</h4>
              <p className="text-gray-600">Verified teachers and tutors with proper qualifications</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy Communication</h4>
              <p className="text-gray-600">Built-in messaging system for seamless coordination</p>
            </div>
          </div>
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