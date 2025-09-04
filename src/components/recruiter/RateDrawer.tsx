'use client'

import { useState } from 'react'
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
  hasInterview: boolean
  latestInterview: {
    rating_overall: number
    rating_tech: number
    rating_comm: number
    feedback: string
    created_at: string
  } | null
}

interface RateDrawerProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function RateDrawer({ student, isOpen, onClose, onSaved }: RateDrawerProps) {
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
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

  // Update form when student changes
  useState(() => {
    if (student.latestInterview) {
      setValue('rating_overall', student.latestInterview.rating_overall)
      setValue('rating_tech', student.latestInterview.rating_tech)
      setValue('rating_comm', student.latestInterview.rating_comm)
      setValue('feedback', student.latestInterview.feedback)
    } else {
      setValue('rating_overall', 3)
      setValue('rating_tech', 3)
      setValue('rating_comm', 3)
      setValue('feedback', '')
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
        onSaved()
      } else {
        addToast(result.error || 'Failed to save interview', 'error')
      }
    } catch (error) {
      addToast('Failed to save interview', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {student.hasInterview ? 'Edit Interview' : 'Rate Student'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Student Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-500">{student.email}</p>
            <p className="text-sm text-gray-500">{student.university} • {student.degree}</p>
            <p className="text-sm text-gray-500">GPA: {student.gpa}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 px-6 py-4 space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating *
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_overall')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-1 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_overall && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_overall.message}</p>
                )}
              </div>

              {/* Technical Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Skills *
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_tech')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-1 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_tech && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_tech.message}</p>
                )}
              </div>

              {/* Communication Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication *
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        value={rating}
                        {...register('rating_comm')}
                        className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300"
                      />
                      <span className="ml-1 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
                {errors.rating_comm && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating_comm.message}</p>
                )}
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback *
                </label>
                <textarea
                  {...register('feedback')}
                  rows={4}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
                  placeholder="Provide detailed feedback about the candidate..."
                />
                {errors.feedback && (
                  <p className="mt-1 text-sm text-red-600">{errors.feedback.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-aptiv-orange hover:bg-aptiv-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
