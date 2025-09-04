import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireRoleOrHigher } from '@/lib/auth'
import { interviewFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRoleOrHigher('recruiter')
    const body = await request.json()
    const validatedData = interviewFormSchema.parse(body)

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

    // Verify student exists and belongs to active event
    const { data: student, error: studentError } = await supabase
      .from('student')
      .select('id')
      .eq('id', validatedData.student_id)
      .eq('event_id', activeEvent.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found in active event' }, { status: 400 })
    }

    // Create interview
    const { data, error } = await supabase
      .from('interview')
      .insert({
        event_id: activeEvent.id,
        student_id: validatedData.student_id,
        recruiter_id: user.id,
        rating_overall: validatedData.rating_overall,
        rating_tech: validatedData.rating_tech,
        rating_comm: validatedData.rating_comm,
        feedback: validatedData.feedback
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
