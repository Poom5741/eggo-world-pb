/**
 * Safely extract error message from API responses
 * Handles cases where error.message might be an object instead of string
 * 
 * @param errorResult - The error object or string from API response
 * @param fallback - Default message if error is undefined
 * @returns Safe string error message
 */
export function extractErrorMessage(errorResult: any, fallback: string = 'Operation failed'): string {
  if (typeof errorResult === 'string') {
    return errorResult
  }
  
  if (errorResult && typeof errorResult === 'object') {
    if (typeof errorResult.message === 'string') {
      return errorResult.message
    }
    
    if (errorResult.message && typeof errorResult.message === 'object') {
      return JSON.stringify(errorResult.message)
    }
    
    return JSON.stringify(errorResult)
  }
  
  return String(errorResult) || fallback
}
