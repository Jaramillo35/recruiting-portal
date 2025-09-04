import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'

// GET /api/recruiter/student/[id] - Get single student with optional signed resume
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const signedResume = searchParams.get('signedResume') === '1'

    // Get student data
    const { data: student, error: studentError } = await supabase
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
      .eq('id', params.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get latest interview by current recruiter
    const { data: latestInterview } = await supabase
      .from('interview')
      .select('rating_overall, rating_tech, rating_comm, feedback, created_at')
      .eq('student_id', params.id)
      .eq('recruiter_id', appUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let resumeUrl = null
    if (signedResume && student.resume_path) {
      // Generate signed URL with short TTL (5 minutes)
      const { data, error: urlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(student.resume_path, 300) // 5 minutes

      if (!urlError && data) {
        resumeUrl = data.signedUrl
      }
    }

    return NextResponse.json({
      ...student,
      latestInterview: latestInterview || null,
      resumeUrl
    })
  } catch (error) {
    console.error('Recruiter student GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
