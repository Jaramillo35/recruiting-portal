'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentFormSchema, StudentFormData } from '@/lib/validations'
import { FormInput } from '@/components/FormInput'
import { Guard } from '@/components/Guard'
import { requireAuthClient } from '@/lib/authClient'
import { AppUser } from '@/lib/authClient'

export default function ApplyPage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumePath, setResumePath] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema)
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add a small delay to allow auth state to settle
        await new Promise(resolve => setTimeout(resolve, 100))
        const userData = await requireAuthClient()
        setUser(userData)
      } catch {
        console.log('Auth check failed, redirecting to login')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setMessage('Please upload a PDF, DOC, or DOCX file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB')
      return
    }

    setResumeFile(file)

    try {
      // Get signed upload URL
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type })
      })

      const { signedUrl, path } = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      // Upload file to Supabase Storage
      const uploadResult = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      })

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file')
      }

      setResumePath(path)
      setValue('resume_path', path)
      setMessage('Resume uploaded successfully!')
    } catch (error) {
      setMessage('Failed to upload resume. Please try again.')
    }
  }

  const onSubmit = async (data: StudentFormData) => {
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      setMessage('Application submitted successfully!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Guard user={user} allowedRoles={['student']}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Application</h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                label="Full Name"
                required
                {...register('full_name')}
                error={errors.full_name?.message}
              />

              <FormInput
                label="Email"
                type="email"
                required
                {...register('email')}
                error={errors.email?.message}
              />

              <FormInput
                label="University"
                required
                {...register('university')}
                error={errors.university?.message}
              />

              <FormInput
                label="Phone Number"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
              />

              <FormInput
                label="Degree Program"
                {...register('degree')}
                error={errors.degree?.message}
              />

              <FormInput
                label="GPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                {...register('gpa', { valueAsNumber: true })}
                error={errors.gpa?.message}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Resume
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {resumePath && (
                  <p className="text-sm text-green-600">Resume uploaded successfully!</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Privacy Notice
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        By submitting this application, you consent to the collection and processing of your personal data for recruitment purposes. 
                        Your information will be shared with recruiters and may be used to contact you about job opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
                  I consent to the processing of my personal data as described above
                </label>
              </div>

              {message && (
                <div className={`text-sm ${
                  message.includes('successfully') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Guard>
  )
}
