import { useState, useCallback } from "react"
import { useToast } from "../context/ToastContext.jsx"

export function useApi(apiFunction, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiFunction(...args)
        setData(result.data || result)

        if (options.successMessage) {
          toast.success(options.successMessage)
        }

        return result
      } catch (err) {
        const errorMessage = err.message || "An error occurred"
        setError(errorMessage)

        if (options.showError !== false) {
          toast.error(errorMessage)
        }

        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, options, toast],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

export default useApi
