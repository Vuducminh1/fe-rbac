
export type Role = 
  | 'Doctor' 
  | 'Nurse' 
  | 'Receptionist' 
  | 'Cashier' 
  | 'HR' 
  | 'Manager' 
  | 'ITAdmin' 
  | 'SecurityAdmin';

export type Branch = 'CN_HN' | 'CN_HCM';

export type Department = 
  | 'Khoa_Noi' 
  | 'Khoa_Ngoai' 
  | 'Phong_TiepDon' // Reception
  | 'Phong_TaiChinh' // Finance
  | 'Phong_NhanSu' // HR
  | 'IT' 
  | 'Security';

export type Seniority = 'Junior' | 'Senior' | 'Intern' | 'Lead' | 'Head' | 'Mid'; // Added Mid based on JSON
export type LicenseStatus = 'Yes' | 'No';

export interface UserProfile {
  accessToken: string;
  tokenType: string;
  userId: string;
  username: string;
  role: Role;
  department: Department;
  branch: Branch;
  seniority: Seniority; 
  license: LicenseStatus;
  permissions: string[]; 
}

// --- Backend DTOs based on provided JSON ---
export interface BackendUser {
  id: number;
  userId: string;
  username: string;
  email: string;
  role: Role;
  department: Department;
  branch: Branch;
  position: string;
  hasLicense: boolean;
  seniority: Seniority;
  employmentType: string;
  enabled: boolean;
  accountNonLocked: boolean;
  permissions: Record<string, string>; // e.g. "MedicalRecord": "create,read"
  // Added fields for stats mapping
  assignedPatientsCount?: number;
  rolePermissionsCount?: number;
  additionalPermissionsCount?: number;
  pendingPermissionsCount?: number;
}

export interface AdminUserListResponse {
  users: BackendUser[];
  statistics: any;
}

export interface PermissionGroup {
  resource: string;
  actions: string[];
}

export interface AccessLog {
  id: string;
  timestamp: Date;
  resource: string;
  action: string;
  status: 'Allowed' | 'Denied';
  riskScore?: number;
  denyReason?: string;
}

// --- Pending Permissions DTOs ---

export interface PendingPermissionRequest {
  id: number;
  userId: string;
  userDbId: number;
  username: string;
  userRole: string;
  department: string;
  branch: string;
  permissionId: number;
  permissionKey: string;
  resourceType: string;
  action: string;
  confidence: number;
  requestType: 'NEW_USER' | 'JOB_TRANSFER';
  changeType: 'ADD' | 'REMOVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface PermissionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// --- API DTOs ---

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    userId: string;
    username: string;
    role: Role;
    department: Department;
    branch: Branch;
  }
}

export interface AuthorizationCheckRequest {
  resourceType: string;
  action: string;
  resourceBranch?: string;
  patientId?: string;
}

export interface AuthorizationCheckResponse {
  allowed: boolean;
  policyId: string;
  denyReasons: string[];
  obligations: string[];
  riskScore: number;
}