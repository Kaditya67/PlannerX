import { useState, useEffect, useRef, useCallback } from "react"
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
  Circle,
  Zap,
  Coffee,
} from "lucide-react"

import Button from "../components/ui/Button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"

import { cn, formatDuration } from "../utils/helpers.js"
import { ITEM_STATUS } from "../utils/constants.js"

const FOCUS_MODES = {
  POMODORO: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 },
  DEEP_WORK: { work: 90 * 60, break: 20 * 60 },
  SHORT: { work: 15 * 60, break: 3 * 60 },
}

function FocusPage() {
  const { toast } = useToast()

  const [plans, setPlans] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedItem, setSelectedItem] = useState(null)
  const [activeSession, setActiveSession] = useState(null)

  const [focusMode, setFocusMode] = useState("POMODORO")
  const [isWorking, setIsWorking] = useState(true)
  const [timeLeft, setTimeLeft] = useState(FOCUS_MODES.POMODORO.work)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)

  const timerRef = useRef(null)

  /* --------------------------------------------
     Initial load
  --------------------------------------------- */
  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    resetTimer()
  }, [focusMode])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    setIsWorking(true)
    setTimeLeft(FOCUS_MODES[focusMode].work)
  }

  const fetchData = async () => {
    try {
      const { data: plansData } = await planAPI.getAll()
      setPlans(plansData || [])

      const pendingItems = []
      for (const plan of plansData || []) {
        plan.items?.forEach((item) => {
          if (item.status !== ITEM_STATUS.COMPLETED) {
            pendingItems.push({
              ...item,
              planName: plan.name,
              planColor: plan.color,
            })
          }
        })
      }
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

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimerComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isRunning, isWorking, selectedItem, activeSession])

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
  }

  const stopTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
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
        setTimeLeft(
          isLongBreak
            ? FOCUS_MODES[focusMode].longBreak ?? FOCUS_MODES[focusMode].break
            : FOCUS_MODES[focusMode].break,
        )
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
      setTimeLeft(FOCUS_MODES[focusMode].work)
      setIsWorking(true)
    }
  }

  const skipToNext = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    setIsWorking((prev) => !prev)
    setTimeLeft(
      isWorking
        ? FOCUS_MODES[focusMode].break
        : FOCUS_MODES[focusMode].work,
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
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const progress = isWorking
    ? ((FOCUS_MODES[focusMode].work - timeLeft) / FOCUS_MODES[focusMode].work) * 100
    : ((FOCUS_MODES[focusMode].break - timeLeft) / FOCUS_MODES[focusMode].break) * 100

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Focus Mode</h1>
        <p className="mt-2 text-muted-foreground">
          Stay focused and track your work sessions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* TIMER */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isWorking ? <Zap /> : <Coffee />}
                {isWorking ? "Focus Time" : "Break Time"}
              </CardTitle>

              <div className="flex gap-2">
                {Object.keys(FOCUS_MODES).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={focusMode === mode ? "primary" : "outline"}
                    onClick={() => setFocusMode(mode)}
                    disabled={isRunning}
                  >
                    {mode === "POMODORO" ? "25m" : mode === "DEEP_WORK" ? "90m" : "15m"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className="text-primary transition-all duration-1000"
                />
              </svg>

              <div className="text-center">
                <p className="text-5xl font-bold text-foreground">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isWorking ? "Stay focused" : "Relax & recharge"}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <Button size="icon" className="h-8 w-8 rounded-full" onClick={startTimer}>
                  <Play />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={pauseTimer}
                >
                  <Pause />
                </Button>
              )}

              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={stopTimer}
              >
                <Square />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={skipToNext}
              >
                <SkipForward />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TASKS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target />
              Tasks Queue
            </CardTitle>
          </CardHeader>

          <CardContent>
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground/40" />
                <p className="mt-4 font-medium text-foreground">All caught up</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No pending tasks
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      selectedItem?._id === item._id
                        ? "bg-accent border-border"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompleteItem(item)
                      }}
                    >
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.planName}</p>
                    </div>

                    {item.plannedDuration > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDuration(item.plannedDuration)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FocusPage
 