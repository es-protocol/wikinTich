'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...')
  const [subjects, setSubjects] = useState<any[]>([])

  useEffect(() => {
    async function testConnection() {
      try {
        // Test 1: Basic connection
        setStatus('Testing basic connection...')
        
        // Test 2: Query subjects table
        setStatus('Querying subjects table...')
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .limit(5)

        if (error) {
          setStatus(`Error: ${error.message}`)
          return
        }

        setSubjects(data || [])
        setStatus('✅ Connection successful! Database is working.')
        
      } catch (error) {
        setStatus(`❌ Connection failed: ${error}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Supabase Connection Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-gray-700">{status}</p>
        </div>

        {subjects.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subjects from Database</h2>
            <div className="grid gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="border rounded p-3">
                  <h3 className="font-medium">{subject.name}</h3>
                  <p className="text-gray-600">{subject.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <a 
            href="/" 
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
} 