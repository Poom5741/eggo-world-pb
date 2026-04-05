/**
 * PocketBase error handling utilities
 * Utility functions for handling PocketBase SDK errors gracefully
 */

/**
 * Check if error is an auto-cancel error (normal during navigation)
 * ตรวจสอบว่า error เป็น auto-cancel ที่เกิดระหว่างการ navigate หรือไม่
 */
export const isAutoCancelError = (err: any): boolean => {
  return (
    err?.status === 0 ||
    err?.message?.includes('autocancelled') ||
    err?.message?.includes('The request was autocancelled')
  )
}

/**
 * Check if error is a 404 not found error
 * ตรวจสอบว่า error เป็น 404 not found หรือไม่
 */
export const isNotFound = (err: any): boolean => {
  return (
    err?.status === 404 ||
    err?.message?.includes('not found') ||
    err?.message?.includes('Missing collection context')
  )
}

/**
 * Check if error is an authentication error
 * ตรวจสอบว่า error เป็น authentication error หรือไม่
 */
export const isAuthError = (err: any): boolean => {
  return (
    err?.status === 401 ||
    err?.status === 403 ||
    err?.message?.includes('auth') ||
    err?.message?.includes('Unauthorized')
  )
}

/**
 * Handle PocketBase errors gracefully
 * จัดการ error จาก PocketBase อย่างเหมาะสม
 * 
 * @param err - The error to handle
 * @param options - Handling options
 * @param options.suppressAutoCancel - Suppress auto-cancel errors (default: true)
 * @param options.suppressNotFound - Suppress 404 errors (default: true)
 * @param options.onNotFound - Callback for 404 errors
 * @param options.onOther - Callback for other errors
 * @returns true if error was handled, false if should be rethrown
 */
export const handlePocketBaseError = (
  err: any,
  options: {
    suppressAutoCancel?: boolean
    suppressNotFound?: boolean
    onNotFound?: () => void
    onOther?: (error: any) => void
  } = {}
): boolean => {
  const {
    suppressAutoCancel = true,
    suppressNotFound = true,
    onNotFound,
    onOther
  } = options

  // Suppress auto-cancel errors (normal during navigation)
  if (suppressAutoCancel && isAutoCancelError(err)) {
    return true
  }

  // Handle 404 errors
  if (isNotFound(err)) {
    if (suppressNotFound) {
      if (onNotFound) onNotFound()
      return true
    }
  }

  // Handle other errors
  if (onOther) {
    onOther(err)
    return true
  }

  // Log unhandled errors
  if (!suppressAutoCancel || !isAutoCancelError(err)) {
    console.error('PocketBase error:', err)
  }

  return false
}
