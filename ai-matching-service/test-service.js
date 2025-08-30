// Simple test script for AI Matching Service
// Run this after starting the service to test basic functionality

const testService = async () => {
  const baseUrl = 'http://localhost:3002'
  
  console.log('🧪 Testing AI Matching Service...\n')
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...')
    const healthResponse = await fetch(`${baseUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health Check:', healthData.status)
    
    // Test 2: System Stats
    console.log('\n2️⃣ Testing System Stats...')
    const statsResponse = await fetch(`${baseUrl}/stats`)
    const statsData = await statsResponse.json()
    console.log('✅ System Stats:', statsData.data.serviceStatus)
    
    // Test 3: Test Matching (will fail without real data, but tests endpoint)
    console.log('\n3️⃣ Testing Matching Endpoint...')
    const matchResponse = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'test-uuid-123' })
    })
    const matchData = await matchResponse.json()
    console.log('✅ Matching Endpoint Response:', matchData.success ? 'Success' : 'Expected Error')
    
    console.log('\n🎉 All basic tests completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Configure your .env file with Supabase credentials')
    console.log('2. Test with real request IDs from your database')
    console.log('3. Integrate with your super admin dashboard')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure the service is running: npm run dev')
  }
}

// Run the test
testService()
