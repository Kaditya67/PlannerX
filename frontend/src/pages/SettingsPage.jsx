import { useState } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { useTheme } from "../context/ThemeContext.jsx"
import { useToast } from "../context/ToastContext.jsx"
import { authAPI } from "../api/index.js"
import { User, Palette, Bell, Shield, Moon, Sun, Monitor } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.jsx"
import { cn } from "../utils/helpers.js"

function SettingsPage() {
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await authAPI.updateProfile(profileForm)
      setUser(data.user)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success("Password changed successfully")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun, description: "Light theme" },
    { value: "dark", label: "Dark", icon: Moon, description: "Dark theme" },
    { value: "system", label: "System", icon: Monitor, description: "Follow system preference" },
  ]

  const getResolvedTheme = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your name"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="your@email.com"
                    disabled
                    className="bg-muted/50 border-input"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <Button type="submit" loading={loading} className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Appearance</CardTitle>
                  <CardDescription>Customize the interface theme</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Current Theme</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {theme === "system" 
                      ? "Using system preference" 
                      : theme === "dark" 
                        ? "Dark mode enabled" 
                        : "Light mode enabled"}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = theme === option.value
                    const isSystemActive = theme === "system" && option.value === getResolvedTheme()
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-lg border p-4 transition-all hover:bg-accent",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "rounded-lg p-2",
                          isActive ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{option.label}</p>
                            {isActive && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                Active
                              </span>
                            )}
                            {isSystemActive && theme === "system" && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Security</CardTitle>
                  <CardDescription>Manage your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="bg-background border-input"
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage