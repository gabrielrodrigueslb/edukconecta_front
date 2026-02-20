const BASE_DOMAIN = 'edukconecta.com';

function extractSubdomain(hostname: string) {
  const host = hostname.toLowerCase();

  if (host === BASE_DOMAIN || host === `api.${BASE_DOMAIN}`) {
    return null;
  }

  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = host.slice(0, -(BASE_DOMAIN.length + 1));
    if (!sub || sub === 'www' || sub === 'api') return null;
    return sub.split('.')[0];
  }

  if (host.endsWith('.localhost')) {
    const sub = host.split('.')[0];
    return sub || null;
  }

  return null;
}

export function getTenantSlug() {
  const envSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (envSlug) return envSlug;

  if (typeof window === 'undefined') return null;
  return extractSubdomain(window.location.hostname);
}

export function getTenantHeaders(): Record<string, string> {
  const slug = getTenantSlug();
  return slug ? { 'x-tenant': slug } : {};
}
