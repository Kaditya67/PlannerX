import { createContext, useContext, useState, useCallback, useRef } from "react"
import Modal from "../components/ui/Modal.jsx"
import Button from "../components/ui/Button.jsx"
import { AlertTriangle, Trash2, Info } from "lucide-react"

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "destructive", // "destructive" | "primary"
    icon: "trash", // "trash" | "warning" | "info"
    loading: false,
  })

  const resolverRef = useRef(null)

  /**
   * Shows a confirm dialog and returns a Promise that resolves to true (confirmed) or false (cancelled)
   * Usage:
   * const ok = await confirm({
   *   title: "Delete Workspace",
   *   message: 'Are you sure you want to delete "Project"? This action cannot be undone.',
   *   confirmText: "Delete",
   *   variant: "destructive"
   * })
   */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialogState({
        isOpen: true,
        title: options.title || "Are you sure?",
        message: options.message || "This action cannot be undone.",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "destructive",
        icon: options.icon || "trash",
        loading: false,
      })
    })
  }, [])

  const handleClose = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
    if (resolverRef.current) {
      resolverRef.current(false)
      resolverRef.current = null
    }
  }

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
    if (resolverRef.current) {
      resolverRef.current(true)
      resolverRef.current = null
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Modal
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        title={dialogState.title}
        size="sm"
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`rounded-full p-2.5 shrink-0 ${
                dialogState.variant === "destructive"
                  ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              }`}
            >
              {dialogState.icon === "warning" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : dialogState.icon === "info" ? (
                <Info className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </div>
            <div className="text-sm text-muted-foreground pt-0.5 leading-relaxed">
              {dialogState.message}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              {dialogState.cancelText}
            </Button>
            <Button
              type="button"
              variant={dialogState.variant === "destructive" ? "destructive" : "primary"}
              size="sm"
              onClick={handleConfirm}
              autoFocus
            >
              {dialogState.confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}
