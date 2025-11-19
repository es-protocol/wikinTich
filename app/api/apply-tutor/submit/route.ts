/**
 * Tutor Application Submission API Route
 * 
 * PLACEHOLDER - This route will be implemented during refactoring.
 * Currently, the tutor flow uses client-side localStorage (insecure).
 * 
 * Target Implementation:
 * - CSRF protection
 * - Origin validation
 * - Rate limiting
 * - Input sanitization
 * - Server-side storage in pending_registrations table
 * 
 * Security Tests: See __tests__/app/apply-tutor/api/submit/route.test.ts
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST handler for tutor application submission
 * 
 * TODO: Implement security controls matching parent flow:
 * 1. Origin validation
 * 2. CSRF token validation
 * 3. Input validation
 * 4. Rate limiting
 * 5. Input sanitization
 * 6. Server-side storage
 * 7. OTP email sending
 */
export async function POST(req: NextRequest) {
  // PLACEHOLDER: This will be implemented during refactoring
  // For now, return 501 (Not Implemented) so tests can run
  // Using Response directly for Jest compatibility
  try {
    return new Response(
      JSON.stringify({ error: 'not_implemented', message: 'Tutor API route not yet implemented' }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch {
    // Fallback for NextResponse if available
    return NextResponse.json(
      { error: 'not_implemented', message: 'Tutor API route not yet implemented' },
      { status: 501 }
    )
  }
}
