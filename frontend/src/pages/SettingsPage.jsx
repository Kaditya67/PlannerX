import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { useTheme } from "../context/ThemeContext.jsx"
import { useToast } from "../context/ToastContext.jsx"
import { authAPI } from "../api/index.js"
import { User, Palette, Shield, Moon, Sun, Monitor, Zap, KeyRound, Check, Sparkles, LayoutDashboard, Folder, Calendar, Target, Compass } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import Avatar from "../components/ui/Avatar.jsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.jsx"
import { cn } from "../utils/helpers.js"

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance & Navigation", icon: Palette },
  { id: "focus", label: "Focus & Timer", icon: Zap },
  { id: "security", label: "Security", icon: Shield },
]

function SettingsPage() {
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
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
    { value: "light", label: "Light", icon: Sun, description: "Crisp bright appearance" },
    { value: "dark", label: "Dark", icon: Moon, description: "Deep midnight interface" },
    { value: "system", label: "System", icon: Monitor, description: "Sync with your OS setting" },
  ]

  const defaultTabOptions = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "High-level metrics, recent plans & workspaces" },
    { value: "focus", label: "Focus Timer", icon: Target, description: "Jump straight into Pomodoro work session" },
    { value: "workspaces", label: "Workspaces", icon: Folder, description: "Browse workspaces and project roadmaps" },
    { value: "calendar", label: "Calendar", icon: Calendar, description: "Daily & monthly activity logs and schedules" },
  ]

  const [selectedDefaultTab, setSelectedDefaultTab] = useState(
    user?.preferences?.defaultTab || "dashboard"
  )

  // Keep in sync if user changes
  useEffect(() => {
    if (user?.preferences?.defaultTab) {
      setSelectedDefaultTab(user.preferences.defaultTab)
    }
  }, [user?.preferences?.defaultTab])

  const handleDefaultTabChange = async (newTab) => {
    // 1. Instant optimistic UI feedback
    setSelectedDefaultTab(newTab)

    try {
      const updatedPreferences = {
        ...user?.preferences,
        defaultTab: newTab,
      }
      const res = await authAPI.updateProfile({ preferences: updatedPreferences })
      const updatedUser = res.data?.user || res.user || { ...user, preferences: updatedPreferences }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      toast.success(`Default landing page set to ${newTab.charAt(0).toUpperCase() + newTab.slice(1)}`)
    } catch (error) {
      // Revert on error
      setSelectedDefaultTab(user?.preferences?.defaultTab || "dashboard")
      toast.error(error.message || "Failed to update default landing page")
    }
  }

  const getResolvedTheme = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }

  const currentDefaultTab = selectedDefaultTab

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your identity, theme styling, and focus timer presets</p>
          </div>

          <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-2 rounded-xl shadow-xs self-start sm:self-auto">
            <Avatar name={user?.name} size="sm" className="ring-2 ring-emerald-500/20" />
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mb-8 flex flex-wrap gap-2 p-1 rounded-xl bg-card border border-border w-fit">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="space-y-6">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Card Overview */}
              <Card className="md:col-span-1 border-border">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2">
                    <Avatar name={user?.name} size="xl" className="ring-4 ring-primary/10 shadow-sm" />
                  </div>
                  <CardTitle className="text-base text-foreground">{user?.name}</CardTitle>
                  <CardDescription className="text-xs">{user?.email}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-center border-t border-border mt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Planner Pro Member
                  </span>
                </CardContent>
              </Card>

              {/* Edit Details */}
              <Card className="md:col-span-2 border-border">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">Profile Information</CardTitle>
                      <CardDescription className="text-xs">Update your display name and view account details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Full Name</label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your name"
                        className="bg-card border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Address</label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-accent/40 border-border text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-[11px] text-muted-foreground">Contact support to change your account email.</p>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" loading={loading} className="bg-primary text-primary-foreground">
                        Save Profile Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <Card className="max-w-2xl border-border">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground">Theme & Interface</CardTitle>
                    <CardDescription className="text-xs">Select your preferred color theme across all devices</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = theme === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "relative flex flex-col items-center text-center p-4 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                            : "border-border hover:bg-accent/50 hover:border-border/80"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mb-3",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-xs text-foreground">{option.label}</span>
                        <span className="text-[11px] text-muted-foreground mt-1 leading-tight">{option.description}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Default Landing Tab Section */}
            <Card className="max-w-2xl border-border">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground">Default Landing View</CardTitle>
                    <CardDescription className="text-xs">Choose which tab opens immediately when you log in or visit Planner</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {defaultTabOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = currentDefaultTab === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDefaultTabChange(option.value)}
                        className={cn(
                          "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-600 bg-emerald-500/10 dark:border-emerald-500 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-sm"
                            : "border-border bg-card hover:bg-accent/50 hover:border-border/80"
                        )}
                      >
                        {/* Radio Checkmark Indicator Badge */}
                        <div className="absolute top-3 right-3 flex items-center justify-center">
                          {isSelected ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs animate-in zoom-in-75">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />
                          )}
                        </div>

                        {/* Icon Container */}
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors",
                          isSelected 
                            ? "bg-emerald-600 text-white dark:bg-emerald-500" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Text description */}
                        <div className="pr-6">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-xs tracking-tight",
                              isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                            )}>
                              {option.label}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                                Active Default
                              </span>
                            )}
                            {option.value === "focus" && !isSelected && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                Deep Work
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{option.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  💡 Tip: If you frequently use Planner for Pomodoro & task execution sessions, selecting <strong className="text-foreground">Focus Timer</strong> lets you bypass the dashboard and enter deep work mode right away.
                </p>
              </CardContent>
            </Card>
          </div>
          )}

          {/* FOCUS TAB */}
          {activeTab === "focus" && <FocusSettingsCard />}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <Card className="max-w-xl border-border">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground">Password & Credentials</CardTitle>
                    <CardDescription className="text-xs">Update your password to keep your workspace secure</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Current Password</label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" loading={loading} className="w-full sm:w-auto">
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function FocusSettingsCard() {
  const { toast } = useToast()
  const SETTINGS_KEY = "planner_custom_timer_durations"

  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY))
      return {
        pomodoroWork: saved?.pomodoroWork ?? 25,
        pomodoroBreak: saved?.pomodoroBreak ?? 5,
        pomodoroLongBreak: saved?.pomodoroLongBreak ?? 15,
        deepWork: saved?.deepWork ?? 90,
        deepBreak: saved?.deepBreak ?? 20,
        shortWork: saved?.shortWork ?? 15,
        shortBreak: saved?.shortBreak ?? 3,
      }
    } catch {
      return {
        pomodoroWork: 25,
        pomodoroBreak: 5,
        pomodoroLongBreak: 15,
        deepWork: 90,
        deepBreak: 20,
        shortWork: 15,
        shortBreak: 3,
      }
    }
  })

  const handleSave = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(form))
      toast.success("Focus timer preferences saved")
    } catch {
      toast.error("Failed to save timer preferences")
    }
  }

  const handleResetDefaults = () => {
    const defaults = {
      pomodoroWork: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      deepWork: 90,
      deepBreak: 20,
      shortWork: 15,
      shortBreak: 3,
    }
    setForm(defaults)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults))
    toast.info("Timer reset to standard presets")
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-foreground">Focus & Timer Durations</CardTitle>
              <CardDescription>Customize standard focus work time and break intervals in minutes</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetDefaults} className="text-xs text-muted-foreground">
            Reset Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 p-3 rounded-lg border border-border bg-card/50">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Pomodoro Mode</p>
              <div>
                <label className="text-xs text-muted-foreground">Work (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={form.pomodoroWork}
                  onChange={(e) => setForm({ ...form, pomodoroWork: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Short Break (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={form.pomodoroBreak}
                  onChange={(e) => setForm({ ...form, pomodoroBreak: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Long Break (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={form.pomodoroLongBreak}
                  onChange={(e) => setForm({ ...form, pomodoroLongBreak: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-border bg-card/50">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Deep Work Mode</p>
              <div>
                <label className="text-xs text-muted-foreground">Work (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={form.deepWork}
                  onChange={(e) => setForm({ ...form, deepWork: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Break (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={form.deepBreak}
                  onChange={(e) => setForm({ ...form, deepBreak: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-border bg-card/50">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Short Sprint Mode</p>
              <div>
                <label className="text-xs text-muted-foreground">Work (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={form.shortWork}
                  onChange={(e) => setForm({ ...form, shortWork: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Break (min)</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={form.shortBreak}
                  onChange={(e) => setForm({ ...form, shortBreak: Number(e.target.value) })}
                  className="mt-1 bg-background"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Timer Preferences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default SettingsPage