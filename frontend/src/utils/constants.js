export const PLAN_TYPES = {
  PROJECT: "project",
  STUDY: "study",
  EVENT: "event",
  DAILY: "daily",
  FREE: "free",
}

export const PLAN_TYPE_LABELS = {
  project: { label: "Project", icon: "Folder", color: "#3B82F6" },
  study: { label: "Study Plan", icon: "BookOpen", color: "#10B981" },
  event: { label: "Event", icon: "Calendar", color: "#F59E0B" },
  daily: { label: "Daily Plan", icon: "Sun", color: "#8B5CF6" },
  free: { label: "Free Plan", icon: "Layers", color: "#6366F1" },
}

export const ITEM_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
}

export const STATUS_CONFIG = {
  todo: { label: "To Do", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
}

export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-warning" },
  high: { label: "High", color: "text-orange-500" },
  urgent: { label: "Urgent", color: "text-destructive" },
}

export const VIEWS = {
  TREE: "tree",
  TIMELINE: "timeline",
  CALENDAR: "calendar",
  FOCUS: "focus",
}
