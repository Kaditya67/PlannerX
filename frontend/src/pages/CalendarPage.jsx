import { useState, useEffect, useMemo } from "react"
import { sessionAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import { ChevronLeft, ChevronRight, Clock, Play, Square, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react"

import Button from "../components/ui/Button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"

import { cn, formatDuration } from "../utils/helpers.js"

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function CalendarPage() {
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchSessions()
  }, [currentDate])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data } = await sessionAPI.getAll({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      })

      setSessions(data || [])
    } catch {
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  const sessionsByDate = useMemo(() => {
    const map = new Map()
    sessions.forEach((session) => {
      const d = new Date(session.startTime)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(session)
    })
    return map
  }, [sessions])

  const getSessionsForDate = (date) => {
    if (!date) return []
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return sessionsByDate.get(key) || []
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const isSelected = (date) => {
    if (!date || !selectedDate) return false
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    )
  }

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + direction)
      return next
    })
  }

  const days = getDaysInMonth()
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : []
  const totalMonthDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0)
  const completedMonthCount = sessions.filter((s) => s.status === "completed").length

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Calendar & Activity</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select any date to inspect your recorded focus sessions
          </p>
        </div>

        {/* Quick Month Metrics Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-card border border-border px-3 py-1.5 rounded-lg text-xs shadow-sm">
          <span className="text-muted-foreground">This month:</span>
          <span className="font-semibold text-foreground">{sessions.length} sessions</span>
          <span className="text-border">•</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatDuration(totalMonthDuration)}</span>
        </div>
      </div>

      {/* Main Unified Workspace Card */}
      <div className="grid gap-5 md:grid-cols-12 items-start">
        {/* Compact Calendar Picker */}
        <Card className="md:col-span-5 border border-border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs" 
                  onClick={() => {
                    const now = new Date()
                    setCurrentDate(now)
                    setSelectedDate(now)
                  }}
                >
                  Today
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-1">
            {/* Day name abbreviations */}
            <div className="grid grid-cols-7 mb-1 text-center">
              {DAYS.map((day) => (
                <div key={day} className="py-1 text-[11px] font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar numbers grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const dateSessions = getSessionsForDate(date)
                const hasSession = dateSessions.length > 0

                return (
                  <button
                    key={index}
                    disabled={!date}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative h-8 w-8 mx-auto rounded-md text-xs font-medium transition-all flex items-center justify-center",
                      !date && "invisible pointer-events-none",
                      date && "hover:bg-accent hover:text-foreground",
                      isToday(date) && "border border-primary/40 font-bold text-primary",
                      isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary font-bold shadow-sm"
                    )}
                  >
                    <span>{date?.getDate()}</span>
                    {hasSession && (
                      <span
                        className={cn(
                          "absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                          isSelected(date) ? "bg-primary-foreground" : "bg-primary"
                        )}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sessions Activity on Selected Date */}
        <Card className="md:col-span-7 border border-border shadow-sm">
          <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold">
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                  : "Select a Date"}
              </CardTitle>
            </div>
            {selectedDateSessions.length > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {selectedDateSessions.length} {selectedDateSessions.length === 1 ? "session" : "sessions"}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="p-4">
            {selectedDateSessions.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No sessions logged for this day</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Start focus timers from the Focus tab to record and track your activity here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {selectedDateSessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.item?.title || "Focus Session"}
                        </p>
                        <Badge
                          variant={session.status === "completed" ? "success" : "secondary"}
                          className="text-[10px] uppercase tracking-wider py-0 px-1.5"
                        >
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {session.endTime && (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {session.duration > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                        {formatDuration(session.duration)}
                      </span>
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

export default CalendarPage

