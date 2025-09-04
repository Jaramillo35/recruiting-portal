import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received:', { code: code ? 'present' : 'missing', origin, next })

  if (code) {
    try {
      const supabase = await createServerClientOnly()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_error`)
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Ensure app_user exists
        const { error: upsertError } = await supabase
          .from('app_user')
          .upsert(
            { auth_user_id: user.id, role: 'student' },
            { onConflict: 'auth_user_id' }
          )
        
        if (upsertError) {
          console.error('Error upserting app_user:', upsertError)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
