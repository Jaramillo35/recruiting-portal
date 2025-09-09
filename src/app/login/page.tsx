'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseBrowser'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for error messages in URL
    const error = searchParams.get('error')
    if (error) {
      switch (error) {
        case 'auth_exchange_error':
          setMessage('Authentication failed. Please try again.')
          break
        case 'auth_callback_error':
          setMessage('Login failed. Please try again.')
          break
        case 'no_code':
          setMessage('Invalid login link. Please request a new one.')
          break
        default:
          setMessage('An error occurred. Please try again.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const redirectTo = searchParams.get('redirectTo') || '/'
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for the login link!')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aptiv-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <img 
              src="/aptiv-logo.png" 
              alt="Aptiv" 
              className="h-12 w-auto mx-auto mb-6"
            />
            <h2 className="text-3xl font-extrabold text-aptiv-black">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-aptiv-gray">
              We&apos;ll send you a magic link to sign in
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-aptiv-black focus:outline-none focus:ring-2 focus:ring-aptiv-orange focus:border-aptiv-orange focus:z-10 text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aptiv-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>

            {message && (
              <div className={`text-sm text-center ${
                message.includes('Check your email') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-aptiv-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <img 
              src="/aptiv-logo.png" 
              alt="Aptiv" 
              className="h-12 w-auto mx-auto mb-6"
            />
            <h2 className="text-3xl font-extrabold text-aptiv-black">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-aptiv-gray">
              We&apos;ll send you a magic link to sign in
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}
