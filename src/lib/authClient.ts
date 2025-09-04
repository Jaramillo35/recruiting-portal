export type Role = 'student' | 'recruiter' | 'admin'

export interface AppUser {
  id: string
  auth_user_id: string
  role: Role
  created_at: string
}

export async function getUserFromAPI(): Promise<AppUser | null> {
  try {
    const response = await fetch('/api/auth/me')
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}

export function requireAuthClient(): Promise<AppUser> {
  return new Promise((resolve, reject) => {
    getUserFromAPI().then(user => {
      if (user) {
        resolve(user)
      } else {
        reject(new Error('Not authenticated'))
      }
    })
  })
}
