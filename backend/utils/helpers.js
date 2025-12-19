// Format duration from minutes to human readable
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return "0m"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Calculate date range
export const getDateRange = (range) => {
  const now = new Date()
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))

  switch (range) {
    case "today":
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      }
    case "week":
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
      return {
        start: startOfWeek,
        end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
      }
    case "month":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: startOfMonth, end: endOfMonth }
    default:
      return { start: startOfDay, end: new Date() }
  }
}

// Generate unique color
export const generateColor = () => {
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Paginate results
export const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit
  return { skip, limit: Number.parseInt(limit) }
}
