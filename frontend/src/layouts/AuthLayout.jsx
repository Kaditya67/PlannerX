import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { Layers } from "lucide-react"

function AuthLayout() {
  const { user } = useAuth()

  // Auth guard
  if (user) {
    const defaultPath = user?.preferences?.defaultTab ? `/${user.preferences.defaultTab}` : "/dashboard"
    return <Navigate to={defaultPath} replace />
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left branding panel */}
      <aside className="hidden w-1/2 flex-col justify-between bg-emerald-600 p-12 lg:flex dark:bg-emerald-700">
        <div className="flex items-center gap-3 text-white">
          <Layers className="h-8 w-8" />
          <span className="text-2xl font-bold">Planner</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Plan. Structure. Execute.
          </h1>
          <p className="text-lg text-white/80">
            A scenario-driven planning system to structure, group, schedule,
            and execute work with clarity.
          </p>
        </div>

        <p className="text-sm text-white/60">
          © 2025 Planner. All rights reserved.
        </p>
      </aside>

      {/* Right auth content */}
      <main className="flex flex-1 items-center justify-center bg-white px-6 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
