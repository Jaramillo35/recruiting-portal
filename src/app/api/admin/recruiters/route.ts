import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { z } from 'zod'

const inviteRecruiterSchema = z.object({
  email: z.string().email('Invalid email address')
})

// GET /api/admin/recruiters - List recruiters
export async function GET() {
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

    // Get all recruiters
    const { data: recruiters, error } = await supabase
      .from('app_user')
      .select(`
        auth_user_id,
        role,
        created_at,
        auth_user:auth_user_id (
          email,
          user_metadata
        )
      `)
      .eq('role', 'recruiter')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recruiters:', error)
      return NextResponse.json({ error: 'Failed to fetch recruiters' }, { status: 500 })
    }

    return NextResponse.json(recruiters || [])
  } catch (error) {
    console.error('Recruiters GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/recruiters - Add/Invite recruiter
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email } = inviteRecruiterSchema.parse(body)

    // Try to create new user and invite
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: 'recruiter' }
    })

    if (createError) {
      // If user already exists, try to update their role
      if (createError.message.includes('already registered')) {
        // Find the existing user by email
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)
        
        if (existingUser) {
          // Update app_user role to recruiter
          const { error: updateError } = await supabase
            .from('app_user')
            .update({ role: 'recruiter' })
            .eq('auth_user_id', existingUser.id)

          if (updateError) {
            console.error('Error updating user role:', updateError)
            return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
          }

          return NextResponse.json({ message: 'User promoted to recruiter' })
        }
      }
      
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Update app_user role to recruiter for new user
    const { error: updateError } = await supabase
      .from('app_user')
      .update({ role: 'recruiter' })
      .eq('auth_user_id', newUser.user.id)

    if (updateError) {
      console.error('Error updating app_user role:', updateError)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Recruiter invited successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Recruiters POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/recruiters - Demote recruiter to student
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Demote recruiter to student
    const { error } = await supabase
      .from('app_user')
      .update({ role: 'student' })
      .eq('auth_user_id', id)

    if (error) {
      console.error('Error demoting recruiter:', error)
      return NextResponse.json({ error: 'Failed to demote recruiter' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Recruiter demoted to student' })
  } catch (error) {
    console.error('Recruiters DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
