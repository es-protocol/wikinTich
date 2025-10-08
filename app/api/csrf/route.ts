import crypto from 'crypto' //Makes random token
import { NextResponse } from 'next/server' //Builds responses

const COOKIE_NAME = 'csrf_sig' 
const ONE_HOUR = 60 * 60 //1 hour Lifetime

//This is the Get Handler for the CSRF Token endpoint
export async function GET() {
  // DEBUG: Log environment variable status
  console.log('CSRF_SECRET exists:', !!process.env.CSRF_SECRET)
  console.log('CSRF_SECRET length:', process.env.CSRF_SECRET?.length)
  
  if (!process.env.CSRF_SECRET) { //If the CSRF Secret is not set, return an error
    console.log('CSRF_SECRET is missing!')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
//Creat a strong random token for the page - It's like a ticket the form will carry 
  const rawToken = crypto.randomBytes(32).toString('base64url')
  const hmac = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(rawToken)
    .digest('base64url')

  const res = NextResponse.json({ token: rawToken }) //reply json to the browser with the token
  res.cookies.set(COOKIE_NAME, hmac, {
    httpOnly: true, //Only the server can read the cookie Javascript can't. This prevent hackers from stealing it with malicious codes
    sameSite: 'strict', //it only get sent when on the same website. This prevent CSRF attacks - like someone trying to trick clients from another site
    secure: process.env.NODE_ENV === 'production', //Only send the cookie over HTTPS in production
    path: '/', //Works for the entire website
    maxAge: ONE_HOUR, //1 hour lifetime
  })
  return res
}


