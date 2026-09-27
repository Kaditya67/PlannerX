import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { planAPI, itemAPI, sessionAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Target,
  Clock,
  CheckCircle2,
  Zap,
  Coffee,
  RotateCcw,
  Sliders,
  Search,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react"

import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import Modal from "../components/ui/Modal.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"

import { cn, formatDuration } from "../utils/helpers.js"
import { ITEM_STATUS } from "../utils/constants.js"

const SETTINGS_KEY = "planner_custom_timer_durations"
const STORAGE_KEY = "planner_focus_timer_state"

const getTimerDurations = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return {
      POMODORO: {
        work: (saved?.pomodoroWork ?? 25) * 60,
        break: (saved?.pomodoroBreak ?? 5) * 60,
        longBreak: (saved?.pomodoroLongBreak ?? 15) * 60,
      },
      DEEP_WORK: {
        work: (saved?.deepWork ?? 90) * 60,
        break: (saved?.deepBreak ?? 20) * 60,
      },
      SHORT: {
        work: (saved?.shortWork ?? 15) * 60,
        break: (saved?.shortBreak ?? 3) * 60,
      },
    }
  } catch {
    return {
      POMODORO: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 },
      DEEP_WORK: { work: 90 * 60, break: 20 * 60 },
      SHORT: { work: 15 * 60, break: 3 * 60 },
    }
  }
}

function FocusPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [plans, setPlans] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [taskSearch, setTaskSearch] = useState("")
  const [taskPlanFilter, setTaskPlanFilter] = useState("ALL")
  const [isZoomed, setIsZoomed] = useState(false)

  // Listen for Escape key to exit zoomed focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isZoomed])

  // Custom timer durations state
  const [durations, setDurations] = useState(getTimerDurations)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customForm, setCustomForm] = useState(() => {
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

  // Initialize timer state from localStorage or defaults
  const [focusMode, setFocusMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return saved?.focusMode || "POMODORO"
    } catch {
      return "POMODORO"
    }
  })

  const [isWorking, setIsWorking] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return saved?.isWorking !== undefined ? saved.isWorking : true
    } catch {
      return true
    }
  })

  const [timeLeft, setTimeLeft] = useState(() => {
    const curDurations = getTimerDurations()
    const defaultTime = curDurations?.POMODORO?.work || 25 * 60
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!saved) return defaultTime
      if (saved.isRunning && saved.lastTick) {
        const elapsed = Math.floor((Date.now() - saved.lastTick) / 1000)
        const remaining = (saved.timeLeft || 0) - elapsed
        return Number.isFinite(remaining) ? Math.max(0, remaining) : defaultTime
      }
      return Number.isFinite(saved.timeLeft) ? Math.max(0, saved.timeLeft) : defaultTime
    } catch {
      return defaultTime
    }
  })

  const [isRunning, setIsRunning] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (saved?.isRunning && saved?.lastTick) {
        const elapsed = Math.floor((Date.now() - saved.lastTick) / 1000)
        return (saved.timeLeft || 0) - elapsed > 0
      }
      return false
    } catch {
      return false
    }
  })

  const [pomodorosCompleted, setPomodorosCompleted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return saved?.pomodorosCompleted || 0
    } catch {
      return 0
    }
  })

  const timerRef = useRef(null)

  // Sync state to localStorage whenever timer params change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          focusMode,
          isWorking,
          timeLeft,
          isRunning,
          pomodorosCompleted,
          lastTick: Date.now(),
        })
      )
    } catch (e) {
      console.error("Failed to save focus timer state", e)
    }
  }, [focusMode, isWorking, timeLeft, isRunning, pomodorosCompleted])

  /* --------------------------------------------
     Initial load & storage listeners
  --------------------------------------------- */
  useEffect(() => {
    setSelectedItem(null)
    setActiveSession(null)
    fetchData()

    const handleStorageChange = () => {
      const updated = getTimerDurations()
      setDurations(updated)
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [user?._id])

  // If timer was running before refresh, auto-resume it seamlessly
  useEffect(() => {
    if (isRunning && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            timerRef.current = null
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning])

  const resetTimer = (mode = focusMode, customDurations = durations) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
    setIsWorking(true)
    const newTime = customDurations[mode]?.work || 25 * 60
    setTimeLeft(newTime)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          focusMode: mode,
          isWorking: true,
          timeLeft: newTime,
          isRunning: false,
          pomodorosCompleted,
          lastTick: Date.now(),
        })
      )
    } catch {}
  }

  const changeFocusMode = (mode) => {
    setFocusMode(mode)
    resetTimer(mode)
  }

  const handleSaveCustomSettings = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(customForm))
      const updated = getTimerDurations()
      setDurations(updated)
      setSettingsOpen(false)
      resetTimer(focusMode, updated)
      toast.success("Timer durations updated!")
    } catch {
      toast.error("Failed to save durations")
    }
  }

  const fetchData = async () => {
    try {
      const [plansRes, itemsRes] = await Promise.allSettled([
        planAPI.getAll(),
        itemAPI.getAll()
      ])

      const plansData = plansRes.status === "fulfilled" ? plansRes.value.data || [] : []
      setPlans(plansData)

      const planMap = {}
      for (const p of plansData) {
        planMap[p._id] = { name: p.name, color: p.color }
      }

      let allItems = []
      if (itemsRes.status === "fulfilled" && Array.isArray(itemsRes.value.data)) {
        allItems = itemsRes.value.data
      } else {
        // Fallback if items were populated in plan objects
        for (const plan of plansData) {
          if (Array.isArray(plan.items)) {
            allItems.push(...plan.items)
          }
        }
      }

      const pendingItems = allItems
        .filter((item) => item && item.status !== ITEM_STATUS.COMPLETED)
        .map((item) => ({
          ...item,
          planName: planMap[item.plan]?.name || item.planName || "General",
          planColor: planMap[item.plan]?.color || item.planColor || "#10b981",
        }))

      setItems(pendingItems)
    } catch {
      toast.error("Failed to load focus data")
    } finally {
      setLoading(false)
    }
  }

  /* --------------------------------------------
     Timer logic
  --------------------------------------------- */
  const startTimer = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)

    if (isWorking && selectedItem && !activeSession) {
      try {
        const { data } = await sessionAPI.create({
          item: selectedItem._id,
          plan: selectedItem.plan,
        })
        setActiveSession(data)
      } catch {
        toast.error("Failed to start session")
      }
    }
  }, [isRunning, isWorking, selectedItem, activeSession])

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
  }

  const stopTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
    resetTimer()

    if (activeSession) {
      await sessionAPI.update(activeSession._id, { status: "stopped" })
      setActiveSession(null)
    }
  }

  const handleTimerComplete = async () => {
    setIsRunning(false)

    if (isWorking) {
      setPomodorosCompleted((prev) => {
        const next = prev + 1
        const isLongBreak = next % 4 === 0
        const breakDuration = isLongBreak
          ? (durations[focusMode]?.longBreak ?? durations[focusMode]?.break ?? 15 * 60)
          : (durations[focusMode]?.break ?? 5 * 60)

        setTimeLeft(breakDuration)
        setIsWorking(false)
        return next
      })

      toast.success("Focus session completed!")

      if (activeSession) {
        await sessionAPI.update(activeSession._id, { status: "completed" })
        setActiveSession(null)
      }
    } else {
      toast.info("Break over! Back to focus.")
      setTimeLeft(durations[focusMode]?.work || 25 * 60)
      setIsWorking(true)
    }
  }

  const skipToNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
    setIsWorking((prev) => !prev)
    setTimeLeft(
      isWorking
        ? (durations[focusMode]?.break || 5 * 60)
        : (durations[focusMode]?.work || 25 * 60),
    )
  }

  /* --------------------------------------------
     Item actions
  --------------------------------------------- */
  const handleCompleteItem = async (item) => {
    try {
      await itemAPI.update(item._id, { status: ITEM_STATUS.COMPLETED })
      setItems((prev) => prev.filter((i) => i._id !== item._id))
      if (selectedItem?._id === item._id) setSelectedItem(null)
      toast.success("Item completed")
    } catch {
      toast.error("Failed to complete item")
    }
  }

  const formatTime = (seconds) => {
    const validSec = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0)
    const m = Math.floor(validSec / 60)
    const s = validSec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const curWorkSec = durations?.[focusMode]?.work || 25 * 60
  const curBreakSec = durations?.[focusMode]?.break || 5 * 60
  const totalModeSec = isWorking ? curWorkSec : curBreakSec
  const rawProgress = totalModeSec > 0 ? ((totalModeSec - timeLeft) / totalModeSec) * 100 : 0
  const progress = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) : 0

  // Filter tasks by search query and plan selector
  const filteredItems = items.filter((item) => {
    const matchesSearch = !taskSearch.trim() || 
      item.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
      item.planName?.toLowerCase().includes(taskSearch.toLowerCase())
    const matchesPlan = taskPlanFilter === "ALL" || item.plan === taskPlanFilter || item.planName === taskPlanFilter
    return matchesSearch && matchesPlan
  })

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Focus Mode</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay focused and track your work sessions
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsZoomed(true)}
            className="gap-2 text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Expand to Fullscreen Focus Mode (Distraction Free)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Zoom Focus
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="gap-2 text-xs"
            title="Customize timer and break durations"
          >
            <Sliders className="h-3.5 w-3.5" />
            Customize Durations
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* TIMER CARD */}
        <Card className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isWorking ? <Zap className="text-emerald-500" /> : <Coffee className="text-amber-500" />}
                {isWorking ? "Focus Time" : "Break Time"}
              </CardTitle>

              <div className="flex items-center gap-1.5">
                {[
                  { key: "POMODORO", label: `${Math.round((durations.POMODORO?.work || 1500) / 60)}m` },
                  { key: "DEEP_WORK", label: `${Math.round((durations.DEEP_WORK?.work || 5400) / 60)}m` },
                  { key: "SHORT", label: `${Math.round((durations.SHORT?.work || 900) / 60)}m` },
                ].map((mode) => (
                  <Button
                    key={mode.key}
                    size="sm"
                    variant={focusMode === mode.key ? "primary" : "outline"}
                    onClick={() => changeFocusMode(mode.key)}
                    disabled={isRunning}
                    className="h-8 px-2.5 text-xs"
                  >
                    {mode.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 ml-1"
                  onClick={() => setIsZoomed(true)}
                  title="Zoom into Fullscreen Timer"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            {/* Active Task Tag inside Timer */}
            {selectedItem && (
              <div className="mb-4 mx-auto max-w-sm flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: selectedItem.planColor || "#10b981" }} />
                  <span className="font-medium text-foreground truncate">{selectedItem.title}</span>
                  <span className="text-muted-foreground truncate">({selectedItem.planName})</span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 rounded-full hover:bg-accent"
                  title="Deselect task"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="relative mx-auto mb-6 flex h-60 w-60 items-center justify-center p-2">
              <svg 
                className="absolute inset-0 h-full w-full -rotate-90 overflow-visible"
                viewBox="0 0 256 256"
              >
                <circle
                  cx="128"
                  cy="128"
                  r="116"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/40"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="116"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 116}
                  strokeDashoffset={2 * Math.PI * 116 * (1 - progress / 100)}
                  className="text-primary transition-all duration-1000"
                />
              </svg>

              <div className="text-center z-10">
                <p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isWorking ? "Stay focused" : "Relax & recharge"}
                </p>
              </div>
            </div>

            {/* Timer Action Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Reset Button with hover tooltip */}
              <div className="relative group">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95 disabled:opacity-40"
                  onClick={stopTimer}
                  disabled={timeLeft === (isWorking ? durations[focusMode]?.work : durations[focusMode]?.break) && !isRunning}
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded bg-popover px-2 py-0.5 text-[11px] font-medium text-popover-foreground shadow border border-border z-20">
                  Reset Timer
                </div>
              </div>

              {/* Main Play / Pause Button with hover tooltip */}
              <div className="relative group">
                {!isRunning ? (
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95" 
                    onClick={startTimer}
                    title={timeLeft === (isWorking ? durations[focusMode]?.work : durations[focusMode]?.break) ? "Start Focus" : "Resume"}
                  >
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 shadow-sm transition-all hover:scale-105 active:scale-95"
                    onClick={pauseTimer}
                    title="Pause Timer"
                  >
                    <Pause className="h-5 w-5 fill-current" />
                  </Button>
                )}
                <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded bg-popover px-2 py-0.5 text-[11px] font-medium text-popover-foreground shadow border border-border z-20">
                  {!isRunning 
                    ? (timeLeft === (isWorking ? durations[focusMode]?.work : durations[focusMode]?.break) ? "Start Focus" : "Resume") 
                    : "Pause Timer"}
                </div>
              </div>

              {/* Skip to Next Mode Button with hover tooltip */}
              <div className="relative group">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95"
                  onClick={skipToNext}
                  title={isWorking ? "Skip to Break" : "Skip to Work"}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded bg-popover px-2 py-0.5 text-[11px] font-medium text-popover-foreground shadow border border-border z-20">
                  {isWorking ? "Skip to Break" : "Skip to Focus"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMPACT TASK SELECTOR */}
        <Card className="lg:col-span-6 xl:col-span-5 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-emerald-500" />
                Focus Task
              </CardTitle>
              {selectedItem && (
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Search Input & Plan Filter Bar */}
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search task or plan..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 text-xs bg-accent/40"
                />
                {taskSearch && (
                  <button
                    onClick={() => setTaskSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Plan Filter Dropdown */}
              {plans.length > 0 && (
                <select
                  value={taskPlanFilter}
                  onChange={(e) => setTaskPlanFilter(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                >
                  <option value="ALL">All Plans</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-medium text-foreground">
                  {taskSearch.trim() || taskPlanFilter !== "ALL" ? "No matching tasks found" : "No pending tasks"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {taskSearch.trim() ? "Try searching for a different keyword" : "You can still run focus sessions freely"}
                </p>
              </div>
            ) : (
              <div className="max-h-72 space-y-1.5 overflow-y-auto no-scrollbar">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?._id === item._id
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                      className={cn(
                        "group flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-xs transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground font-medium shadow-xs"
                          : "border-border hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.planColor || "#10b981" }}
                          />
                          <span className="truncate">{item.planName}</span>
                        </div>
                      </div>

                      {item.plannedDuration > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.plannedDuration)}
                        </div>
                      )}

                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 transition-opacity",
                        isSelected ? "bg-primary text-primary-foreground opacity-100" : "opacity-0 group-hover:opacity-100 text-muted-foreground bg-accent"
                      )}>
                        {isSelected ? "Active" : "Select"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Distraction-Free Zoomed Focus Overlay */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-background/95 backdrop-blur-md p-6 sm:p-10 select-none animate-in fade-in duration-200">
          {/* Top Bar with Modes & Exit */}
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                isWorking ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
              )}>
                {isWorking ? <Zap className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                {isWorking ? "Deep Focus Time" : "Recharge Break"}
              </div>

              {selectedItem && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/60 border border-border text-xs">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: selectedItem.planColor || "#10b981" }} />
                  <span className="font-medium text-foreground truncate max-w-[200px]">{selectedItem.title}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {[
                  { key: "POMODORO", label: `${Math.round((durations.POMODORO?.work || 1500) / 60)}m` },
                  { key: "DEEP_WORK", label: `${Math.round((durations.DEEP_WORK?.work || 5400) / 60)}m` },
                  { key: "SHORT", label: `${Math.round((durations.SHORT?.work || 900) / 60)}m` },
                ].map((mode) => (
                  <Button
                    key={mode.key}
                    size="sm"
                    variant={focusMode === mode.key ? "primary" : "outline"}
                    onClick={() => changeFocusMode(mode.key)}
                    disabled={isRunning}
                    className="h-8 px-2.5 text-xs"
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-border hover:bg-accent ml-2"
                onClick={() => setIsZoomed(false)}
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          </div>

          {/* Centered Giant Timer Dial */}
          <div className="flex flex-col items-center justify-center my-auto">
            {/* Active task title if selected */}
            {selectedItem && (
              <div className="mb-4 text-center">
                <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">{selectedItem.planName}</span>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">{selectedItem.title}</h2>
              </div>
            )}

            <div className="relative flex h-72 w-72 sm:h-96 sm:w-96 items-center justify-center p-4">
              <svg 
                className="absolute inset-0 h-full w-full -rotate-90 overflow-visible"
                viewBox="0 0 256 256"
              >
                <circle
                  cx="128"
                  cy="128"
                  r="116"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="116"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 116}
                  strokeDashoffset={2 * Math.PI * 116 * (1 - progress / 100)}
                  className="text-primary transition-all duration-1000"
                />
              </svg>

              <div className="text-center z-10">
                <p className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-foreground font-mono">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-2 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  {isWorking ? "Stay Locked In" : "Rest & Recharge"}
                </p>
              </div>
            </div>

            {/* Giant Action Controls */}
            <div className="flex items-center justify-center gap-6 mt-6 sm:mt-10">
              {/* Reset */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95 disabled:opacity-40"
                onClick={stopTimer}
                disabled={timeLeft === (isWorking ? durations[focusMode]?.work : durations[focusMode]?.break) && !isRunning}
                title="Reset Timer"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {/* Play / Pause */}
              {!isRunning ? (
                <Button 
                  size="icon" 
                  className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95" 
                  onClick={startTimer}
                  title="Start / Resume Focus"
                >
                  <Play className="h-7 w-7 fill-current ml-1" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 shadow-md transition-all hover:scale-105 active:scale-95"
                  onClick={pauseTimer}
                  title="Pause Timer"
                >
                  <Pause className="h-7 w-7 fill-current" />
                </Button>
              )}

              {/* Skip */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-95"
                onClick={skipToNext}
                title={isWorking ? "Skip to Break" : "Skip to Work"}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="text-center text-xs text-muted-foreground/60 pb-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground">Esc</kbd> anytime to exit zoom focus
          </div>
        </div>
      )}

      {/* Quick Custom Timer Durations Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Customize Focus & Break Durations"
        size="md"
      >
        <form onSubmit={handleSaveCustomSettings} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Adjust the work time and break intervals in minutes to match your focus preference.
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 space-y-2 bg-card/50">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Pomodoro Mode</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Work (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={customForm.pomodoroWork}
                    onChange={(e) => setCustomForm({ ...customForm, pomodoroWork: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Break (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={customForm.pomodoroBreak}
                    onChange={(e) => setCustomForm({ ...customForm, pomodoroBreak: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Long Break</label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={customForm.pomodoroLongBreak}
                    onChange={(e) => setCustomForm({ ...customForm, pomodoroLongBreak: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2 bg-card/50">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Deep Work & Sprint</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Deep Work (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="240"
                    value={customForm.deepWork}
                    onChange={(e) => setCustomForm({ ...customForm, deepWork: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Deep Break (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={customForm.deepBreak}
                    onChange={(e) => setCustomForm({ ...customForm, deepBreak: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-muted-foreground">Sprint Work (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={customForm.shortWork}
                    onChange={(e) => setCustomForm({ ...customForm, shortWork: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Sprint Break (min)</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={customForm.shortBreak}
                    onChange={(e) => setCustomForm({ ...customForm, shortBreak: Number(e.target.value) })}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Durations
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default FocusPage
 