'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requireAuthClient } from '@/lib/authClient'
import { AppUser } from '@/lib/authClient'
import { RecruitingEvent } from '@/types'

export default function AdminPage() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<RecruitingEvent[]>([])
  const [activeEvent, setActiveEvent] = useState<RecruitingEvent | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [ending, setEnding] = useState(false)
  const [message, setMessage] = useState('')
  const [newEventName, setNewEventName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await requireAuthClient()
        if (userData.role !== 'admin') {
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
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/event')
      const data = await response.json()

      if (response.ok) {
        setEvents(data)
        const active = data.find((event: RecruitingEvent) => event.is_active)
        setActiveEvent(active)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName.trim()) return

    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEventName })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event')
      }

      setMessage('Event created successfully!')
      setNewEventName('')
      fetchEvents()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  const handleInviteRecruiter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite recruiter')
      }

      setMessage('Recruiter invited successfully!')
      setInviteEmail('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to invite recruiter')
    } finally {
      setInviting(false)
    }
  }

  const handleEndEvent = async () => {
    if (!activeEvent) return
    if (!confirm('Are you sure you want to end this recruiting event? This will generate a report and close the event.')) return

    setEnding(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to end event')
      }

      setMessage('Event ended successfully! Report has been generated and sent.')
      fetchEvents()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to end event')
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user || user.role !== 'admin') {
    return <div>Access denied</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src="/aptiv-logo.png" 
            alt="Aptiv" 
            className="h-8 w-auto"
          />
          <h1 className="text-2xl font-bold text-aptiv-blue">Admin Panel</h1>
        </div>
        <p className="mt-2 text-gray-600">Manage Aptiv recruiting events and recruiters</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Event Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Event Management</h2>
          </div>
          <div className="px-6 py-6 space-y-6">
            {/* Current Event Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Event Status</h3>
              {activeEvent ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Active: {activeEvent.name}
                      </p>
                      <p className="text-sm text-green-600">
                        Started: {new Date(activeEvent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-sm text-gray-600">No active event</p>
                </div>
              )}
            </div>

            {/* Create New Event */}
            <form onSubmit={handleCreateEvent}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Event</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Event name"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={creating || !newEventName.trim()}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-aptiv-blue hover:bg-aptiv-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aptiv-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>

            {/* End Event */}
            {activeEvent && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">End Current Event</h3>
                <button
                  onClick={handleEndEvent}
                  disabled={ending}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ending ? 'Ending Event...' : 'End Recruiting Event'}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  This will generate a report and close the current event.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recruiter Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recruiter Management</h2>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleInviteRecruiter}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Invite New Recruiter</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Recruiter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-aptiv-blue hover:bg-aptiv-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aptiv-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                The recruiter will receive an email with login instructions.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Event History */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Event History</h2>
        </div>
        <div className="px-6 py-6">
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ended
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {event.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.is_active ? 'Active' : 'Ended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.ended_at ? new Date(event.ended_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No events found</p>
          )}
        </div>
      </div>
    </div>
  )
}
