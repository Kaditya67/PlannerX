import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { planAPI, sectionAPI, itemAPI } from "../api/index.js"
import { ITEM_STATUS } from "../utils/constants.js"
import { useConfirm } from "../context/ConfirmContext.jsx"

export function usePlan(planId, toast) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [plan, setPlan] = useState(null)
  const [sections, setSections] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [currentSectionId, setCurrentSectionId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sectionForm, setSectionForm] = useState({ name: "", description: "" })
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    plannedDuration: 60,
  })

  const updateTimeoutRef = useRef(null)
  const lastStatsRef = useRef({ progress: 0, totalDuration: 0, completedDuration: 0 })

  // Calculate plan progress in real-time
  const calculatePlanProgress = useCallback((allItems) => {
    if (!allItems.length) return 0
    
    const completedItems = allItems.filter(item => item.status === ITEM_STATUS.COMPLETED)
    return Math.round((completedItems.length / allItems.length) * 100)
  }, [])

  // Calculate total duration in real-time
  const calculateTotalDuration = useCallback((allItems) => {
    return allItems.reduce((total, item) => total + (item.plannedDuration || 0), 0)
  }, [])

  // Calculate completed duration in real-time
  const calculateCompletedDuration = useCallback((allItems) => {
    return allItems
      .filter(item => item.status === ITEM_STATUS.COMPLETED)
      .reduce((total, item) => total + (item.plannedDuration || 0), 0)
  }, [])

  // Get real-time stats
  const getRealTimeStats = useCallback(() => {
    const totalItems = items.length
    const completedItems = items.filter(item => item.status === ITEM_STATUS.COMPLETED).length
    const progress = calculatePlanProgress(items)
    const totalDuration = calculateTotalDuration(items)
    const completedDuration = calculateCompletedDuration(items)

    return {
      totalItems,
      completedItems,
      progress,
      totalDuration,
      completedDuration
    }
  }, [items, calculatePlanProgress, calculateTotalDuration, calculateCompletedDuration])

  // Debounced server update
  const updatePlanOnServer = useCallback(async (stats) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Check if stats actually changed
    if (
      lastStatsRef.current.progress === stats.progress &&
      lastStatsRef.current.totalDuration === stats.totalDuration &&
      lastStatsRef.current.completedDuration === stats.completedDuration
    ) {
      return
    }

    lastStatsRef.current = stats

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await planAPI.update(planId, {
          progress: stats.progress,
          totalDuration: stats.totalDuration,
          completedDuration: stats.completedDuration
        })
      } catch (error) {
        console.error("Failed to sync plan progress:", error)
      }
    }, 1000)
  }, [planId])

  // Update plan progress in real-time
  const updatePlanProgress = useCallback(() => {
    const stats = getRealTimeStats()
    
    setPlan(prev => prev ? {
      ...prev,
      progress: stats.progress,
      totalDuration: stats.totalDuration,
      completedDuration: stats.completedDuration,
      itemsCount: stats.totalItems,
      completedItemsCount: stats.completedItems
    } : prev)

    updatePlanOnServer(stats)
  }, [getRealTimeStats, updatePlanOnServer])

  // Fetch plan data
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data } = await planAPI.getOne(planId)
        setPlan(data)
        setSections(data.sections || [])
        setItems(data.items || [])
        
        lastStatsRef.current = {
          progress: data.progress || 0,
          totalDuration: data.totalDuration || 0,
          completedDuration: data.completedDuration || 0
        }
      } catch (error) {
        toast.error("Failed to load plan")
        navigate("/workspaces")
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [planId, navigate, toast])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const openSectionModal = (section = null) => {
    // Strictly verify that section is a real section model object with a valid _id
    const isActualSection =
      section &&
      typeof section === "object" &&
      !section.nativeEvent &&
      !section.target &&
      typeof section._id === "string" &&
      typeof section.name === "string"

    if (isActualSection) {
      setEditingSection(section)
      setSectionForm({ name: section.name || "", description: section.description || "" })
    } else {
      setEditingSection(null)
      setSectionForm({ name: "", description: "" })
    }
    setSectionModalOpen(true)
  }

  const handleSectionSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingSection) {
        const { data } = await sectionAPI.update(editingSection._id, sectionForm)
        setSections((prev) => prev.map((s) => (s._id === data._id ? data : s)))
        toast.success("Section updated")
      } else {
        const { data } = await sectionAPI.create({ ...sectionForm, plan: planId })
        setSections((prev) => [...prev, data])
        toast.success("Section created")
      }
      setSectionModalOpen(false)
      
      // Refresh plan
      const { data } = await planAPI.getOne(planId)
      setPlan(data)
      setSections(data.sections || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSection = async (section) => {
    const confirmed = await confirm({
      title: "Delete Section",
      message: `Are you sure you want to delete "${section.name}" and all its tasks? This action cannot be undone.`,
      confirmText: "Delete Section",
      variant: "destructive",
      icon: "trash",
    })

    if (!confirmed) return

    try {
      await sectionAPI.delete(section._id)
      
      setSections((prev) => prev.filter((s) => s._id !== section._id))
      const itemsToDelete = items.filter((item) => item.section === section._id)
      setItems((prev) => prev.filter((item) => !itemsToDelete.some(del => del._id === item._id)))
      
      setCollapsedSections(prev => {
        const newState = { ...prev }
        delete newState[section._id]
        return newState
      })
      
      toast.success("Section deleted")
      updatePlanProgress()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openItemModal = (item = null, sectionId = null) => {
    const isActualItem =
      item &&
      typeof item === "object" &&
      !item.nativeEvent &&
      !item.target &&
      typeof item._id === "string" &&
      typeof item.title === "string"

    if (isActualItem) {
      setEditingItem(item)
      setItemForm({
        title: item.title,
        description: item.description || "",
        priority: item.priority || "medium",
        plannedDuration: item.plannedDuration || 60,
      })
      setCurrentSectionId(item.section)
    } else {
      setEditingItem(null)
      setItemForm({ title: "", description: "", priority: "medium", plannedDuration: 60 })
      setCurrentSectionId(typeof sectionId === "string" ? sectionId : null)
    }
    setItemModalOpen(true)
  }

  const handleItemSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingItem) {
        const { data } = await itemAPI.update(editingItem._id, itemForm)
        setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)))
        toast.success("Item updated")
      } else {
        const { data } = await itemAPI.create({
          ...itemForm,
          plan: planId,
          section: currentSectionId,
        })
        setItems((prev) => [...prev, data])
        toast.success("Item created")
      }
      setItemModalOpen(false)
      updatePlanProgress()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickAddItem = async (title, sectionId) => {
    try {
      const { data } = await itemAPI.create({
        title,
        plan: planId,
        section: sectionId,
        priority: "medium",
        plannedDuration: 60,
      })
      setItems((prev) => [...prev, data])
      toast.success("Item added")
      updatePlanProgress()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleToggleItemStatus = async (item) => {
    const newStatus = item.status === ITEM_STATUS.COMPLETED ? ITEM_STATUS.TODO : ITEM_STATUS.COMPLETED

    // Optimistic update
    const updatedItem = { ...item, status: newStatus }
    setItems((prev) => prev.map((i) => (i._id === item._id ? updatedItem : i)))

    try {
      const { data } = await itemAPI.update(item._id, { status: newStatus })
      setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)))
      updatePlanProgress()
    } catch (error) {
      setItems((prev) => prev.map((i) => (i._id === item._id ? item : i)))
      toast.error("Failed to update item status")
    }
  }

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({
      title: "Delete Task",
      message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      confirmText: "Delete Task",
      variant: "destructive",
      icon: "trash",
    })

    if (!confirmed) return

    try {
      await itemAPI.delete(item._id)
      setItems((prev) => prev.filter((i) => i._id !== item._id))
      toast.success("Item deleted")
      updatePlanProgress()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateItem = async (item, updates) => {
    // Optimistic update
    const updatedItem = { ...item, ...updates }
    setItems((prev) => prev.map((i) => (i._id === item._id ? updatedItem : i)))

    try {
      const { data } = await itemAPI.update(item._id, updates)
      setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)))
      updatePlanProgress()
      toast.success("Item updated")
    } catch (error) {
      setItems((prev) => prev.map((i) => (i._id === item._id ? item : i)))
      toast.error("Failed to update item")
    }
  }

  const getSectionItems = (sectionId) => {
    return items.filter((item) => item.section === sectionId)
  }

  const getUnsectionedItems = () => {
    return items.filter((item) => !item.section)
  }

  return {
    plan,
    sections,
    items,
    loading,
    collapsedSections,
    sectionModalOpen,
    itemModalOpen,
    editingSection,
    editingItem,
    currentSectionId,
    submitting,
    sectionForm,
    itemForm,
    stats: getRealTimeStats(),
    toggleSection,
    openSectionModal,
    openItemModal,
    handleQuickAddItem,
    handleSectionSubmit,
    handleItemSubmit,
    handleToggleItemStatus,
    handleDeleteSection,
    handleDeleteItem,
    setSectionModalOpen,
    setItemModalOpen,
    setSectionForm,
    setItemForm,
    getSectionItems,
    getUnsectionedItems,
    handleUpdateItem, // Export new handler
    handleQuickAddItem
  }
}