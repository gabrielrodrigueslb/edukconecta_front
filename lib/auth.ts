import { getApiBaseUrl } from './apiBase';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  tenantId?: string | null;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  active?: boolean;
}

export interface SessionData {
  user: SessionUser;
  tenant?: TenantInfo | null;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface loginRequestParams {
  email: string;
  password: string;
}

function tenantHeaders() {
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG;
  return slug ? { 'x-tenant': slug } : {};
}

export async function loginRequest({
  email,
  password,
}: loginRequestParams): Promise<LoginResponse> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tenantHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao logar');
  }

  return res.json();
}

export async function getSession(): Promise<SessionData | null> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...tenantHeaders(),
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data?.user) {
    return data as SessionData;
  }
  return { user: data };
}

export async function logoutRequest() {
  const apiBase = getApiBaseUrl();
  await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...tenantHeaders(),
    },
  });
}
