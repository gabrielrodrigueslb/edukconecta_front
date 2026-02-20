import axios from 'axios';
import { getApiBaseUrl } from './apiBase';
import { getTenantSlug } from './tenantSlug';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
  },
});

api.interceptors.request.use((config) => {
  const slug = getTenantSlug();
  if (slug) {
    if (!config.headers) config.headers = {} as typeof config.headers;
    config.headers['x-tenant'] = slug;
  }
  return config;
});
