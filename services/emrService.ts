import { api } from './apiClient';
import { AuthorizationCheckRequest, AuthorizationCheckResponse } from '../types';

/**
 * EMR Service Layer
 * Maps 1:1 to the Backend Controllers defined in the EMR Auth Service documentation.
 */
export const emrService = {
  
  // ===========================================================================
  // 🛡️ Authorization & Audit (Core)
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

  users: {
    getAll: () => api.get('/api/users'),
    getById: (userId: string) => api.get(`/api/users/${userId}`),
    getByDepartment: (dept: string) => api.get(`/api/users/department/${dept}`),
    getByBranch: (branch: string) => api.get(`/api/users/branch/${branch}`),
  },

  // ===========================================================================
  // 🏥 Mock EMR APIs (Business Logic)
  // ===========================================================================

  // 1. Patient Management
  patient: {
    getAll: () => api.get('/api/mock/patients'),
    getById: (id: string) => api.get(`/api/mock/patients/${id}`),
    create: (data: any) => api.post('/api/mock/patients', data),
    update: (id: string, data: any) => api.put(`/api/mock/patients/${id}`, data),
    delete: (id: string) => api.delete(`/api/mock/patients/${id}`),
  },

  // 2. Medical Records
  medicalRecord: {
    getAll: () => api.get('/api/mock/medical-records'),
    getById: (id: string) => api.get(`/api/mock/medical-records/${id}`),
    create: (data: any) => api.post('/api/mock/medical-records', data),
    update: (id: string, data: any) => api.put(`/api/mock/medical-records/${id}`, data),
    export: (id: string) => api.post(`/api/mock/medical-records/${id}/export`, {}),
  },

  // 3. Clinical (Notes & Vitals)
  clinical: {
    getNotes: () => api.get('/api/mock/clinical/notes'),
    createNote: (data: any) => api.post('/api/mock/clinical/notes', data),
    getVitals: () => api.get('/api/mock/clinical/vitals'),
    createVital: (data: any) => api.post('/api/mock/clinical/vitals', data),
    updateVital: (id: string, data: any) => api.put(`/api/mock/clinical/vitals/${id}`, data),
  },

  // 4. Prescriptions
  prescription: {
    getAll: () => api.get('/api/mock/prescriptions'),
    create: (data: any) => api.post('/api/mock/prescriptions', data),
    update: (id: string, data: any) => api.put(`/api/mock/prescriptions/${id}`, data),
    approve: (id: string) => api.post(`/api/mock/prescriptions/${id}/approve`, {}),
  },

  // 5. Lab
  lab: {
    getOrders: () => api.get('/api/mock/lab/orders'),
    createOrder: (data: any) => api.post('/api/mock/lab/orders', data),
    getResults: () => api.get('/api/mock/lab/results'),
    getResultDetail: (id: string) => api.get(`/api/mock/lab/results/${id}`),
  },

  // 6. Imaging
  imaging: {
    getOrders: () => api.get('/api/mock/imaging/orders'),
    createOrder: (data: any) => api.post('/api/mock/imaging/orders', data),
    getResults: () => api.get('/api/mock/imaging/results'),
    getResultDetail: (id: string) => api.get(`/api/mock/imaging/results/${id}`),
  },

  // 7. Admissions
  admission: {
    getAll: () => api.get('/api/mock/admissions'),
    create: (data: any) => api.post('/api/mock/admissions', data),
    getTransfers: () => api.get('/api/mock/admissions/transfers'),
    createTransfer: (data: any) => api.post('/api/mock/admissions/transfers', data),
    getDischarges: () => api.get('/api/mock/admissions/discharge-summaries'),
    createDischarge: (data: any) => api.post('/api/mock/admissions/discharge-summaries', data),
  },

  // 8. Appointments
  appointment: {
    getAll: () => api.get('/api/mock/appointments'),
    create: (data: any) => api.post('/api/mock/appointments', data),
    update: (id: string, data: any) => api.put(`/api/mock/appointments/${id}`, data),
    checkIn: (id: string) => api.post(`/api/mock/appointments/${id}/check-in`, {}),
    cancel: (id: string) => api.post(`/api/mock/appointments/${id}/cancel`, {}),
  },

  // 9. Billing & Insurance
  billing: {
    getRecords: () => api.get('/api/mock/billing/records'),
    createRecord: (data: any) => api.post('/api/mock/billing/records', data),
    getInvoices: () => api.get('/api/mock/billing/invoices'),
    approveInvoice: (id: string) => api.post(`/api/mock/billing/invoices/${id}/approve`, {}),
    getClaims: () => api.get('/api/mock/billing/claims'),
    getFinancialReports: () => api.get('/api/mock/billing/reports/financial'),
  },

  // 10. Staff (HR)
  staff: {
    getProfiles: () => api.get('/api/mock/staff/profiles'),
    createProfile: (data: any) => api.post('/api/mock/staff/profiles', data),
    getSchedules: () => api.get('/api/mock/staff/schedules'),
    createSchedule: (data: any) => api.post('/api/mock/staff/schedules', data),
    getTraining: () => api.get('/api/mock/staff/training'),
    getOperationReports: () => api.get('/api/mock/staff/reports/operation'),
  },

  // 11. Reports
  report: {
    getMedicalReports: () => api.get('/api/mock/reports/medical'),
    getMedicalReportDetail: (id: string) => api.get(`/api/mock/reports/medical/${id}`),
    getSummary: () => api.get('/api/mock/reports/summary'),
  },

  // 12. System (IT/Security)
  system: {
    getConfig: () => api.get('/api/mock/system/config'),
    updateConfig: (id: string, data: any) => api.put(`/api/mock/system/config/${id}`, data),
    getPolicies: () => api.get('/api/mock/system/policies'),
    updatePolicy: (id: string, data: any) => api.put(`/api/mock/system/policies/${id}`, data),
    getAuditLogs: () => api.get('/api/mock/system/audit-logs'),
    getAuditStats: () => api.get('/api/mock/system/audit-logs/stats'),
  },

  // 13. Incidents (Security)
  incident: {
    getAll: () => api.get('/api/mock/incidents'),
    create: (data: any) => api.post('/api/mock/incidents', data),
    update: (id: string, data: any) => api.put(`/api/mock/incidents/${id}`, data),
    assign: (id: string, userId: string) => api.post(`/api/mock/incidents/${id}/assign`, { userId }),
    resolve: (id: string, resolution: string) => api.post(`/api/mock/incidents/${id}/resolve`, { resolution }),
    getStats: () => api.get('/api/mock/incidents/stats'),
  }
};