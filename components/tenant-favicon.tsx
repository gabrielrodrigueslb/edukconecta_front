"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { getTenantPublic, resolveTenantAsset, setTenantPublicCache, type TenantPublic } from "@/lib/tenant"

export default function TenantFavicon({
  initialTenant,
}: {
  initialTenant?: TenantPublic | null
}) {
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    const applyFavicon = (favicon: string) => {
      const links = Array.from(
        document.querySelectorAll("link[rel~='icon']"),
      ) as HTMLLinkElement[]
      if (links.length === 0) {
        const link = document.createElement("link")
        link.rel = "icon"
        link.setAttribute("data-tenant-favicon", "1")
        link.href = favicon
        document.head.appendChild(link)
        return
      }
      links.forEach((link) => {
        link.setAttribute("data-tenant-favicon", "1")
        link.href = favicon
      })
    }

    if (initialTenant) {
      setTenantPublicCache(initialTenant)
      const initialIcon = resolveTenantAsset(
        initialTenant.faviconUrl || initialTenant.logoUrl,
      )
      if (initialIcon) {
        applyFavicon(initialIcon)
      }
    }

    getTenantPublic()
      .then((tenant) => {
        if (!mounted) return
        const primary = resolveTenantAsset(tenant?.faviconUrl)
        const fallback = resolveTenantAsset(tenant?.logoUrl)
        if (!primary && !fallback) return
        if (!primary || primary === fallback) {
          if (fallback) applyFavicon(fallback)
          return
        }
        const tester = new Image()
        tester.onload = () => applyFavicon(primary)
        tester.onerror = () => {
          if (fallback) applyFavicon(fallback)
        }
        tester.src = primary
      })
      .catch(() => null)
    return () => {
      mounted = false
    }
  }, [pathname, initialTenant])

  return null
}
