import { NextRequest, NextResponse } from 'next/server'
import { getRegistrationData } from '@/lib/registration-storage'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await getRegistrationData(email)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    console.error('Error in registration data API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
