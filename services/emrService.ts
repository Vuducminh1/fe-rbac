import { api } from './apiClient';
import { AuthorizationCheckRequest, AuthorizationCheckResponse, AdminUserListResponse, PermissionStats, PendingPermissionRequest } from '../types';

/**
 * EMR Service Layer
 * Tất cả các request đều đi qua api (Port 8080).
 * Backend sẽ chịu trách nhiệm gọi sang AI Service (Port 8000) nếu cần.
 */
export const emrService = {
  
  // ===========================================================================
  // 🛡️ Authorization & Audit
  // ===========================================================================
  
  authz: {
    check: (request: AuthorizationCheckRequest) => 
      api.post<AuthorizationCheckResponse>('/api/authz/check', request),
    
    checkPermission: (resource: string, action: string) => 
      api.get(`/api/authz/permission?resource=${resource}&action=${action}`),
    
    checkBatch: (requests: AuthorizationCheckRequest[]) => 
      api.post('/api/authz/check-batch', requests),
  },

  audit: {
    getAll: () => api.get('/api/audit'),
    getByUser: (userId: string) => api.get(`/api/audit/user/${userId}`),
    getHighRisk: () => api.get('/api/audit/high-risk'),
    getDenied: () => api.get('/api/audit/denied'),
  },

  // ===========================================================================
  // 👥 User Management & Transfer
  // ===========================================================================
  users: {
    // Lấy danh sách user cho admin
    getAll: () => api.get<AdminUserListResponse>('/api/users/admin/all'),
    
    getById: (userId: string) => api.get(`/api/users/admin/${userId}`),
    
    // Đăng ký user mới
    create: (userData: any) => api.post('/api/auth/register', userData),
    
    // Chuyển phòng ban
    transfer: (userId: string, transferData: any) => api.put(`/api/users/${userId}/transfer`, transferData),
  },

  // ===========================================================================
  // 🔑 Admin Pending Permissions (AI Features)
  // ===========================================================================
  admin: {
    permissions: {
      // GET /api/admin/permissions/stats
      getStats: () => api.get<PermissionStats>('/api/admin/permissions/stats'),
      
      // GET /api/admin/permissions/pending
      getPending: (type?: string) => api.get<PendingPermissionRequest[]>(type ? `/api/admin/permissions/pending/type/${type}` : '/api/admin/permissions/pending'),
      
      // GET /api/admin/permissions/pending/user/{dbId}
      getByUser: (dbId: number) => api.get<PendingPermissionRequest[]>(`/api/admin/permissions/pending/user/${dbId}`),
      
      // POST /api/admin/permissions/approve/{requestId}
      // Body: { notes: string }
      approve: (requestId: number, notes: string = "Approved by admin") => 
        api.post(`/api/admin/permissions/approve/${requestId}`, { notes }),
      
      // POST /api/admin/permissions/reject/{requestId}
      // Body: { notes: string }
      reject: (requestId: number, notes: string = "Rejected by admin") => 
        api.post(`/api/admin/permissions/reject/${requestId}`, { notes }),
      
      // POST /api/admin/permissions/approve-all-for-user/{dbId}
      approveAllForUser: (dbId: number, notes: string = "Batch approved by admin") => 
        api.post(`/api/admin/permissions/approve-all-for-user/${dbId}`, { notes }),
    }
  },

  // ===========================================================================
  // ⚙️ Metadata
  // ===========================================================================
  meta: {
    getResourceTypes: () => api.get('/api/v2/mock/types'),
  },

  // ===========================================================================
  // 🏥 Nghiệp vụ EMR (Mock APIs)
  // ===========================================================================
  patient: {
    getAll: () => api.get('/api/mock/patients'),
    getById: (id: string) => api.get(`/api/mock/patients/${id}`),
    create: (data: any) => api.post('/api/mock/patients', data),
    update: (id: string, data: any) => api.put(`/api/mock/patients/${id}`, data),
    delete: (id: string) => api.delete(`/api/mock/patients/${id}`),
  },
  medicalRecord: {
    getAll: () => api.get('/api/mock/medical-records'),
    getById: (id: string) => api.get(`/api/mock/medical-records/${id}`),
    create: (data: any) => api.post('/api/mock/medical-records', data),
    update: (id: string, data: any) => api.put(`/api/mock/medical-records/${id}`, data),
    export: (id: string) => api.post(`/api/mock/medical-records/${id}/export`, {}),
  },
  clinical: {
    getNotes: () => api.get('/api/mock/clinical/notes'),
    createNote: (data: any) => api.post('/api/mock/clinical/notes', data),
    getVitals: () => api.get('/api/mock/clinical/vitals'),
    createVital: (data: any) => api.post('/api/mock/clinical/vitals', data),
    updateVital: (id: string, data: any) => api.put(`/api/mock/clinical/vitals/${id}`, data),
  },
  prescription: {
    getAll: () => api.get('/api/mock/prescriptions'),
    create: (data: any) => api.post('/api/mock/prescriptions', data),
    update: (id: string, data: any) => api.put(`/api/mock/prescriptions/${id}`, data),
    approve: (id: string) => api.post(`/api/mock/prescriptions/${id}/approve`, {}),
  },
  lab: {
    getOrders: () => api.get('/api/mock/lab/orders'),
    createOrder: (data: any) => api.post('/api/mock/lab/orders', data),
    getResults: () => api.get('/api/mock/lab/results'),
    getResultDetail: (id: string) => api.get(`/api/mock/lab/results/${id}`),
  },
  imaging: {
    getOrders: () => api.get('/api/mock/imaging/orders'),
    createOrder: (data: any) => api.post('/api/mock/imaging/orders', data),
    getResults: () => api.get('/api/mock/imaging/results'),
    getResultDetail: (id: string) => api.get(`/api/mock/imaging/results/${id}`),
  },
  admission: {
    getAll: () => api.get('/api/mock/admissions'),
    create: (data: any) => api.post('/api/mock/admissions', data),
    getTransfers: () => api.get('/api/mock/admissions/transfers'),
    createTransfer: (data: any) => api.post('/api/mock/admissions/transfers', data),
    getDischarges: () => api.get('/api/mock/admissions/discharge-summaries'),
    createDischarge: (data: any) => api.post('/api/mock/admissions/discharge-summaries', data),
  },
  appointment: {
    getAll: () => api.get('/api/mock/appointments'),
    create: (data: any) => api.post('/api/mock/appointments', data),
    update: (id: string, data: any) => api.put(`/api/mock/appointments/${id}`, data),
    checkIn: (id: string) => api.post(`/api/mock/appointments/${id}/check-in`, {}),
    cancel: (id: string) => api.post(`/api/mock/appointments/${id}/cancel`, {}),
  },
  billing: {
    getRecords: () => api.get('/api/mock/billing/records'),
    createRecord: (data: any) => api.post('/api/mock/billing/records', data),
    getInvoices: () => api.get('/api/mock/billing/invoices'),
    approveInvoice: (id: string) => api.post(`/api/mock/billing/invoices/${id}/approve`, {}),
    getClaims: () => api.get('/api/mock/billing/claims'),
    getFinancialReports: () => api.get('/api/mock/billing/reports/financial'),
  },
  staff: {
    getProfiles: () => api.get('/api/mock/staff/profiles'),
    createProfile: (data: any) => api.post('/api/mock/staff/profiles', data),
    getSchedules: () => api.get('/api/mock/staff/schedules'),
    createSchedule: (data: any) => api.post('/api/mock/staff/schedules', data),
    getTraining: () => api.get('/api/mock/staff/training'),
    getOperationReports: () => api.get('/api/mock/staff/reports/operation'),
  },
  report: {
    getMedicalReports: () => api.get('/api/mock/reports/medical'),
    getMedicalReportDetail: (id: string) => api.get(`/api/mock/reports/medical/${id}`),
    getSummary: () => api.get('/api/mock/reports/summary'),
  },
  system: {
    getConfig: () => api.get('/api/mock/system/config'),
    updateConfig: (id: string, data: any) => api.put(`/api/mock/system/config/${id}`, data),
    getPolicies: () => api.get('/api/mock/system/policies'),
    updatePolicy: (id: string, data: any) => api.put(`/api/mock/system/policies/${id}`, data),
    getAuditLogs: () => api.get('/api/mock/system/audit-logs'),
    getAuditStats: () => api.get('/api/mock/system/audit-logs/stats'),
  },
  incident: {
    getAll: () => api.get('/api/mock/incidents'),
    create: (data: any) => api.post('/api/mock/incidents', data),
    update: (id: string, data: any) => api.put(`/api/mock/incidents/${id}`, data),
    assign: (id: string, userId: string) => api.post(`/api/mock/incidents/${id}/assign`, { userId }),
    resolve: (id: string, resolution: string) => api.post(`/api/mock/incidents/${id}/resolve`, { resolution }),
    getStats: () => api.get('/api/mock/incidents/stats'),
  }
};