import { headers } from 'next/headers'
import { getApiBaseUrl } from './apiBase'
import type { TenantPublic } from './tenant'

const BASE_DOMAIN = 'edukconecta.com'

function extractSubdomain(hostname: string) {
  const host = hostname.toLowerCase()

  if (host === BASE_DOMAIN || host === `api.${BASE_DOMAIN}`) {
    return null
  }

  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = host.slice(0, -(BASE_DOMAIN.length + 1))
    if (!sub || sub === 'www' || sub === 'api') return null
    return sub.split('.')[0]
  }

  if (host.endsWith('.localhost')) {
    const sub = host.split('.')[0]
    return sub || null
  }

  return null
}

export function getTenantSlugFromHost(host?: string | null) {
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG
  if (envSlug) return envSlug
  if (!host) return null
  const hostname = host.split(':')[0]
  return extractSubdomain(hostname)
}

export async function getTenantPublicServer(): Promise<TenantPublic | null> {
  const headerStore = await headers()
  const host = headerStore.get('host')
  const slug = getTenantSlugFromHost(host)
  const apiBase = getApiBaseUrl()

  const res = await fetch(`${apiBase}/tenant/public`, {
    method: 'GET',
    headers: {
      ...(slug ? { 'x-tenant': slug } : {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  return (await res.json()) as TenantPublic
}
