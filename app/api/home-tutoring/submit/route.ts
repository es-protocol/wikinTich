import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { storeRegistrationData } from '@/lib/registration-storage'
import { validateEmail, validatePhone, validateEmailDetailed, validatePhoneDetailed, validateCountryCode, sanitizeInput } from '@/lib/security'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { isOriginAllowed, getCORSHeaders } from '@/lib/cors-config'
import { ERROR_MESSAGES, REGISTRATION_TYPES } from '@/lib/constants'

const COOKIE_NAME = 'csrf_sig'

//Parses the cookie from the request headers and Extract one cookie by name
function getCookie(headers: Headers, name: string): string | null { //Takes two inputs: all http headrs from the request
  //name of the cookie. Returns either cookie's value (string) or null if not found
  const cookieHeader = headers.get('cookie') || headers.get('Cookie') //Look for cookies in either case
  if (!cookieHeader) return null
  //Almost all the time cookie headers contains ALL the cookies the browser knows about as one long string separated by semicolons
  const cookies = cookieHeader.split(';').map(p => p.trim())//split the string into individual cookies and trim whitespace
  for (const part of cookies) {
    const [k, ...vals] = part.split('=')//split the cookie into key and value
    if (k === name) return vals.join('=')//if the key matches the name, return the value
  }
  return null
}
//compare two strings in a way that is secure and prevents timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)//A buuffer is needed because crypto.timingSafeEqual only works with binary data
  if (ab.length !== bb.length) return false
  //unlike normal string comparison, this compares every single byte even after finding a mismatch
  return crypto.timingSafeEqual(ab, bb)
}
//Post Handler:  
export async function POST(req: NextRequest) {
  if (!process.env.CSRF_SECRET) {//Require CSRF secret to be set in the environment variables
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
//Check if the request is coming from an allowed origin
  const origin = req.headers.get('origin') || ''
  if (!isOriginAllowed(origin)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
//Parse the request body 
  let body: any
  try {
    body = await req.json()//Try to read the request body as JSON
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
//Extract the CSRF token from body and the cooke signature from the request header(hmac signature set earlier
  const { csrf_token, formData } = body || {}
  const cookieSig = getCookie(req.headers as any, COOKIE_NAME)//assigns original signature to cookieSig

  if (!csrf_token || !cookieSig) {
    return NextResponse.json({ error: 'bad_csrf' }, { status: 400 })
  }
//Recompute the expected signature from the received token using server secret 
  const expected = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(csrf_token)
    .digest('base64url')
//Timing-safe compare with the cookie signature. If mismatch reject
  if (!timingSafeEqual(expected, cookieSig)) {
    return NextResponse.json({ error: 'bad_csrf' }, { status: 400 })
  }

  // Server-side validation with detailed error messages
  
  // Validate country code
  const countryCodeValidation = validateCountryCode(formData?.countryCode)
  if (!countryCodeValidation.isValid) {
    return NextResponse.json({ error: countryCodeValidation.message }, { status: 400 })
  }

  // Validate email with detailed messages
  const emailValidation = validateEmailDetailed(formData?.parentEmail)
  if (!emailValidation.isValid) {
    return NextResponse.json({ error: emailValidation.message }, { status: 400 })
  }

  // Validate phone with country-specific rules
  const phoneValidation = validatePhoneDetailed(formData?.parentPhone, formData?.countryCode)
  if (!phoneValidation.isValid) {
    return NextResponse.json({ error: phoneValidation.message }, { status: 400 })
  }

  // Server-side rate limiting
  const rateLimitCheck = await checkServerSideRateLimit(req, formData.parentEmail)
  if (!rateLimitCheck.allowed) {
    return NextResponse.json({ 
      error: rateLimitCheck.error || 'Rate limit exceeded',
      resetTime: rateLimitCheck.resetTime
    }, { status: 429 })
  }

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: formData.parentEmail,
    options: {
      data: {
        full_name: formData.parentName,
        phone: formData.parentPhone,
        role: 'parent',
        student_name: formData.studentName,
        student_age: formData.studentAge,
        grade_level: formData.gradeLevel,
        subjects: formData.subjects,
        preferred_schedule: formData.preferredSchedule,
        location: formData.location,
        additional_requirements: formData.additionalRequirements,
      },
      emailRedirectTo: getEmailRedirectUrl(),
    },
  })

  if (otpError) {
    return NextResponse.json({ error: 'otp_error' }, { status: 500 })
  }
//Build sanitized data (remove unsafe input) 
  const registrationData = {
    parentName: sanitizeInput(formData.parentName),
    parentPhone: sanitizeInput(formData.parentPhone),
    countryCode: formData.countryCode, // Store validated country code
    parentEmail: formData.parentEmail,
    studentName: sanitizeInput(formData.studentName),
    studentAge: formData.studentAge,
    gradeLevel: sanitizeInput(formData.gradeLevel),
    subjects: sanitizeInput(formData.subjects),
    preferredSchedule: sanitizeInput(formData.preferredSchedule),
    location: sanitizeInput(formData.location),
    additionalRequirements: sanitizeInput(formData.additionalRequirements),
  }
//save pending registration data server side with the correct type 
  const storeResult = await storeRegistrationData(
    formData.parentEmail,
    registrationData,
    REGISTRATION_TYPES.PARENT
  )

  if (!storeResult.success) {
    console.error('Storage error details:', storeResult.error)
    return NextResponse.json({ error: 'storage_error', details: storeResult.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, {
    headers: getCORSHeaders(origin)
  }) // if everything is successful, return a success response
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || ''
  
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(origin)
  })
}
