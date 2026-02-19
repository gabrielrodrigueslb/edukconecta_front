"use client"

import { useEffect } from "react"
import { getTenantPublic, resolveTenantAsset } from "@/lib/tenant"

export default function TenantFavicon() {
  useEffect(() => {
    let mounted = true
    getTenantPublic()
      .then((tenant) => {
        if (!mounted) return
        const favicon = resolveTenantAsset(tenant?.faviconUrl)
        if (!favicon) return
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
        if (!link) {
          link = document.createElement("link")
          link.rel = "icon"
          document.head.appendChild(link)
        }
        link.href = favicon
      })
      .catch(() => null)
    return () => {
      mounted = false
    }
  }, [])

  return null
}
