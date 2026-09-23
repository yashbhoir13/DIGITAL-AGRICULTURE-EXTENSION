import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '../services/api'

type AuthState = {
  token: string | null
  role: string | null
  fullName: string | null
  email: string | null
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'))
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'))
  const [email, setEmail] = useState<string | null>(localStorage.getItem('email'))

  const value = useMemo<AuthState>(
    () => ({
      token,
      role,
      fullName,
      email,
      async login(emailIn, password) {
        const data = await apiLogin(emailIn, password)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('fullName', data.full_name)
        localStorage.setItem('email', data.email)
        setToken(data.access_token)
        setRole(data.role)
        setFullName(data.full_name)
        setEmail(data.email)
      },
      async register(fullNameIn, emailIn, password) {
        await apiRegister(fullNameIn, emailIn, password)
        const data = await apiLogin(emailIn, password)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('fullName', data.full_name)
        localStorage.setItem('email', data.email)
        setToken(data.access_token)
        setRole(data.role)
        setFullName(data.full_name)
        setEmail(data.email)
      },
      logout() {
        localStorage.clear()
        setToken(null)
        setRole(null)
        setFullName(null)
        setEmail(null)
      },
    }),
    [token, role, fullName, email],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
