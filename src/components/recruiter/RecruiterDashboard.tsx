'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast, ToastContainer } from '@/components/Toast'
import { RateDrawer } from './RateDrawer'

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

interface StudentsResponse {
  items: Student[]
  total: number
}

interface RecruiterDashboardProps {
  initialStudents: StudentsResponse
}

export function RecruiterDashboard({ initialStudents }: RecruiterDashboardProps) {
  const { toasts, addToast, removeToast } = useToast()
  
  // State
  const [students, setStudents] = useState<Student[]>(initialStudents.items)
  const [total, setTotal] = useState(initialStudents.total)
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showRateDrawer, setShowRateDrawer] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    query: '',
    university: '',
    degree: '',
    gpaMin: '',
    gpaMax: '',
    hasResume: ''
  })
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20
  })

  // Load students with filters
  const loadStudents = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...filters
      })
      
      const response = await fetch(`/api/recruiter/students?${params}`)
      if (response.ok) {
        const data: StudentsResponse = await response.json()
        setStudents(data.items)
        setTotal(data.total)
        setPagination(prev => ({ ...prev, page }))
      } else {
        addToast('Failed to load students', 'error')
      }
    } catch (error) {
      addToast('Failed to load students', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.pageSize, addToast])

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters, loadStudents])

  // Handle rate student
  const handleRateStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowRateDrawer(true)
  }

  // Handle view resume
  const handleViewResume = async (resumePath: string) => {
    try {
      const response = await fetch(`/api/recruiter/student/${selectedStudent?.id}?signedResume=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.resumeUrl) {
          window.open(data.resumeUrl, '_blank')
        } else {
          addToast('Resume not available', 'error')
        }
      } else {
        addToast('Failed to generate resume URL', 'error')
      }
    } catch (error) {
      addToast('Failed to view resume', 'error')
    }
  }

  // Handle interview saved
  const handleInterviewSaved = () => {
    addToast('Interview saved successfully', 'success')
    setShowRateDrawer(false)
    setSelectedStudent(null)
    loadStudents(pagination.page)
  }

  const totalPages = Math.ceil(total / pagination.pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aptiv-orange">Recruiter Dashboard</h1>
        <p className="mt-2 text-gray-600">Review and rate student applications</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search (name, email, university)"
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="border-gray-300 rounded-md shadow-sm focus:ring-aptiv-orange focus:border-aptiv-orange sm:text-sm"
          />
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
      </div>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Students ({total})</h2>
        </div>
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
                  Status
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {student.hasInterview ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Interviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleRateStudent(student)}
                        className="text-aptiv-orange hover:text-aptiv-orange-hover font-medium"
                      >
                        {student.hasInterview ? 'Edit' : 'Rate'}
                      </button>
                      {student.resume_path && (
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            handleViewResume(student.resume_path!)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, total)} of{' '}
              {total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadStudents(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => loadStudents(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rate Drawer */}
      {selectedStudent && (
        <RateDrawer
          student={selectedStudent}
          isOpen={showRateDrawer}
          onClose={() => {
            setShowRateDrawer(false)
            setSelectedStudent(null)
          }}
          onSaved={handleInterviewSaved}
        />
      )}
    </div>
  )
}
