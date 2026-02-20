import { getApiBaseUrl } from './apiBase'
import { withUploadsBase } from './uploads'
import { getTenantHeaders } from './tenantSlug'

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
      headers: {
        ...getTenantHeaders(),
      },
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


export function resolveTenantSlug(): string | null {
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if(envSlug) return envSlug

  if (typeof window === 'undefined') return null

  const host = window.location.hostname.toLocaleLowerCase()
  if(host === 'edukconecta.com' || host === 'www.edukconecta.com' || host.startsWith('api.')) return null
  
  if(host.endsWith('.edukconecta.com')) {
    const subdomain = host.split('.')[0]
    return subdomain || null
  }

  return null

}
