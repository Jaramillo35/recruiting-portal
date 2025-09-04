import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { studentFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit applications' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = studentFormSchema.parse(body)

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

    // Upsert student profile
    const { data, error } = await supabase
      .from('student')
      .upsert(
        {
          id: user.id,
          event_id: activeEvent.id,
          ...validatedData
        },
        { onConflict: 'id' }
      )
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view their profile' }, { status: 403 })
    }

    const supabase = await createServerClientOnly()

    const { data, error } = await supabase
      .from('student')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
