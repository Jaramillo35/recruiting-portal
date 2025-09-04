import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'

// GET /api/admin/resume-url - Get signed URL for resume download
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClientOnly()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: appUser } = await supabase
      .from('app_user')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!appUser || appUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Resume path is required' }, { status: 400 })
    }

    // Generate signed URL with short TTL (5 minutes)
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(path, 300) // 5 minutes

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('Resume URL GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
