'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { interviewFormSchema, InterviewFormData } from '@/lib/validations'
import { useToast } from '@/components/Toast'

interface Student {
  id: string
  name: string
  email: string
  university: string
  degree: string
  gpa: number
  resume_path: string | null
  created_at: string
  latestInterview: {
    rating_overall: number
    rating_tech: number
    rating_comm: number
    feedback: string
    created_at: string
  } | null
  resumeUrl?: string
}

interface InterviewPageProps {
  student: Student
}

export function InterviewPage({ student }: InterviewPageProps) {
  const { addToast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      student_id: student.id,
      rating_overall: student.latestInterview?.rating_overall || 3,
      rating_tech: student.latestInterview?.rating_tech || 3,
      rating_comm: student.latestInterview?.rating_comm || 3,
      feedback: student.latestInterview?.feedback || ''
    }
  })

  const onSubmit = async (data: InterviewFormData) => {
    setSaving(true)
    try {
      const response = await fetch('/api/recruiter/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (response.ok) {
        addToast(result.message || 'Interview saved successfully', 'success')
        router.push('/recruiter')
      } else {
        addToast(result.error || 'Failed to save interview', 'error')
      }
    } catch (error) {
      addToast('Failed to save interview', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleViewResume = () => {
    if (student.resumeUrl) {
      window.open(student.resumeUrl, '_blank')
    } else {
      addToast('Resume not available', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/recruiter')}
          className="text-aptiv-orange hover:text-aptiv-orange-hover font-medium mb-4"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-aptiv-orange">
          {student.latestInterview ? 'Edit Interview' : 'Rate Student'}
        </h1>
        <p className="mt-2 text-gray-600">Provide feedback and ratings for this candidate</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="text-sm text-gray-900">{student.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-sm text-gray-900">{student.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">University</h3>
                <p className="text-sm text-gray-900">{student.university}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Degree</h3>
                <p className="text-sm text-gray-900">{student.degree}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">GPA</h3>
                <p className="text-sm text-gray-900">{student.gpa}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Application Date</h3>
                <p className="text-sm text-gray-900">
                  {new Date(student.created_at).toLocaleDateString()}
                </p>
              </div>
              {student.resume_path && (
                <div>
                  <button
                    onClick={handleViewResume}
                    className="w-full bg-aptiv-orange text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-aptiv-orange-hover"
                  >
                    View Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interview Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Interview Assessment</h2>
              
              {/* Overall Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overall Rating *
                </label>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_overall')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_overall && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_overall.message}</p>
                )}
              </div>

              {/* Technical Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Technical Skills *
                </label>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_tech')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_tech && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_tech.message}</p>
                )}
              </div>

              {/* Communication Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Communication *
                </label>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_comm')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_comm && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_comm.message}</p>
                )}
              </div>

              {/* Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Feedback *
                </label>
                <textarea
                  {...register('feedback')}
                  rows={6}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
                  placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement, and overall recommendation..."
                />
                {errors.feedback && (
                  <p className="mt-1 text-sm text-red-600">{errors.feedback.message}</p>
                )}
              </div>

              {/* Previous Interview */}
              {student.latestInterview && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Previous Interview</h3>
                  <div className="text-sm text-gray-600">
                    <p>Overall: {student.latestInterview.rating_overall}/5</p>
                    <p>Technical: {student.latestInterview.rating_tech}/5</p>
                    <p>Communication: {student.latestInterview.rating_comm}/5</p>
                    <p className="mt-2">Feedback: {student.latestInterview.feedback}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(student.latestInterview.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/recruiter')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-aptiv-orange hover:bg-aptiv-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Interview'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
