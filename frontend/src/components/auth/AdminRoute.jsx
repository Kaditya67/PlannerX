import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext.jsx"

function AdminRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== "admin" && user.role !== "devadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Admin Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            This administration portal is only accessible to users with administrator privileges.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute
