import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createEventSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin')
    const body = await request.json()
    
    if (body.action === 'close') {
      // Close active event
      const supabase = await createServerClientOnly()
      
      const { error } = await supabase
        .from('recruiting_event')
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq('is_active', true)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    } else {
      // Create new event
      const validatedData = createEventSchema.parse(body)
      const supabase = await createServerClientOnly()

      // Deactivate all existing events
      await supabase
        .from('recruiting_event')
        .update({ is_active: false })
        .eq('is_active', true)

      // Create new active event
      const { data, error } = await supabase
        .from('recruiting_event')
        .insert({
          name: validatedData.name,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('admin')
    const supabase = await createServerClientOnly()

    // Get all events
    const { data: events, error } = await supabase
      .from('recruiting_event')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Get active event with metrics
    const activeEvent = events?.find(event => event.is_active)
    
    if (activeEvent) {
      // Get student count for active event
      const { count: studentCount } = await supabase
        .from('student')
        .select('*', { count: 'exact', head: true })

      // Get total interviews count
      const { count: interviewCount } = await supabase
        .from('interview')
        .select('*', { count: 'exact', head: true })

      return NextResponse.json({
        events,
        activeEvent: {
          ...activeEvent,
          studentCount: studentCount || 0,
          interviewCount: interviewCount || 0
        }
      })
    }

    return NextResponse.json({
      events,
      activeEvent: null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
