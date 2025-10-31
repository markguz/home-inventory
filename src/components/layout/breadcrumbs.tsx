"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/**
 * Route configuration for breadcrumb labels and metadata
 */
interface RouteConfig {
  label: string
  icon?: React.ReactNode
}

const routeLabels: Record<string, RouteConfig> = {
  "": { label: "Home", icon: <Home className="size-4" /> },
  items: { label: "Items" },
  categories: { label: "Categories" },
  locations: { label: "Locations" },
  tags: { label: "Tags" },
  receipts: { label: "Receipts" },
  new: { label: "New Item" },
}

/**
 * Breadcrumb segment with path and label
 */
interface BreadcrumbSegment {
  label: string
  href: string
  icon?: React.ReactNode
  isLast: boolean
}

/**
 * Parse pathname into breadcrumb segments
 * Handles dynamic routes like /items/[id]
 */
function useBreadcrumbs(): BreadcrumbSegment[] {
  const pathname = usePathname()

  return React.useMemo(() => {
    // Split pathname and filter empty segments
    const segments = pathname.split("/").filter(Boolean)

    // Always include home
    const breadcrumbs: BreadcrumbSegment[] = [
      {
        label: routeLabels[""].label,
        href: "/",
        icon: routeLabels[""].icon,
        isLast: segments.length === 0,
      },
    ]

    // Build breadcrumb trail
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      const isLast = index === segments.length - 1

      // Check if segment is a dynamic route parameter (UUID or number)
      const isDynamic = /^[a-f0-9-]{36}$|^\d+$/.test(segment)

      let label: string
      let icon: React.ReactNode | undefined

      if (isDynamic) {
        // For dynamic routes, use a generic label or fetch from context
        label = "Details"
      } else {
        // Use configured label or capitalize segment
        const config = routeLabels[segment]
        label = config?.label ?? segment.charAt(0).toUpperCase() + segment.slice(1)
        icon = config?.icon
      }

      breadcrumbs.push({
        label,
        href,
        icon,
        isLast,
      })
    })

    return breadcrumbs
  }, [pathname])
}

/**
 * Dynamic breadcrumb navigation component
 * Auto-generates breadcrumbs from current Next.js route
 *
 * @example
 * // Add to layout.tsx or page components
 * <Breadcrumbs />
 */
export function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs()

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>
                  {crumb.icon && <span className="inline-flex items-center gap-1.5">{crumb.icon}</span>}
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="inline-flex items-center gap-1.5">
                    {crumb.icon}
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Hook to access breadcrumb data programmatically
 * Useful for custom breadcrumb implementations or metadata
 */
export function useBreadcrumbData() {
  return useBreadcrumbs()
}
