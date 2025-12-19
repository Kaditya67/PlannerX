import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext.jsx"

// Layouts
import MainLayout from "./layouts/MainLayout.jsx"
import AuthLayout from "./layouts/AuthLayout.jsx"

// Pages
import LoginPage from "./pages/auth/LoginPage.jsx"
import RegisterPage from "./pages/auth/RegisterPage.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import WorkspacesPage from "./pages/WorkspacesPage.jsx"
import WorkspacePage from "./pages/WorkspacePage.jsx"
import PlanPage from "./pages/PlanPage.jsx"
import EditPlanPage from "./pages/EditPlanPage.jsx" 
import CalendarPage from "./pages/CalendarPage.jsx"
import FocusPage from "./pages/FocusPage.jsx"
import SettingsPage from "./pages/SettingsPage.jsx"

// Components
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx"
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx"

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
        <Route path="/plans/:planId" element={<PlanPage />} />
        <Route path="/plans/:planId/edit" element={<EditPlanPage />} /> {/* Add this route */}
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App