import axios from 'axios';
import { getApiBaseUrl } from './apiBase';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
  },
});

const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
if (tenantSlug) {
  api.defaults.headers.common['x-tenant'] = tenantSlug;
}
