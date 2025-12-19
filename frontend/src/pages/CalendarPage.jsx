import { useState, useEffect, useMemo } from "react"
import { sessionAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import { ChevronLeft, ChevronRight, Clock, Play, Square } from "lucide-react"

import Button from "../components/ui/Button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"

import { cn, formatDuration } from "../utils/helpers.js"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function CalendarPage() {
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  /* --------------------------------------------
     Fetch sessions for current month
  --------------------------------------------- */
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

  /* --------------------------------------------
     Group sessions by date (PERFORMANCE FIX)
  --------------------------------------------- */
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

  /* --------------------------------------------
     Calendar helpers
  --------------------------------------------- */
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
    setSelectedDate(null) // UX FIX
  }

  const days = getDaysInMonth()
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : []

  /* --------------------------------------------
     Loading state
  --------------------------------------------- */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="mt-2 text-muted-foreground">
          View your work sessions and track your productivity
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const dateSessions = getSessionsForDate(date)
                const hasSession = dateSessions.length > 0

                return (
                  <button
                    key={index}
                    disabled={!date}
                    aria-current={isToday(date) ? "date" : undefined}
                    aria-selected={isSelected(date)}
                    aria-label={
                      date
                        ? `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
                        : undefined
                    }
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative aspect-square rounded-lg p-2 text-sm transition-all",
                      !date && "invisible",
                      date && "hover:bg-accent",
                      isToday(date) && "bg-primary/10 font-bold text-primary",
                      isSelected(date) &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    <span>{date?.getDate()}</span>
                    {hasSession && (
                      <span
                        title={`${dateSessions.length} session(s)`}
                        className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                : "Select a date"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Click on a date to view sessions
              </p>
            ) : selectedDateSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No sessions recorded
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSessions.map((session) => (
                  <div key={session._id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {session.item?.title || "Focus Session"}
                      </p>
                      <Badge
                        variant={session.status === "completed" ? "success" : "secondary"}
                      >
                        {session.status}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {new Date(session.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {session.endTime && (
                        <span className="flex items-center gap-1">
                          <Square className="h-3 w-3" />
                          {new Date(session.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}

                      {session.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total Sessions" value={sessions.length} />
            <Stat
              label="Completed"
              value={sessions.filter((s) => s.status === "completed").length}
            />
            <Stat
              label="Total Time"
              value={formatDuration(
                sessions.reduce((acc, s) => acc + (s.duration || 0), 0),
              )}
            />
            <Stat
              label="Avg Duration"
              value={
                sessions.length
                  ? formatDuration(
                      Math.round(
                        sessions.reduce((acc, s) => acc + (s.duration || 0), 0) /
                          sessions.length,
                      ),
                    )
                  : "0m"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* --------------------------------------------
   Small helper component
--------------------------------------------- */
function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-accent/50 p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default CalendarPage
