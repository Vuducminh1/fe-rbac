import { api } from './apiClient';
import {
  AuthorizationCheckRequest,
  AuthorizationCheckResponse,
  UserProfile,
  AdminUserListResponse
} from '../types';

type TypesPayload = {
  resourceTypes: Record<string, string>;
  usage?: Record<string, string>;
  totalTypes?: number;
};

export const emrService = {
  // ===========================================================================
  // 🧑‍💻 Auth / Session
  // ===========================================================================
  auth: {
    me: () => api.get<UserProfile>('/api/auth/me'),
  },

  // ===========================================================================
  // 🛡️ Authorization & Audit
  // ===========================================================================
  authz: {
    check: (request: AuthorizationCheckRequest) =>
      api.post<AuthorizationCheckResponse>('/api/authz/check', request),

    checkPermission: (resource: string, action: string) =>
      api.get(`/api/authz/permission?resource=${encodeURIComponent(resource)}&action=${encodeURIComponent(action)}`),

    checkBatch: (requests: AuthorizationCheckRequest[]) =>
      api.post('/api/authz/check-batch', requests),
  },

  audit: {
    getAll: () => api.get('/api/audit'),
    getByUser: (userId: string) => api.get(`/api/audit/user/${encodeURIComponent(userId)}`),
    getHighRisk: () => api.get('/api/audit/high-risk'),
    getDenied: () => api.get('/api/audit/denied'),
  },

  users: {
    getAll: () => api.get<AdminUserListResponse>('/api/users/admin/all'),
    getById: (userId: string) => api.get(`/api/users/${encodeURIComponent(userId)}`),
    getByDepartment: (dept: string) => api.get(`/api/users/department/${encodeURIComponent(dept)}`),
    getByBranch: (branch: string) => api.get(`/api/users/branch/${encodeURIComponent(branch)}`),
  },

  // ===========================================================================
  // ⚙️ Metadata & Configuration (Unified Mock Controller)
  // ===========================================================================
  meta: {
    getResourceTypes: () => api.get<TypesPayload>('/api/v2/mock/types'),
  },

  // ===========================================================================
  // 🧪 Unified Mock APIs (đúng theo backend /api/v2/mock/{resourceType}...)
  // ===========================================================================
  mock: {
    getAll: (resourceType: string) =>
      api.get(`/api/v2/mock/${resourceType}`),

    getById: (resourceType: string, id: string) =>
      api.get(`/api/v2/mock/${resourceType}/${id}`),

    create: (resourceType: string, data?: any) =>
      api.post(`/api/v2/mock/${resourceType}`, data ?? {}),

    update: (resourceType: string, id: string, data?: any) =>
      api.put(`/api/v2/mock/${resourceType}/${id}`, data ?? {}),

    delete: (resourceType: string, id: string) =>
      api.delete(`/api/v2/mock/${resourceType}/${id}`),

    action: (resourceType: string, id: string, action: string, data?: any) =>
      api.post(`/api/v2/mock/${resourceType}/${id}/${action}`, data ?? {}),
  },
};
