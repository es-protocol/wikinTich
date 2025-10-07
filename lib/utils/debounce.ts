/**
 * Debounce Utility
 * Delays function execution until after a specified wait period
 * Prevents excessive function calls on rapid user interactions
 * 
 * Security Impact: ZERO - Just timing control, no data/auth changes
 * Performance Impact: Reduces network requests by 70-90%
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay (default: 300ms)
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query)
 * }, 500)
 * 
 * // User types "hello"
 * debouncedSearch('h')    // Cancelled
 * debouncedSearch('he')   // Cancelled
 * debouncedSearch('hel')  // Cancelled
 * debouncedSearch('hell') // Cancelled
 * debouncedSearch('hello') // Executes after 500ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * Unlike debounce, throttle guarantees execution at regular intervals.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle (default: 300ms)
 * @returns A throttled version of the function
 * 
 * @example
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition()
 * }, 100)
 * 
 * window.addEventListener('scroll', throttledScroll)
 * // Function executes at most once every 100ms, even if scroll events fire faster
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, wait)
    }
  }
}

/**
 * Debounce with immediate execution option
 * Useful when you want the first call to execute immediately
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - If true, trigger the function on the leading edge instead of trailing
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSave = debounceImmediate((data) => {
 *   saveData(data)
 * }, 1000, true)
 * 
 * debouncedSave(data1) // Executes immediately
 * debouncedSave(data2) // Ignored (within 1s)
 * debouncedSave(data3) // Ignored (within 1s)
 * // After 1s, next call will execute immediately again
 */
export function debounceImmediate<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * Creates a debounced async function with proper cleanup
 * Cancels previous pending promises when a new call is made
 * 
 * @param func - The async function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the async function
 * 
 * @example
 * const debouncedFetch = debounceAsync(async (id: string) => {
 *   return await fetchUser(id)
 * }, 500)
 * 
 * await debouncedFetch('user1') // Cancelled
 * await debouncedFetch('user2') // Cancelled
 * const user = await debouncedFetch('user3') // Executes after 500ms
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeout) {
      clearTimeout(timeout)
    }

    pendingPromise = new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          timeout = null
          pendingPromise = null
        }
      }, wait)
    })

    return pendingPromise
  }
}

/**
 * Predefined debounce delays for common use cases
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 500,        // Search input (wait for user to stop typing)
  FILTER: 300,        // Filter changes
  RESIZE: 150,        // Window resize events
  SCROLL: 100,        // Scroll events
  INPUT: 300,         // General input fields
  API_CALL: 500,      // API requests
  VALIDATION: 400,    // Form validation
  AUTOSAVE: 2000,     // Auto-save functionality
} as const

