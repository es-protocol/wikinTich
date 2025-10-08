import { NextRequest, NextResponse } from 'next/server'
import { deleteRegistrationData } from '@/lib/registration-storage'

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await deleteRegistrationData(email)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete registration data API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
