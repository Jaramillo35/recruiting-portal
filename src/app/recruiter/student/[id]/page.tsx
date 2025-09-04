'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requireAuthClient } from '@/lib/authClient'
import { AppUser } from '@/lib/authClient'
import { Student, Interview } from '@/types'

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const [id, setId] = useState<string | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await requireAuthClient()
        if (userData.role !== 'recruiter' && userData.role !== 'admin') {
          router.push('/')
          return
        }
        setUser(userData)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (user && id) {
      fetchStudentData()
    }
  }, [user, id])

  const fetchStudentData = async () => {
    try {
      // Fetch student details
      const studentResponse = await fetch(`/api/students`)
      const studentsData = await studentResponse.json()
      
      if (studentsData.items) {
        const studentData = studentsData.items.find((s: Student) => s.id === id)
        if (studentData) {
          setStudent(studentData)
          
          // Get resume URL if available
          if (studentData.resume_url) {
            const resumeResponse = await fetch(`/api/upload?path=${encodeURIComponent(studentData.resume_url)}`)
            const resumeData = await resumeResponse.json()
            if (resumeResponse.ok) {
              setResumeUrl(resumeData.signedUrl)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
    return <div>Access denied</div>
  }

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Student not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
            <div className="flex space-x-3">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Resume
                </a>
              )}
              <button
                onClick={() => router.push(`/recruiter/interview/${student.id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Conduct Interview
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{student.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{student.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{student.phone || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">University</dt>
                  <dd className="text-sm text-gray-900">{student.university}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Degree Program</dt>
                  <dd className="text-sm text-gray-900">{student.degree || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">GPA</dt>
                  <dd className="text-sm text-gray-900">{student.gpa ? student.gpa.toFixed(2) : 'Not provided'}</dd>
                </div>
              </dl>
            </div>

            {/* Application Status */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Application Status</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(student.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resume Status</dt>
                  <dd className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.resume_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.resume_url ? 'Uploaded' : 'Not uploaded'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Interview Count</dt>
                  <dd className="text-sm text-gray-900">
                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Interview History */}
          {interviews.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Interview History</h2>
              <div className="space-y-4">
                {interviews.map((interview, index) => (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        Interview #{index + 1}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Overall</dt>
                        <dd className="text-sm text-gray-900">{interview.rating_overall}/5</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Technical</dt>
                        <dd className="text-sm text-gray-900">{interview.rating_tech}/5</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Communication</dt>
                        <dd className="text-sm text-gray-900">{interview.rating_comm}/5</dd>
                      </div>
                    </div>
                    {interview.feedback && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Feedback</dt>
                        <dd className="text-sm text-gray-900 mt-1">{interview.feedback}</dd>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
