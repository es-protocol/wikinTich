import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WikinTich - Educational Platform for Sierra Leone',
  description: 'A comprehensive educational platform connecting institutions and students with qualified teachers and tutors in Sierra Leone.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read nonce from headers (set by middleware in production)
  // This nonce will be used by Next.js to add nonce attribute to all script tags
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || undefined

  return (
    <html lang="en" nonce={nonce}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 