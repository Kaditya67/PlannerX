import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import Button from "../../components/ui/Button.jsx"
import Input from "../../components/ui/Input.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/Card.jsx"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, demoLogin, register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/dashboard"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const loggedUser = await login({ email, password })
      toast.success("Welcome back!")
      const targetPath =
        from && from !== "/dashboard" && from !== "/"
          ? from
          : loggedUser?.preferences?.defaultTab
          ? `/${loggedUser.preferences.defaultTab}`
          : "/dashboard"
      window.location.href = targetPath
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              className="w-full py-2.5 text-base font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {/* 1-Click Demo Testing Button */}
            <div className="relative w-full my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                  Quick Access
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-2.5 border-dashed border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300 font-medium"
              disabled={loading}
              onClick={async () => {
                setEmail("demo@planner.com")
                setPassword("password123")
                setLoading(true)
                try {
                  const loggedUser = await demoLogin()
                  toast.success("Logged in as Demo User!")
                  const targetPath =
                    from && from !== "/dashboard" && from !== "/"
                      ? from
                      : loggedUser?.preferences?.defaultTab
                      ? `/${loggedUser.preferences.defaultTab}`
                      : "/dashboard"
                  window.location.href = targetPath
                } catch (err) {
                  toast.error(err.message || "Failed to log in with demo account")
                } finally {
                  setLoading(false)
                }
              }}
            >
              ⚡ 1-Click Demo Login
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
              Don't have an account?{" "}
              <Link 
                to="/register" 
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage