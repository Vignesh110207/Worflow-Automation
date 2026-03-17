import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('ff_token'))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (t) => {
    try {
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      setUser(res.data.data)
    } catch {
      setToken(null); setUser(null)
      localStorage.removeItem('ff_token')
    }
  }, [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchMe(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, fetchMe])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data.data
    localStorage.setItem('ff_token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t); setUser(u)
    return u
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const { token: t, user: u } = res.data.data
    localStorage.setItem('ff_token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t); setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('ff_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null); setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const isDev   = user?.role === 'developer' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isDev }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
