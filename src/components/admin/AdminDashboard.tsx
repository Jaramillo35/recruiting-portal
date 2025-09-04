'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast, ToastContainer } from '@/components/Toast'

interface Recruiter {
  auth_user_id: string
  role: string
  created_at: string
  auth_user: {
    email: string
    user_metadata: any
  }
}

interface Student {
  id: string
  name: string
  email: string
  university: string
  degree: string
  gpa: number
  resume_path: string | null
  created_at: string
  app_user: {
    auth_user_id: string
  }
}

interface EventData {
  events: any[]
  activeEvent: {
    id: string
    name: string
    created_at: string
    studentCount: number
    interviewCount: number
  } | null
}

interface StudentsResponse {
  students: Student[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface AdminDashboardProps {
  initialEventData: EventData
}

export function AdminDashboard({ initialEventData }: AdminDashboardProps) {
  const { toasts, addToast, removeToast } = useToast()
  
  // State
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })
  const [eventData, setEventData] = useState<EventData>(initialEventData)
  
  // Filters
  const [filters, setFilters] = useState({
    university: '',
    degree: '',
    gpaMin: '',
    gpaMax: '',
    hasResume: ''
  })
  
  // Loading states
  const [loadingRecruiters, setLoadingRecruiters] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [invitingRecruiter, setInvitingRecruiter] = useState(false)
  const [endingEvent, setEndingEvent] = useState(false)
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('')

  // Load recruiters
  const loadRecruiters = useCallback(async () => {
    setLoadingRecruiters(true)
    try {
      const response = await fetch('/api/admin/recruiters')
      if (response.ok) {
        const data = await response.json()
        setRecruiters(data)
      } else {
        addToast('Failed to load recruiters', 'error')
      }
    } catch (error) {
      addToast('Failed to load recruiters', 'error')
    } finally {
      setLoadingRecruiters(false)
    }
  }, [addToast])

