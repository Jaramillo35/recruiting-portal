import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireRoleOrHigher } from '@/lib/auth'
import { StudentWithInterviewSummary } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRoleOrHigher('recruiter')
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const university = searchParams.get('university') || ''
    const degree = searchParams.get('degree') || ''
    const gpaMin = searchParams.get('gpaMin')
    const gpaMax = searchParams.get('gpaMax')
    const hasResume = searchParams.get('hasResume')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const supabase = await createServerClientOnly()

    // Get the active recruiting event
    const { data: activeEvent, error: eventError } = await supabase
      .from('recruiting_event')
      .select('id')
      .eq('is_active', true)
      .single()

    if (eventError || !activeEvent) {
      return NextResponse.json({ error: 'No active recruiting event found' }, { status: 400 })
    }

    // Build query
    let studentsQuery = supabase
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

    // Apply filters
    if (query) {
      studentsQuery = studentsQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }
    if (university) {
      studentsQuery = studentsQuery.ilike('university', `%${university}%`)
    }
    if (degree) {
      studentsQuery = studentsQuery.ilike('degree', `%${degree}%`)
    }
    if (gpaMin) {
      studentsQuery = studentsQuery.gte('gpa', parseFloat(gpaMin))
    }
    if (gpaMax) {
      studentsQuery = studentsQuery.lte('gpa', parseFloat(gpaMax))
    }
    if (hasResume === 'true') {
      studentsQuery = studentsQuery.not('resume_url', 'is', null)
    }

    // Get total count
    const { count } = await studentsQuery

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    studentsQuery = studentsQuery.range(from, to)

    const { data: students, error } = await studentsQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Process students with interview summaries
    const processedStudents: StudentWithInterviewSummary[] = students.map(student => {
      const interviews = student.interview || []
      const interviews_count = interviews.length
      
      const avg_overall = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_overall?: number }) => sum + (i.rating_overall || 0), 0) / interviews_count 
        : undefined
      
      const avg_tech = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_tech?: number }) => sum + (i.rating_tech || 0), 0) / interviews_count 
        : undefined
      
      const avg_comm = interviews_count > 0 
        ? interviews.reduce((sum: number, i: { rating_comm?: number }) => sum + (i.rating_comm || 0), 0) / interviews_count 
        : undefined

      const latest_feedback = interviews_count > 0 
        ? interviews.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].feedback
        : undefined

      return {
        ...student,
        interviews_count,
        avg_overall,
        avg_tech,
        avg_comm,
        latest_feedback,
        has_interview: interviews_count > 0
      }
    })

    return NextResponse.json({
      items: processedStudents,
      total: count || 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
