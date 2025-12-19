import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { workspaceAPI, planAPI } from "../api/index.js"
import { Plus, Folder, Clock, CheckCircle, TrendingUp, ArrowRight, AlertCircle } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import Progress from "../components/Progress.jsx"
import StatsCardSkeleton from "../components/skeletons/StatsCardSkeleton.jsx"
import ListSkeleton from "../components/skeletons/ListSkeleton.jsx"
import { formatDuration } from "../utils/helpers.js"
import { PLAN_TYPE_LABELS } from "../utils/constants.js"

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [recentPlans, setRecentPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalTime: 0,
  })

  // Memoize expensive calculations
  const completionPercentage = useMemo(() => {
    if (stats.totalTime === 0) return 0
    return Math.round((stats.completedTasks / stats.totalTime) * 100)
  }, [stats.completedTasks, stats.totalTime])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        setLoading(true)
        
        // Fetch data in parallel
        const [workspacesRes, plansRes] = await Promise.allSettled([
          workspaceAPI.getAll(),
          planAPI.getAll()
        ])

        let workspaceData = []
        let planData = []

        // Handle workspace response
        if (workspacesRes.status === 'fulfilled') {
          workspaceData = workspacesRes.value.data || []
          setWorkspaces(workspaceData)
        } else {
          console.error("Workspace fetch failed:", workspacesRes.reason)
          throw new Error("Failed to load workspaces")
        }

        // Handle plans response
        if (plansRes.status === 'fulfilled') {
          planData = plansRes.value.data || []
          // Limit recent plans for performance
          setRecentPlans(planData.slice(0, 4))

          let completed = 0
          let totalTime = 0
          let inProgressCount = 0

          planData.forEach((plan) => {
            completed += plan.completedDuration || 0
            totalTime += plan.totalDuration || 0
            // Check if plan is in progress
            if (plan.progress > 0 && plan.progress < 100) {
              inProgressCount++
            }
          })

          setStats({
            totalPlans: planData.length,
            completedTasks: completed,
            inProgressTasks: inProgressCount,
            totalTime: totalTime,
          })
        } else {
          console.error("Plans fetch failed:", plansRes.reason)
          throw new Error("Failed to load plans")
        }

      } catch (error) {
        console.error("Error in dashboard data fetch:", error)
        setError(error.message || "Failed to load dashboard data. Please try refreshing.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle empty states
  const hasWorkspaces = workspaces.length > 0
  const hasPlans = recentPlans.length > 0

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="mb-8 md:mb-10">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="mb-8 md:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCardSkeleton count={4} />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <ListSkeleton count={4} />
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <ListSkeleton count={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Welcome back, <span className="text-emerald-600 dark:text-emerald-400">{user?.name?.split(" ")[0] || 'User'}!</span>
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's an overview of your planning progress
          {completionPercentage > 0 && (
            <span className="ml-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              • {completionPercentage}% overall completion
            </span>
          )}
        </p>
      </header>

      {/* Stats Grid */}
      <section className="mb-8 md:mb-10">
        <h2 className="sr-only">Performance statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Plans Card */}
          <Card className="group transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPlans}</p>
                </div>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                  <Folder className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {recentPlans.length} recent • {stats.inProgressTasks} in progress
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks Card */}
          <Card className="group transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(stats.completedTasks)}</p>
                </div>
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Total Time Card */}
          <Card className="group transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(stats.totalTime)}</p>
                </div>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {stats.totalPlans > 0 ? formatDuration(stats.totalTime / stats.totalPlans) : '0h'}/plan
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workspaces Card */}
          <Card className="group transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Workspaces</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workspaces.length}</p>
                </div>
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {workspaces.slice(0, 2).map(w => w.name).join(', ')}
                  {workspaces.length > 2 && ` +${workspaces.length - 2} more`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Plans Section */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Plans</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick access to your latest work</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/plans")}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasPlans ? (
              <div className="py-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Folder className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No plans yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Create your first plan to start organizing your work and tracking progress.
                </p>
                <Button onClick={() => navigate("/workspaces")} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPlans.map((plan) => (
                  <div
                    key={plan._id}
                    onClick={() => navigate(`/plans/${plan._id}`)}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 
                               hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 
                               cursor-pointer transition-all duration-150 active:scale-[0.99]"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/plans/${plan._id}`)}
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: plan.color || "#10B981" }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {PLAN_TYPE_LABELS[plan.type]?.label || plan.type}
                        </span>
                        {plan.dueDate && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Due {new Date(plan.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={plan.progress || 0} className="w-20" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
                          {plan.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspaces Section */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workspaces</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Collaborate and organize your projects</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workspaces")}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Manage
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasWorkspaces ? (
              <div className="py-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No workspaces yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Create a workspace to organize your plans and collaborate with team members.
                </p>
                <Button onClick={() => navigate("/workspaces/new")} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workspaces.slice(0, 4).map((workspace) => (
                  <div
                    key={workspace._id}
                    onClick={() => navigate(`/workspaces/${workspace._id}`)}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 
                               hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 
                               cursor-pointer transition-all duration-150 active:scale-[0.99]"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/workspaces/${workspace._id}`)}
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: workspace.color || "#10B981" }}
                    >
                      <Folder className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {workspace.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {workspace.plansCount || 0} {workspace.plansCount === 1 ? 'plan' : 'plans'}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {workspace.members?.length || 0} {workspace.members?.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={workspace.access === 'private' ? 'secondary' : 'default'}
                      className="flex-shrink-0"
                    >
                      {workspace.access || 'shared'}
                    </Badge>
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

export default DashboardPage