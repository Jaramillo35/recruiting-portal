'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { AppUser } from "@/lib/authClient";

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <img 
            src="/aptiv-logo.png" 
            alt="Aptiv" 
            className="h-12 w-auto"
          />
          <h1 className="text-4xl font-bold text-aptiv-blue sm:text-5xl md:text-6xl">
            Recruiting Portal
          </h1>
        </div>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Streamline your recruitment process with Aptiv's comprehensive platform for students, recruiters, and administrators.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-aptiv-blue rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    For Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Apply & Submit Resume
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Submit your application, upload your resume, and showcase your skills to potential employers.
              </p>
            </div>
            <div className="mt-4">
              {user?.role === 'student' ? (
                <Link
                  href="/apply"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-aptiv-blue hover:bg-aptiv-light-blue"
                >
                  Update Application
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-aptiv-blue hover:bg-aptiv-light-blue"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    For Recruiters
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Review & Interview
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Browse student profiles, conduct interviews, and provide feedback to help make hiring decisions.
              </p>
            </div>
            <div className="mt-4">
              {user?.role === 'recruiter' ? (
                <Link
                  href="/recruiter"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Recruiter Login
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    For Administrators
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Manage & Report
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Manage recruiting events, invite recruiters, and generate comprehensive reports.
              </p>
            </div>
            <div className="mt-4">
              {user?.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Ready to get started? Sign in to access your role-specific dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-aptiv-blue hover:bg-aptiv-light-blue"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}