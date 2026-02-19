import { getApiBaseUrl } from './apiBase'
import { withUploadsBase } from './uploads'

export type TenantPublic = {
  id: string
  name: string
  slug: string
  active?: boolean
  logoUrl?: string | null
  loginBannerUrl?: string | null
  faviconUrl?: string | null
  defaultAvatarUrl?: string | null
  themeColor?: string | null
}

let tenantCache: TenantPublic | null = null
let inflight: Promise<TenantPublic | null> | null = null

export async function getTenantPublic(): Promise<TenantPublic | null> {
  if (tenantCache) return tenantCache
  if (!inflight) {
    const base = getApiBaseUrl()
    inflight = fetch(`${base}/tenant/public`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = (await res.json()) as TenantPublic
        tenantCache = data
        return data
      })
      .catch(() => null)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function resolveTenantAsset(url?: string | null) {
  if (!url) return undefined
  return withUploadsBase(url)
}
