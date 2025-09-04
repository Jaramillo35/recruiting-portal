import { createServerClientOnly } from './supabaseServerOnly'
import { redirect } from 'next/navigation'

export type Role = 'student' | 'recruiter' | 'admin'

export interface AppUser {
  id: string
  auth_user_id: string
  role: Role
  created_at: string
}

export async function getUser(): Promise<AppUser | null> {
  const supabase = await createServerClientOnly()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: appUser } = await supabase
    .from('app_user')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return appUser
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireRole(role: Role): Promise<AppUser> {
  const user = await requireAuth()
  if (user.role !== role) {
    redirect('/')
  }
  return user
}

export async function requireRoleOrHigher(role: Role): Promise<AppUser> {
  const user = await requireAuth()
  
  const roleHierarchy: Record<Role, number> = {
    student: 1,
    recruiter: 2,
    admin: 3
  }
  
  if (roleHierarchy[user.role] < roleHierarchy[role]) {
    redirect('/')
  }
  
  return user
}
