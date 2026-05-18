"use client"

import { useState, useEffect } from "react"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { createClient } from "@/lib/pocketbase/client"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * KYC Status data shape from GET /api/v2/kyc-status
 */
export interface KYCStatusData {
  kyc_verified: boolean
  kyc_required_globally: boolean
  can_withdraw: boolean
}

interface KYCStatusBadgeProps {
  /** Pre-fetched KYC status — if not provided, fetches on mount */
  status?: KYCStatusData
  /** Additional className for the badge wrapper */
  className?: string
  /** Hide the shield icon for compact display */
  hideIcon?: boolean
}

/**
 * KYCStatusBadge — แสดงสถานะการยืนยัน KYC ของผู้ใช้
 *
 * Four display states:
 * - Verified (green): kyc_verified = true
 * - KYC Required (amber): kyc_required_globally = true, kyc_verified = false
 * - Not Verified (gray): kyc_verified = false, kyc_required_globally = false
 *
 * If no status prop provided, fetches from GET /api/v2/kyc-status on mount.
 * Hydration-safe with useIsHydrated().
 */
export function KYCStatusBadge({ status, className, hideIcon = false }: KYCStatusBadgeProps) {
  const isHydrated = useIsHydrated()
  const pb = createClient()

  const [fetchedStatus, setFetchedStatus] = useState<KYCStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Auto-fetch if no status prop provided
  useEffect(() => {
    if (!isHydrated || status) return

    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const token = pb.authStore.token
        if (!token) return

        const response = await fetch(`${pb.baseURL}/api/v2/kyc-status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()
        if (data.success) {
          setFetchedStatus(data.data)
        }
      } catch {
        // Silently fail — badge just won't show
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [isHydrated, status])

  // Not hydrated — return null
  if (!isHydrated) return null

  // Determine display status
  const effectiveStatus = status || fetchedStatus
  if (!effectiveStatus || isLoading) return null

  const { kyc_verified, kyc_required_globally } = effectiveStatus

  if (kyc_verified) {
    // Verified state — green
    return (
      <Badge
        variant="default"
        className={cn(
          "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
          !hideIcon && "gap-1.5",
          className
        )}
      >
        {!hideIcon && <ShieldCheck className="h-3 w-3" />}
        KYC Verified
      </Badge>
    )
  }

  if (kyc_required_globally) {
    // Required but not verified — orange/amber with ShieldAlert
    // Note: ShieldAlert may not exist in all lucide versions, use ShieldX as fallback
    const ShieldIcon = ShieldAlert || ShieldX
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
          !hideIcon && "gap-1.5",
          className
        )}
      >
        {!hideIcon && <ShieldIcon className="h-3 w-3" />}
        KYC Required
      </Badge>
    )
  }

  // Not verified, not required — gray
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-muted-foreground",
        !hideIcon && "gap-1.5",
        className
      )}
    >
      {!hideIcon && <ShieldX className="h-3 w-3" />}
      Not Verified
    </Badge>
  )
}

export default KYCStatusBadge