import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing a value
 * Useful for search inputs, filters, and other frequently changing values
 * 
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebouncedValue(searchTerm, 500)
 * 
 * useEffect(() => {
 *   // This only runs 500ms after user stops typing
 *   fetchSearchResults(debouncedSearchTerm)
 * }, [debouncedSearchTerm])
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debouncing a callback function
 * 
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced callback
 * 
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data)
 * }, 1000)
 * 
 * // Call this as much as you want, it will only execute once after 1s
 * onChange={(e) => debouncedSave(e.target.value)}
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}

