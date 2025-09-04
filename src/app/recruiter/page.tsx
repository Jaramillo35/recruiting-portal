'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from '@/components/Table'
import { Guard } from '@/components/Guard'
import { requireAuthClient } from '@/lib/authClient'
import { AppUser } from '@/lib/authClient'
import { StudentWithInterviewSummary } from '@/types'

export default function RecruiterDashboard() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentWithInterviewSummary[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    query: '',
    university: '',
    degree: '',
    gpaMin: '',
    gpaMax: '',
    hasResume: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20
  })
  const router = useRouter()

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
      fetchStudents()
    }
  }, [user, filters, pagination])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      })

      const response = await fetch(`/api/students?${params}`)
      const data = await response.json()

      if (response.ok) {
        setStudents(data.items)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStudentClick = (student: StudentWithInterviewSummary) => {
    router.push(`/recruiter/student/${student.id}`)
  }

  const columns = [
    {
      key: 'full_name' as keyof StudentWithInterviewSummary,
      label: 'Name',
      render: (value: string, student: StudentWithInterviewSummary) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{student.email}</div>
        </div>
      )
    },
    {
      key: 'university' as keyof StudentWithInterviewSummary,
      label: 'University'
    },
    {
      key: 'degree' as keyof StudentWithInterviewSummary,
      label: 'Degree',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'gpa' as keyof StudentWithInterviewSummary,
      label: 'GPA',
      render: (value: number) => value ? value.toFixed(2) : 'N/A'
    },
    {
      key: 'resume_url' as keyof StudentWithInterviewSummary,
      label: 'Resume',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'interviews_count' as keyof StudentWithInterviewSummary,
      label: 'Interviews',
      render: (value: number, student: StudentWithInterviewSummary) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          {student.avg_overall && (
            <div className="text-sm text-gray-500">
              Avg: {student.avg_overall.toFixed(1)}
            </div>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <Guard user={user} allowedRoles={['recruiter', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="mt-2 text-gray-600">Browse and manage student applications</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                placeholder="Name or email"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">University</label>
              <input
                type="text"
                placeholder="University name"
                value={filters.university}
                onChange={(e) => handleFilterChange('university', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input
                type="text"
                placeholder="Degree program"
                value={filters.degree}
                onChange={(e) => handleFilterChange('degree', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min GPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={filters.gpaMin}
                onChange={(e) => handleFilterChange('gpaMin', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max GPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="10.0"
                value={filters.gpaMax}
                onChange={(e) => handleFilterChange('gpaMax', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Has Resume</label>
              <select
                value={filters.hasResume}
                onChange={(e) => handleFilterChange('hasResume', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Students ({total} total)
            </h2>
          </div>
          <Table
            data={students}
            columns={columns}
            onRowClick={handleStudentClick}
          />
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.pageSize >= total}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Guard>
  )
}
