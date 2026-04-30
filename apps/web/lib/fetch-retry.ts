/**
 * fetch-retry.ts
 * 
 * Shared utility function for making API requests with retry logic and exponential backoff.
 * Implements circuit breaker pattern to prevent consecutive failures from overwhelming 
 * the system.
 */

interface FetchRetryOptions extends RequestInit {
  retries?: number;
  backoffDelay?: number;
  backoffFactor?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number | null;
  halfOpenAttempt: boolean;
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: null,
    halfOpenAttempt: false
  };

  constructor(
    private failureThreshold: number = 3,
    private timeout: number = 60000, // 1 minute default
    private resetTimeout: number = 5000 // 5 seconds to try after reset
  ) {}

  public async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.shouldTrip()) {
      this.open();
      throw new Error('Circuit breaker is OPEN - request rejected to prevent cascade failure');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldTrip(): boolean {
    if (this.state.isOpen) {
      // Check if we should allow one request to try to close the circuit
      if (
        this.state.halfOpenAttempt === false &&
        this.state.lastFailureTime !== null &&
        Date.now() - this.state.lastFailureTime > this.resetTimeout
      ) {
        this.state.halfOpenAttempt = true;
        return false; // Allow one request through
      }
      return Date.now() - (this.state.lastFailureTime || 0) < this.timeout;
    }
    return false;
  }

  private onSuccess(): void {
    this.state.failureCount = 0;
    this.state.isOpen = false;
    this.state.halfOpenAttempt = false;
  }

  private onFailure(): void {
    this.state.failureCount++;
    
    if (this.state.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state.isOpen = true;
    this.state.lastFailureTime = Date.now();
    this.state.halfOpenAttempt = false;
  }

  public reset(): void {
    this.state = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: null,
      halfOpenAttempt: false
    };
  }

  public getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// Circuit breakers for different services to isolate failures
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Enhanced fetch with retry logic and circuit breaker pattern
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await fetchWithRetry('/api/data');
 * 
 * // Advanced usage
 * const result = await fetchWithRetry('/api/data', {
 *   retries: 3,
 *   backoffDelay: 1000,
 *   backoffFactor: 2,
 *   method: 'POST',
 *   body: JSON.stringify({ data: 'value' })
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string | URL,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    backoffDelay = 1000,
    backoffFactor = 2,
    maxDelay = 30000,
    onRetry,
    ...fetchOptions
  } = options;

  // Create or get circuit breaker for this service
  // Extract the service name from the URL (e.g., api.service.com becomes 'api_service')
  const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
  let serviceId = urlObj.hostname.replace(/\./g, '_');
  
  if (!circuitBreakers.has(serviceId)) {
    circuitBreakers.set(serviceId, new CircuitBreaker(3, 60000, 5000));
  }

  const circuitBreaker = circuitBreakers.get(serviceId)!;

  return circuitBreaker.call(async (): Promise<Response> => {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        
        // Consider specific status codes as failures that should be retried
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        return response; // Return successful response immediately
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          backoffDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        // Optional callback before retrying
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // Wait for calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Throw the last error after all retries are exhausted
    throw lastError;
  });
}

/**
 * Convenience function for making JSON API requests with retries
 */
export async function fetchJsonWithRetry<T = any>(
  url: string | URL,
  options?: Omit<FetchRetryOptions, 'headers'>,
  useDefaultHeaders: boolean = true
): Promise<T> {
  const fetchOptions: FetchRetryOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(useDefaultHeaders ? { 'Accept': 'application/json' } : {}),
      ...options?.headers
    }
  };

  const response = await fetchWithRetry(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Get circuit breaker health status for a service
 */
export function getCircuitBreakerState(serviceUrl: string): CircuitBreakerState | null {
  const urlObj = new URL(serviceUrl, window.location.origin);
  const serviceId = urlObj.hostname.replace(/\./g, '_');
  
  return circuitBreakers.has(serviceId) 
    ? circuitBreakers.get(serviceId)!.getState()
    : null;
}

/**
 * Reset the circuit breaker for a specific service
 */
export function resetCircuitBreaker(serviceUrl: string): void {
  const urlObj = new URL(serviceUrl, window.location.origin);
  const serviceId = urlObj.hostname.replace(/\./g, '_');
  
  if (circuitBreakers.has(serviceId)) {
    circuitBreakers.get(serviceId)!.reset();
  }
}