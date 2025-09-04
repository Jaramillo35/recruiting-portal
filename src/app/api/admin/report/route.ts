import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { generateCSV, StudentReportData } from '@/lib/csv'
import { sendReportEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin')
    const supabase = await createServerClientOnly()

    // Get the active recruiting event
    const { data: activeEvent, error: eventError } = await supabase
      .from('recruiting_event')
      .select('*')
      .eq('is_active', true)
      .single()

    if (eventError || !activeEvent) {
      return NextResponse.json({ error: 'No active recruiting event found' }, { status: 400 })
    }

    // Get all students for the active event
    const { data: students, error: studentsError } = await supabase
      .from('student')
      .select('*')
      .eq('event_id', activeEvent.id)

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 })
    }

    // Get all interviews for the active event with recruiter info
    const { data: interviews, error: interviewsError } = await supabase
      .from('interview')
      .select(`
        *,
        recruiter:recruiter_id (
          auth_user_id
        )
      `)
      .eq('event_id', activeEvent.id)

    if (interviewsError) {
      return NextResponse.json({ error: interviewsError.message }, { status: 400 })
    }

    // Calculate KPIs
    const totalStudents = students.length
    const totalInterviews = interviews.length
    const avgInterviewsPerStudent = totalStudents > 0 ? totalInterviews / totalStudents : 0
    const avgOverallRating = totalInterviews > 0 
      ? interviews.reduce((sum, i) => sum + (i.rating_overall || 0), 0) / totalInterviews 
      : 0

    // Generate CSV data - one row per interview
    const csvData = [
      // Header row
      [
        'event_name',
        'student_id', 
        'full_name',
        'email',
        'university',
        'degree',
        'gpa',
        'resume_path',
        'recruiter_id',
        'interviews_count_for_student',
        'rating_overall',
        'rating_tech', 
        'rating_comm',
        'feedback',
        'interview_created_at'
      ],
      // Data rows
      ...interviews.map(interview => {
        const student = students.find(s => s.id === interview.student_id)
        const studentInterviewsCount = interviews.filter(i => i.student_id === interview.student_id).length
        
        return [
          activeEvent.name,
          interview.student_id,
          student?.name || 'Unknown',
          student?.email || 'Unknown',
          student?.university || 'Unknown',
          student?.degree || 'Unknown',
          student?.gpa || 0,
          student?.resume_path || '',
          interview.recruiter?.auth_user_id || 'Unknown',
          studentInterviewsCount,
          interview.rating_overall || 0,
          interview.rating_tech || 0,
          interview.rating_comm || 0,
          interview.feedback || '',
          new Date(interview.created_at).toISOString()
        ]
      })
    ]

    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    // Generate HTML summary
    const topCandidates = interviews
      .map(interview => {
        const student = students.find(s => s.id === interview.student_id)
        return {
          name: student?.name || 'Unknown',
          email: student?.email || 'Unknown',
          university: student?.university || 'Unknown',
          rating: interview.rating_overall || 0
        }
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)

    const htmlSummary = `
      <h2>Recruiting Report - ${activeEvent.name}</h2>
      <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>Key Performance Indicators</h3>
      <ul>
        <li><strong>Total Students:</strong> ${totalStudents}</li>
        <li><strong>Total Interviews:</strong> ${totalInterviews}</li>
        <li><strong>Average Interviews per Student:</strong> ${avgInterviewsPerStudent.toFixed(2)}</li>
        <li><strong>Average Overall Rating:</strong> ${avgOverallRating.toFixed(2)}</li>
      </ul>
      
      <h3>Top Candidates by Average Overall Rating</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>University</th>
          <th>Rating</th>
        </tr>
        ${topCandidates.map(candidate => `
          <tr>
            <td>${candidate.name}</td>
            <td>${candidate.email}</td>
            <td>${candidate.university}</td>
            <td>${candidate.rating}</td>
          </tr>
        `).join('')}
      </table>
    `

    // Send email with report
    await sendReportEmail(activeEvent.name, csvString, htmlSummary)

    // Close the event
    const { error: closeError } = await supabase
      .from('recruiting_event')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('id', activeEvent.id)

    if (closeError) {
      console.error('Error closing event:', closeError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
