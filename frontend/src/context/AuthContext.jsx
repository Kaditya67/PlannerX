import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../api/index.js"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const { data } = await authAPI.getMe()
          setUser(data.user)
        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    const { token, user } = data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (userData) => {
    const { data } = await authAPI.register(userData)
    const { token, user } = data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setUser(user)
    return user
  }

  const demoLogin = async () => {
    const { data } = await authAPI.demoLogin()
    const { token, user } = data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Continue with logout even if API fails
    }
    // Clear auth credentials and any user-specific cached local state
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("planner_focus_timer_state")
    localStorage.removeItem("planner_custom_timer_durations")
    setUser(null)
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, loading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
