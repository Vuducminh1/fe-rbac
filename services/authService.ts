import { UserProfile, Role, Branch, Department, Seniority, LoginResponse } from '../types';
import { api, ApiError } from './apiClient';

const TOKEN_KEY = 'accessToken';
const PROFILE_KEY = 'userProfile';

// Helper to expand CRUD shorthand
const expandPerms = (resource: string, actions: string): string[] => {
  const result: string[] = [];
  if (actions.includes('C')) result.push(`${resource}_create`);
  if (actions.includes('R')) result.push(`${resource}_read`);
  if (actions.includes('U')) result.push(`${resource}_update`);
  if (actions.includes('A')) result.push(`${resource}_approve`);
  return result;
};

// Define permissions based on "Ma trận phân quyền"
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Doctor: [
    ...expandPerms('PatientProfile', 'R'),
    ...expandPerms('MedicalRecord', 'CRU'),
    ...expandPerms('ClinicalNote', 'CR'),
    ...expandPerms('VitalSigns', 'R'),
    ...expandPerms('Prescription', 'CRUA'),
    ...expandPerms('LabOrder', 'CR'),
    ...expandPerms('LabResult', 'R'),
    ...expandPerms('MedicalReport', 'R'),
    ...expandPerms('ImagingOrder', 'CR'),
    ...expandPerms('ImagingResult', 'R'),
  ],
  Nurse: [
    ...expandPerms('PatientProfile', 'R'),
    ...expandPerms('MedicalRecord', 'R'),
    ...expandPerms('ClinicalNote', 'R'),
    ...expandPerms('VitalSigns', 'CRU'),
    ...expandPerms('LabResult', 'R'),
    ...expandPerms('ImagingResult', 'R'),
  ],
  Receptionist: [
    ...expandPerms('PatientProfile', 'CRU'),
    ...expandPerms('Appointment', 'CRU'),
    ...expandPerms('Admission', 'CR'),
  ],
  Cashier: [
    ...expandPerms('BillingRecord', 'CRU'),
    ...expandPerms('Invoice', 'CRU'),
    ...expandPerms('FinancialReport', 'R'),
    ...expandPerms('InsuranceClaim', 'CR'),
  ],
  HR: [
    ...expandPerms('StaffProfile', 'CRU'),
    ...expandPerms('WorkSchedule', 'CRU'),
    ...expandPerms('OperationReport', 'R'),
  ],
  Manager: [
    ...expandPerms('StaffProfile', 'R'),
    ...expandPerms('WorkSchedule', 'R'),
    ...expandPerms('MedicalReport', 'R'),
    ...expandPerms('FinancialReport', 'R'),
    ...expandPerms('OperationReport', 'R'),
  ],
  ITAdmin: [
    ...expandPerms('SystemConfig', 'RU'),
    ...expandPerms('AccessPolicy', 'R'),
    ...expandPerms('AuditLog', 'R'),
  ],
  SecurityAdmin: [
    ...expandPerms('SystemConfig', 'R'),
    ...expandPerms('AccessPolicy', 'RU'),
    ...expandPerms('AuditLog', 'R'),
    ...expandPerms('IncidentCase', 'CRU'),
  ]
};

// Mock database
const MOCK_USERS_DB: Record<string, { role: Role, branch: Branch, dept: Department, seniority: Seniority }> = {
  'admin': { role: 'SecurityAdmin', branch: 'CN_HN', dept: 'Security', seniority: 'Head' },
  'u0000': { role: 'Doctor', branch: 'CN_HN', dept: 'Khoa_Noi', seniority: 'Senior' },
  'u0001': { role: 'Doctor', branch: 'CN_HN', dept: 'Khoa_Ngoai', seniority: 'Senior' },
  'u0002': { role: 'Doctor', branch: 'CN_HCM', dept: 'Khoa_Noi', seniority: 'Senior' },
  'u0003': { role: 'Nurse', branch: 'CN_HN', dept: 'Khoa_Noi', seniority: 'Junior' },
  'u0004': { role: 'Nurse', branch: 'CN_HN', dept: 'Khoa_Ngoai', seniority: 'Senior' },
  'u0006': { role: 'Receptionist', branch: 'CN_HN', dept: 'Phong_TiepDon', seniority: 'Senior' },
  'u0010': { role: 'HR', branch: 'CN_HN', dept: 'Phong_NhanSu', seniority: 'Senior' },
  'u0014': { role: 'ITAdmin', branch: 'CN_HN', dept: 'IT', seniority: 'Lead' },
};

export const login = async (username: string, password: string): Promise<UserProfile> => {
    let userProfile: UserProfile;

    try {
      // 1. Try Real API
    const response = await api.post<any>('/api/auth/login', { username, password });
      const apiUser = response;
      
      // Adapt Backend Response to Frontend UserProfile
      userProfile = {
        accessToken: apiUser.accessToken,
        tokenType: apiUser.tokenType,
        userId: apiUser.userId,
        username: apiUser.username,
        role: apiUser.role,
        department: apiUser.department,
        branch: apiUser.branch,
        seniority: 'Senior', // Defaulting as BE might not return this yet
        license: (apiUser.role === 'Doctor' || apiUser.role === 'Nurse') ? 'Yes' : 'No',
        permissions: ROLE_PERMISSIONS[apiUser.role as Role] || []
      };

    } catch (error: any) {
      console.warn("Backend API not reachable or failed, falling back to Mock Data.", error);
      
      // 2. Fallback to Mock Data
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
    const userConf = MOCK_USERS_DB[username];
      
      if (!userConf) {
        throw new Error("User not found (Mock)");
      }

      userProfile = {
        accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(username)}.${Date.now()}`,
        tokenType: 'Bearer',
        userId: username.toUpperCase(),
        username: username,
        role: userConf.role,
        department: userConf.dept,
        branch: userConf.branch,
        seniority: userConf.seniority,
        license: userConf.role === 'Doctor' || userConf.role === 'Nurse' ? 'Yes' : 'No',
        permissions: ROLE_PERMISSIONS[userConf.role] || []
      };
    }

    // Persist Session to LocalStorage
    localStorage.setItem(TOKEN_KEY, userProfile.accessToken);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));

    return userProfile;
};

export const logout = async () => {
      try {
          await api.post('/api/auth/logout', {});
      } catch (e) {
          // Ignore error on logout
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
};

export const getStoredUser = (): UserProfile | null => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_KEY);
      if (!storedProfile) return null;
      return JSON.parse(storedProfile);
    } catch (error) {
      console.error("Failed to parse stored user profile", error);
      return null;
  }
};

export const getMe = () => api.get<UserProfile>('/api/auth/me');
