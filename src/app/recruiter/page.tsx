import { redirect } from 'next/navigation'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { RecruiterDashboard } from '@/components/recruiter/RecruiterDashboard'

async function getInitialStudents() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/recruiter/students?page=1&pageSize=20`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return { items: [], total: 0 }
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch initial students:', error)
    return { items: [], total: 0 }
  }
}

export default async function RecruiterPage() {
  // Server-side recruiter/admin guard
  const supabase = await createServerClientOnly()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: appUser } = await supabase
    .from('app_user')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!appUser || !['recruiter', 'admin'].includes(appUser.role)) {
    redirect('/')
  }

  // Fetch initial students data
  const initialStudents = await getInitialStudents()

  return <RecruiterDashboard initialStudents={initialStudents} />
}
