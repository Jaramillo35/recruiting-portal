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

    // Get all students and their interviews for the active event
    const { data: students, error: studentsError } = await supabase
      .from('student')
      .select(`
        *,
        interview!left (
          rating_overall,
          rating_tech,
          rating_comm,
          feedback,
          created_at
        )
      `)
      .eq('event_id', activeEvent.id)

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 400 })
    }

    // Process data for report
    const reportData: StudentReportData[] = students.map(student => {
      const interviews = student.interview || []
      const interviews_count = interviews.length
      
      const avg_overall = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_overall?: number }) => sum + (i.rating_overall || 0), 0) / interviews_count 
        : null
      
      const avg_tech = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_tech?: number }) => sum + (i.rating_tech || 0), 0) / interviews_count 
        : null
      
      const avg_comm = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_comm?: number }) => sum + (i.rating_comm || 0), 0) / interviews_count 
        : null

      const latest_feedback = interviews_count > 0 
        ? interviews
            .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            .feedback?.substring(0, 100) + (interviews[0].feedback?.length > 100 ? '...' : '')
        : null

      return {
        event_name: activeEvent.name,
        student_id: student.id,
        full_name: student.full_name,
        university: student.university,
        degree: student.degree,
        gpa: student.gpa,
        email: student.email,
        phone: student.phone,
        resume_path: student.resume_url,
        interviews_count,
        avg_overall,
        avg_tech,
        avg_comm,
        latest_feedback_short: latest_feedback
      }
    })

    // Generate CSV
    const csvData = generateCSV(reportData)

    // Send email with report
    await sendReportEmail(activeEvent.name, csvData, reportData)

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
