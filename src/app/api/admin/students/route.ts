import { NextRequest, NextResponse } from 'next/server'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'

// GET /api/admin/students - List students with filters and pagination
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
    const university = searchParams.get('university') || ''
    const degree = searchParams.get('degree') || ''
    const gpaMin = searchParams.get('gpaMin')
    const gpaMax = searchParams.get('gpaMax')
    const hasResume = searchParams.get('hasResume')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build query
    let query = supabase
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
      .eq('app_user.role', 'student')

    // Apply filters
    if (university) {
      query = query.ilike('university', `%${university}%`)
    }
    if (degree) {
      query = query.ilike('degree', `%${degree}%`)
    }
    if (gpaMin) {
      query = query.gte('gpa', parseFloat(gpaMin))
    }
    if (gpaMax) {
      query = query.lte('gpa', parseFloat(gpaMax))
    }
    if (hasResume === 'true') {
      query = query.not('resume_path', 'is', null)
    } else if (hasResume === 'false') {
      query = query.is('resume_path', null)
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: students, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    return NextResponse.json({
      students: students || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (error) {
    console.error('Students GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/students - Delete student
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
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Get student's auth_user_id for cascading delete
    const { data: student } = await supabase
      .from('student')
      .select('app_user_id')
      .eq('id', id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete student record (this will cascade to interviews due to foreign key)
    const { error: studentError } = await supabase
      .from('student')
      .delete()
      .eq('id', id)

    if (studentError) {
      console.error('Error deleting student:', studentError)
      return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
    }

    // Delete app_user record
    const { error: appUserError } = await supabase
      .from('app_user')
      .delete()
      .eq('id', student.app_user_id)

    if (appUserError) {
      console.error('Error deleting app_user:', appUserError)
      return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 })
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(student.app_user_id)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Students DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
