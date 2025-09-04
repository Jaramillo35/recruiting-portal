'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppUser, Role } from '@/lib/authClient'

interface GuardProps {
  user: AppUser | null
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Guard({ user, allowedRoles, children, fallback }: GuardProps) {
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!allowedRoles.includes(user.role)) {
      router.push('/')
      return
    }
  }, [user, allowedRoles, router])

  if (!user) {
    return fallback || <div>Redirecting to login...</div>
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || <div>Access denied</div>
  }

  return <>{children}</>
}