  // Load students with filters
  const loadStudents = useCallback(async (page = 1) => {
    setLoadingStudents(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...filters
      })
      
      const response = await fetch(`/api/admin/students?${params}`)
      if (response.ok) {
        const data: StudentsResponse = await response.json()
        setStudents(data.students)
        setPagination(data.pagination)
      } else {
        addToast('Failed to load students', 'error')
      }
    } catch (error) {
      addToast('Failed to load students', 'error')
    } finally {
      setLoadingStudents(false)
    }
  }, [filters, pagination.pageSize, addToast])

  // Load event data
  const loadEventData = useCallback(async () => {
    setLoadingEvent(true)
    try {
      const response = await fetch('/api/admin/event')
      if (response.ok) {
        const data = await response.json()
        setEventData(data)
      } else {
        addToast('Failed to load event data', 'error')
      }
    } catch (error) {
      addToast('Failed to load event data', 'error')
    } finally {
      setLoadingEvent(false)
    }
  }, [addToast])

  // Initial load
  useEffect(() => {
    loadRecruiters()
    loadStudents()
  }, [loadRecruiters, loadStudents])

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters, loadStudents])

  // Handle invite recruiter
  const handleInviteRecruiter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInvitingRecruiter(true)
    try {
      const response = await fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      const result = await response.json()
      if (response.ok) {
        addToast(result.message || 'Recruiter invited successfully', 'success')
        setInviteEmail('')
        loadRecruiters()
      } else {
        addToast(result.error || 'Failed to invite recruiter', 'error')
      }
    } catch (error) {
      addToast('Failed to invite recruiter', 'error')
    } finally {
      setInvitingRecruiter(false)
    }
  }

  // Handle demote recruiter
  const handleDemoteRecruiter = async (authUserId: string) => {
    if (!confirm('Are you sure you want to demote this recruiter to student?')) return

    try {
      const response = await fetch(`/api/admin/recruiters?id=${authUserId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (response.ok) {
        addToast(result.message || 'Recruiter demoted successfully', 'success')
        loadRecruiters()
      } else {
        addToast(result.error || 'Failed to demote recruiter', 'error')
      }
    } catch (error) {
      addToast('Failed to demote recruiter', 'error')
    }
  }

  // Handle view resume
  const handleViewResume = async (resumePath: string) => {
    try {
      const response = await fetch(`/api/admin/resume-url?path=${encodeURIComponent(resumePath)}`)
      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        addToast('Failed to generate resume URL', 'error')
      }
    } catch (error) {
      addToast('Failed to view resume', 'error')
    }
  }

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/students?id=${studentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (response.ok) {
        addToast(result.message || 'Student deleted successfully', 'success')
        loadStudents(pagination.page)
      } else {
        addToast(result.error || 'Failed to delete student', 'error')
      }
    } catch (error) {
      addToast('Failed to delete student', 'error')
    }
  }

  // Handle end event
  const handleEndEvent = async () => {
    if (!eventData.activeEvent) return
    if (!confirm('Are you sure you want to end this recruiting event? This will generate a report and close the event.')) return

    setEndingEvent(true)
    try {
      const response = await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      if (response.ok) {
        addToast('Event ended successfully! Report has been generated and sent.', 'success')
        loadEventData()
      } else {
        addToast(result.error || 'Failed to end event', 'error')
      }
    } catch (error) {
      addToast('Failed to end event', 'error')
    } finally {
      setEndingEvent(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aptiv-orange">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage Aptiv recruiting events, recruiters, and students</p>
      </div>

      {/* Event Controls */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Event</h2>
        {eventData.activeEvent ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Event Name</h3>
              <p className="text-lg font-semibold text-gray-900">{eventData.activeEvent.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(eventData.activeEvent.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
              <p className="text-lg font-semibold text-gray-900">{eventData.activeEvent.studentCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Total Interviews</h3>
              <p className="text-lg font-semibold text-gray-900">{eventData.activeEvent.interviewCount}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active event</p>
        )}
        
        {eventData.activeEvent && (
          <div className="mt-4">
            <button
              onClick={handleEndEvent}
              disabled={endingEvent}
              className="bg-aptiv-orange text-white px-6 py-2 rounded-md font-medium hover:bg-aptiv-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {endingEvent ? 'Ending Event...' : 'End Recruiting Event'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recruiters Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recruiters Management</h2>
          </div>
          <div className="p-6">
            {/* Add Recruiter Form */}
            <form onSubmit={handleInviteRecruiter} className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Recruiter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={invitingRecruiter || !inviteEmail.trim()}
                  className="bg-aptiv-orange text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-aptiv-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {invitingRecruiter ? 'Inviting...' : 'Add / Invite Recruiter'}
                </button>
              </div>
            </form>

            {/* Recruiters Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name/Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auth User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingRecruiters ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : recruiters.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No recruiters yet.
                      </td>
                    </tr>
                  ) : (
                    recruiters.map((recruiter) => (
                      <tr key={recruiter.auth_user_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recruiter.auth_user?.user_metadata?.name || recruiter.auth_user?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {recruiter.auth_user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(recruiter.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDemoteRecruiter(recruiter.auth_user_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Demote to Student
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Students Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Students Management</h2>
          </div>
          <div className="p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="University"
                value={filters.university}
                onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
              />
              <input
                type="text"
                placeholder="Degree"
                value={filters.degree}
                onChange={(e) => setFilters(prev => ({ ...prev, degree: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
              />
              <input
                type="number"
                placeholder="GPA Min"
                value={filters.gpaMin}
                onChange={(e) => setFilters(prev => ({ ...prev, gpaMin: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
              />
              <input
                type="number"
                placeholder="GPA Max"
                value={filters.gpaMax}
                onChange={(e) => setFilters(prev => ({ ...prev, gpaMax: e.target.value }))}
                className="border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasResume"
                  checked={filters.hasResume === 'true'}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    hasResume: e.target.checked ? 'true' : '' 
                  }))}
                  className="h-4 w-4 text-aptiv-orange focus:ring-aptiv-orange border-gray-300 rounded"
                />
                <label htmlFor="hasResume" className="ml-2 text-sm text-gray-700">
                  Has Resume
                </label>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Degree
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.university}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.degree}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.gpa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {student.resume_path && (
                            <button
                              onClick={() => handleViewResume(student.resume_path!)}
                              className="text-aptiv-orange hover:text-aptiv-orange-hover"
                            >
                              View Resume
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadStudents(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => loadStudents(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
