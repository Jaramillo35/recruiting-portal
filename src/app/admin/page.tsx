import { redirect } from 'next/navigation'
import { createServerClientOnly } from '@/lib/supabaseServerOnly'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

async function getEventData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/event`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return { events: [], activeEvent: null }
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch event data:', error)
    return { events: [], activeEvent: null }
  }
}

export default async function AdminPage() {
  // Server-side admin guard
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

  if (!appUser || appUser.role !== 'admin') {
    redirect('/')
  }

  // Fetch initial event data
  const eventData = await getEventData()

  return <AdminDashboard initialEventData={eventData} />
}
