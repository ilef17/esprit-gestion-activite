import { createContext, useContext, useState, useCallback } from 'react'
import { loginRequest, signupRequest } from '../services/api.js'

const AuthContext = createContext(null)

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('arp_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser())
  const [role, setRole] = useState(localStorage.getItem('arp_role') || null)

  const persistSession = useCallback((data) => {
    localStorage.setItem('arp_token', data.token)
    localStorage.setItem('arp_role', data.role)
    localStorage.setItem('arp_user', JSON.stringify(data.user))
    setUser(data.user)
    setRole(data.role)
  }, [])

  const login = useCallback(async ({ role, login, password, captchaToken }) => {
  const data = await loginRequest({ role, login, password, captchaToken })
  persistSession(data)
  return data
}, [persistSession])

  const signup = useCallback(async (payload) => {
    const data = await signupRequest(payload)
    persistSession(data)
    return data
  }, [persistSession])

  const logout = useCallback(() => {
    localStorage.removeItem('arp_token')
    localStorage.removeItem('arp_role')
    localStorage.removeItem('arp_user')
    setUser(null)
    setRole(null)
  }, [])

  // Fusionne des champs modifiés (ex. nom/email) dans l'utilisateur stocké, sans
  // repasser par un login — utilisé après une édition réussie de "Mon profil".
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial }
      localStorage.setItem('arp_user', JSON.stringify(next))
      return next
    })
  }, [])

  const value = { user, role, login, signup, logout, updateUser, isAuthenticated: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}