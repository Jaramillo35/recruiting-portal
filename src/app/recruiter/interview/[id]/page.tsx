'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { interviewFormSchema, InterviewFormData } from '@/lib/validations'
import { FormTextarea } from '@/components/FormTextarea'
import { requireAuthClient } from '@/lib/authClient'
import { AppUser } from '@/lib/authClient'
import { Student } from '@/types'

interface InterviewPageProps {
  params: { id: string }
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      student_id: params.id
    }
  })

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
    if (user) {
      fetchStudentData()
    }
  }, [user, params.id])

  const fetchStudentData = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      
      if (data.items) {
        const studentData = data.items.find((s: Student) => s.id === params.id)
        setStudent(studentData)
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error)
    }
  }

  const onSubmit = async (data: InterviewFormData) => {
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit interview')
      }

      setMessage('Interview submitted successfully!')
      setTimeout(() => {
        router.push(`/recruiter/student/${params.id}`)
      }, 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit interview')
    } finally {
      setSubmitting(false)
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Student Profile
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Conduct Interview</h1>
          <p className="mt-2 text-gray-600">
            Interview with {student.full_name} from {student.university}
          </p>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ratings */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Interview Ratings</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <select
                    {...register('rating_overall', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select rating</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                  {errors.rating_overall && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating_overall.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Skills
                  </label>
                  <select
                    {...register('rating_tech', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select rating</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                  {errors.rating_tech && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating_tech.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication
                  </label>
                  <select
                    {...register('rating_comm', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select rating</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                  {errors.rating_comm && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating_comm.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <FormTextarea
                label="Interview Feedback"
                required
                placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement, and overall impression..."
                {...register('feedback')}
                error={errors.feedback?.message}
              />
            </div>

            {message && (
              <div className={`text-sm ${
                message.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
