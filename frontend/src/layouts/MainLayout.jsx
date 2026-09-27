import { useState, useRef, useEffect } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { useTheme } from "../context/ThemeContext.jsx"
import { useLocalStorage } from "../hooks/useLocalStorage.js"
import {
  Layers,
  LayoutDashboard,
  Folder,
  Calendar,
  Target,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Avatar from "../components/ui/Avatar.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { cn } from "../utils/helpers.js"

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/workspaces", icon: Folder, label: "Workspaces" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/focus", icon: Target, label: "Focus" },
  { path: "/settings", icon: Settings, label: "Settings" },
]

function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme, isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useLocalStorage("planner_sidebar_collapsed", false) // Desktop collapsed mode
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  // Get active nav item for mobile header title
  const activeNavItem = navItems.find(item => location.pathname.startsWith(item.path))

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Desktop Only (Mobile uses bottom navigation) */}
      <aside
        className={cn(
          "hidden lg:flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:static lg:z-30 lg:shadow-none dark:border-gray-800 dark:bg-gray-900",
          isCollapsed ? "lg:w-16" : "lg:w-56"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex h-14 items-center border-b border-gray-200 dark:border-gray-800 transition-all",
          isCollapsed ? "justify-center px-0 w-full" : "justify-between px-3.5"
        )}>
          {/* Collapsed State: Perfectly Centered Clickable Logo */}
          {isCollapsed ? (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Planner - Click to expand sidebar"
              aria-label="Expand sidebar"
            >
              <Layers className="h-5 w-5 text-white" />
            </button>
          ) : (
            <>
              {/* Expanded State: Logo + Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 shadow-sm">
                  <Layers className="h-4.5 w-4.5 text-white shrink-0" />
                </div>
                <span className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  Planner
                </span>
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive: navActive }) =>
                  cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                    isCollapsed ? "lg:justify-center lg:px-2 py-2 px-2.5 gap-3" : "gap-3 px-3 py-2.5",
                    "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                    navActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!isCollapsed && isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Section & Expand Action */}
        <div className="shrink-0 border-t border-gray-200 p-3 space-y-2 dark:border-gray-800">
          {/* Desktop Expand Toggle when collapsed */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              ref={triggerRef}
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              title={isCollapsed ? (user?.name || "User") : undefined}
              className={cn(
                "flex w-full items-center rounded-lg p-2 transition-all duration-200",
                isCollapsed ? "lg:justify-center gap-0" : "gap-3",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                userDropdownOpen && "bg-gray-100 dark:bg-gray-800"
              )}
              aria-expanded={userDropdownOpen}
              aria-haspopup="true"
            >
              <Avatar 
                name={user?.name} 
                size="sm"
                className="shrink-0 ring-2 ring-offset-2 ring-transparent group-hover:ring-emerald-500/20"
              />
              {!isCollapsed && (
                <>
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.name || "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0",
                    userDropdownOpen && "rotate-180"
                  )} />
                </>
              )}
            </button>

            {/* Custom Dropdown */}
            {userDropdownOpen && (
              <div className={cn(
                "absolute rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 z-50 overflow-hidden",
                isCollapsed 
                  ? "left-full bottom-0 ml-2.5 w-52" 
                  : "bottom-full left-0 right-0 mb-2"
              )}>
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTheme()
                      setUserDropdownOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm
                              text-gray-700 hover:bg-gray-50
                              dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isDark ? (
                      <>
                        <Sun className="h-4 w-4 text-amber-500" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 text-blue-500" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate("/settings")
                      setUserDropdownOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLogout()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm lg:hidden dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 shadow-xs">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {activeNavItem?.label || "Planner"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-500" />
              )}
            </Button>
            <button
              onClick={() => navigate("/settings")}
              className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center"
              title="Settings"
            >
              <Avatar name={user?.name} size="sm" />
            </button>
          </div>
        </header>

        {/* Page Content with bottom padding on mobile for the fixed tab bar */}
        <main className="flex-1 overflow-auto p-4 pb-20 lg:p-6 lg:pb-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-gray-800 dark:bg-gray-900/95">
          <nav className="flex items-center justify-around px-2 py-1.5 safe-bottom">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 transition-colors",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default MainLayout