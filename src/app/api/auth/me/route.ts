import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClientOnly()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    const { data: appUser } = await supabase
      .from('app_user')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    return NextResponse.json({ user: appUser })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}
