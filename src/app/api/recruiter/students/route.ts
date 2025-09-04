import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'

// GET /api/recruiter/students - List students with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClientOnly()
    
    // Check if user is recruiter or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: appUser } = await supabase
      .from('app_user')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single()

    if (!appUser || !['recruiter', 'admin'].includes(appUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const university = searchParams.get('university') || ''
    const degree = searchParams.get('degree') || ''
    const gpaMin = searchParams.get('gpaMin')
    const gpaMax = searchParams.get('gpaMax')
    const hasResume = searchParams.get('hasResume')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Get active event
    const { data: activeEvent } = await supabase
      .from('recruiting_event')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!activeEvent) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // Build query for students
    let studentQuery = supabase
      .from('student')
      .select(`
        id,
        name,
        email,
        university,
        degree,
        gpa,
        resume_path,
        created_at,
        app_user:app_user_id (
          auth_user_id
        )
      `)
      .eq('event_id', activeEvent.id)

    // Apply filters
    if (query) {
      studentQuery = studentQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,university.ilike.%${query}%`)
    }
    if (university) {
      studentQuery = studentQuery.ilike('university', `%${university}%`)
    }
    if (degree) {
      studentQuery = studentQuery.ilike('degree', `%${degree}%`)
    }
    if (gpaMin) {
      studentQuery = studentQuery.gte('gpa', parseFloat(gpaMin))
    }
    if (gpaMax) {
      studentQuery = studentQuery.lte('gpa', parseFloat(gpaMax))
    }
    if (hasResume === 'true') {
      studentQuery = studentQuery.not('resume_path', 'is', null)
    } else if (hasResume === 'false') {
      studentQuery = studentQuery.is('resume_path', null)
    }

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('student')
      .select(`
        id,
        full_name,
        email,
        university,
        degree,
        gpa,
        resume_path,
        created_at,
        interviews:interview!left(
          id,
          recruiter_id,
          rating_overall,
          rating_tech,
          rating_comm,
          feedback,
          created_at
        )
      `, { count: 'exact', head: true })
      .eq('event_id', activeEvent.id)

    // Apply same filters to count query
    if (query) {
      countQuery = countQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }
    if (university) {
      countQuery = countQuery.ilike('university', `%${university}%`)
    }
    if (degree) {
      countQuery = countQuery.ilike('degree', `%${degree}%`)
    }
    if (!isNaN(gpaMin)) {
      countQuery = countQuery.gte('gpa', gpaMin)
    }
    if (!isNaN(gpaMax)) {
      countQuery = countQuery.lte('gpa', gpaMax)
    }
    if (hasResume === 'true') {
      countQuery = countQuery.not('resume_path', 'is', null)
    } else if (hasResume === 'false') {
      countQuery = countQuery.is('resume_path', null)
    }

    const { count } = await countQuery

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    studentQuery = studentQuery.range(from, to)

    const { data: students, error } = await studentQuery.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Get interview summaries for current recruiter
    const studentIds = students?.map(s => s.id) || []
    let interviewSummaries: any[] = []

    if (studentIds.length > 0) {
      const { data: interviews } = await supabase
        .from('interview')
        .select('student_id, rating_overall, rating_tech, rating_comm, feedback, created_at')
        .eq('recruiter_id', appUser.id)
        .eq('event_id', activeEvent.id)
        .in('student_id', studentIds)

      interviewSummaries = interviews || []
    }

    // Combine students with interview summaries
    const studentsWithSummary = students?.map(student => {
      const interview = interviewSummaries.find(i => i.student_id === student.id)
      return {
        ...student,
        hasInterview: !!interview,
        latestInterview: interview ? {
          rating_overall: interview.rating_overall,
          rating_tech: interview.rating_tech,
          rating_comm: interview.rating_comm,
          feedback: interview.feedback,
          created_at: interview.created_at
        } : null
      }
    }) || []

    return NextResponse.json({
      items: studentsWithSummary,
      total: count || 0
    })
  } catch (error) {
    console.error('Recruiter students GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
