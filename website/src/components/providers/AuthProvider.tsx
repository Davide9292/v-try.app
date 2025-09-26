'use client'

import { AuthProvider as AuthProviderHook } from '@/hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AuthProviderHook>{children}</AuthProviderHook>
}
