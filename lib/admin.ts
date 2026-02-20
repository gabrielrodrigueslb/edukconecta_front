import { getApiBaseUrl } from './apiBase';

export type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  logoUrl?: string | null;
  loginBannerUrl?: string | null;
  faviconUrl?: string | null;
  defaultAvatarUrl?: string | null;
  themeColor?: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  active: boolean;
  createdAt: string;
};

export async function listCurrentTenantUsers(): Promise<{
  tenant: AdminTenant;
  users: AdminUser[];
}> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/users`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Erro ao listar usuarios');
  }

  return res.json();
}

export async function updateCurrentTenant(formData: FormData): Promise<AdminTenant> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/tenant`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao atualizar instancia');
  }

  return data as AdminTenant;
}

export async function createCurrentTenantUser(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<AdminUser> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao criar usuario');
  }

  return data as AdminUser;
}

export async function updateCurrentTenantUser(
  userId: string,
  payload: { name?: string; email?: string; active?: boolean },
): Promise<AdminUser> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao atualizar usuario');
  }

  return data as AdminUser;
}

export async function resetCurrentTenantUserPassword(
  userId: string,
  password: string,
): Promise<AdminUser> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/users/${userId}/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao resetar senha');
  }

  return data as AdminUser;
}

export async function deleteCurrentTenantUser(userId: string): Promise<void> {
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Erro ao excluir usuario');
  }
}
