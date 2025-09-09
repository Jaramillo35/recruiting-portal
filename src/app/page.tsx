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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-aptiv-black sm:text-5xl md:text-6xl mb-6">
            Welcome to the Recruiting Portal
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your recruitment process with Aptiv's comprehensive platform for students, recruiters, and administrators.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow-xl rounded-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-aptiv-orange rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-aptiv-gray truncate">
                      For Students
                    </dt>
                    <dd className="text-lg font-medium text-aptiv-black">
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
              <div className="mt-6">
                {user?.role === 'student' ? (
                  <Link
                    href="/apply"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover transition-colors duration-200"
                  >
                    Update Application
                  </Link>
                ) : (
                  <Link
                    href="/login?redirectTo=/apply"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover transition-colors duration-200"
                    onClick={() => console.log('Student login clicked')}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-aptiv-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-aptiv-gray truncate">
                      For Recruiters
                    </dt>
                    <dd className="text-lg font-medium text-aptiv-black">
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
              <div className="mt-6">
                {user?.role === 'recruiter' ? (
                  <Link
                    href="/recruiter"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-black hover:bg-gray-800 transition-colors duration-200"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login?redirectTo=/recruiter"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-black hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => console.log('Recruiter login clicked')}
                  >
                    Recruiter Login
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-lg border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-aptiv-orange rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-aptiv-gray truncate">
                      For Administrators
                    </dt>
                    <dd className="text-lg font-medium text-aptiv-black">
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
              <div className="mt-6">
                {user?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover transition-colors duration-200"
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <Link
                    href="/login?redirectTo=/admin"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover transition-colors duration-200"
                    onClick={() => console.log('Admin login clicked')}
                  >
                    Admin Login
                  </Link>
                )}
              </div>
            </div>
          </div>
      </div>

        {!user && (
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 mb-6">
              Ready to get started? Sign in to access your role-specific dashboard.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-aptiv-orange hover:bg-aptiv-orange-hover transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}