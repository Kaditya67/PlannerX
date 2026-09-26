import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage or system preference
    if (typeof window === "undefined") return "system"
    
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") {
      return saved
    }
    
    // If system preference or no saved theme
    return "system"
  })

  useEffect(() => {
    const root = document.documentElement
    
    // Remove previous theme classes
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemPrefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.add("light")
      }
    } else {
      // Apply selected theme
      root.classList.add(theme)
    }
    
    // Save to localStorage if not system
    if (theme !== "system") {
      localStorage.setItem("theme", theme)
    } else {
      localStorage.removeItem("theme") // Remove to default to system
    }
  }, [theme])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      const root = document.documentElement
      root.classList.remove("light", "dark")
      
      if (mediaQuery.matches) {
        root.classList.add("dark")
      } else {
        root.classList.add("light")
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  // Determine whether effective theme is dark
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}