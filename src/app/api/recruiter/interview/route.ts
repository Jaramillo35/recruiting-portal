import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { z } from 'zod'

const interviewSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  rating_overall: z.number().min(1).max(5),
  rating_tech: z.number().min(1).max(5),
  rating_comm: z.number().min(1).max(5),
  feedback: z.string().min(1, 'Feedback is required')
})

// POST /api/recruiter/interview - Create or update interview
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = interviewSchema.parse(body)

    // Get active event
    const { data: activeEvent } = await supabase
      .from('recruiting_event')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!activeEvent) {
      return NextResponse.json({ error: 'No active recruiting event' }, { status: 400 })
    }

    // Verify student exists and belongs to active event
    const { data: student } = await supabase
      .from('student')
      .select('id, event_id')
      .eq('id', validatedData.student_id)
      .eq('event_id', activeEvent.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found or not in active event' }, { status: 404 })
    }

    // Upsert interview (update if exists, insert if not)
    const { data: interview, error: interviewError } = await supabase
      .from('interview')
      .upsert({
        event_id: activeEvent.id,
        student_id: validatedData.student_id,
        recruiter_id: appUser.id,
        rating_overall: validatedData.rating_overall,
        rating_tech: validatedData.rating_tech,
        rating_comm: validatedData.rating_comm,
        feedback: validatedData.feedback
      }, {
        onConflict: 'event_id,student_id,recruiter_id'
      })
      .select()
      .single()

    if (interviewError) {
      console.error('Error upserting interview:', interviewError)
      return NextResponse.json({ error: 'Failed to save interview' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Interview saved successfully',
      interview
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Recruiter interview POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
