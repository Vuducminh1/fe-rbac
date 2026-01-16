import React, { useState, useEffect } from 'react';
import { UserProfile, Role, Branch, Department, Seniority, BackendUser, PendingPermissionRequest, PermissionStats } from '../types';
import { emrService } from '../services/emrService';
import { useAppContext } from '../contexts/AppContext';
import { 
  UserPlus, 
  Search, 
  X, 
  Save, 
  Check, 
  Plus, 
  Key, 
  Loader2,
  AlertTriangle, 
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Edit,
  User
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { t } = useAppContext();
  
  // Tabs for Main Section
  const [activeSection, setActiveSection] = useState<'users' | 'approvals'>('users');

  // --- Users State ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Permissions State ---
  const [pendingPerms, setPendingPerms] = useState<PendingPermissionRequest[]>([]);
  const [permStats, setPermStats] = useState<PermissionStats | null>(null);
  const [permsLoading, setPermsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> & { email?: string }>({});
  const [modalMode, setModalMode] = useState<'create' | 'transfer'>('create');
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>('general');
  const [transferReason, setTransferReason] = useState('');

  const roles: Role[] = ['Doctor', 'Nurse', 'Receptionist', 'Cashier', 'HR', 'Manager', 'ITAdmin', 'SecurityAdmin'];
  const branches: Branch[] = ['CN_HN', 'CN_HCM'];
  const departments: Department[] = ['Khoa_Noi', 'Khoa_Ngoai', 'Phong_TiepDon', 'Phong_TaiChinh', 'Phong_NhanSu', 'IT', 'Security'];
  const seniorities: Seniority[] = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Head'];

  useEffect(() => {
    if (activeSection === 'users') {
        fetchUsers();
    } else {
        fetchPermissionsData();
    }
  }, [activeSection]);

  // --- Users Logic ---

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(''); 
      const response = await emrService.users.getAll();
      
      let backendUsersList: BackendUser[] = [];
      if (response && Array.isArray(response.users)) {
        backendUsersList = response.users;
      } else if (response && Array.isArray(response)) {
         backendUsersList = response as BackendUser[];
      }

      const mappedUsers: UserProfile[] = backendUsersList.map((backendUser: BackendUser) => {
          const flatPermissions: string[] = [];
          if (backendUser.permissions) {
            Object.entries(backendUser.permissions).forEach(([resource, actionStr]) => {
              if (typeof actionStr === 'string') {
                actionStr.split(',').forEach(action => {
                   flatPermissions.push(`${resource}_${action.trim()}`);
                });
              }
            });
          }
          return {
            userId: backendUser.userId,
            username: backendUser.username,
            role: backendUser.role,
            department: backendUser.department,
            branch: backendUser.branch,
            seniority: backendUser.seniority,
            license: backendUser.hasLicense ? 'Yes' : 'No', 
            permissions: flatPermissions,
            accessToken: 'dummy_admin_view', 
            tokenType: 'Bearer'
          };
      });
      setUsers(mappedUsers);

    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setUsersError(err.message || "Failed to connect to Admin Service.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser({
      username: '',
      email: '',
      role: 'Doctor',
      branch: 'CN_HN',
      department: 'Khoa_Noi',
      seniority: 'Junior',
      license: 'No',
      permissions: [] 
    });
    setModalMode('create');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleOpenTransfer = (user: UserProfile) => {
    setEditingUser({ ...user });
    setTransferReason('');
    setModalMode('transfer');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
        if (modalMode === 'create') {
            const registerPayload = {
                username: editingUser.username,
                password: 'password123', 
                email: editingUser.email || `${editingUser.username?.toLowerCase()}@hospital.com`,
                department: editingUser.department,
                branch: editingUser.branch,
                role: editingUser.role,
                position: editingUser.role, 
                hasLicense: editingUser.license === 'Yes',
                seniority: editingUser.seniority,
                employmentType: 'FullTime'
            };

            await emrService.users.create(registerPayload);
            alert("User registered successfully.\nAI has generated pending permissions based on the role.");
            
        } else if (modalMode === 'transfer') {
             if (!transferReason) {
                 alert("Please provide a reason for transfer");
                 return;
             }
             await emrService.users.transfer(editingUser.userId!, {
                 newDepartment: editingUser.department,
                 newBranch: editingUser.branch,
                 newRole: editingUser.role,
                 newPosition: editingUser.role,
                 seniority: editingUser.seniority,
                 reason: transferReason
             });
             alert("Job transfer initiated.\nAI is analyzing new requirements.");
        } 
        
        setIsModalOpen(false);
        // Refresh and switch tab to show results
        fetchUsers();
        fetchPermissionsData();
        setActiveSection('approvals');

    } catch (err: any) {
        console.error("Save failed", err);
        alert(`Failed to save: ${err.message || 'API Error'}`);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    if (editingUser) {
        setEditingUser({ ...editingUser, role: newRole });
    }
  };

  // --- Permissions Logic ---

  const fetchPermissionsData = async () => {
      setPermsLoading(true);
      try {
          const [stats, pending] = await Promise.all([
              emrService.admin.permissions.getStats(),
              emrService.admin.permissions.getPending()
          ]);
          setPermStats(stats);
          setPendingPerms(pending);
      } catch (err) {
          console.error("Failed to load permission data", err);
      } finally {
          setPermsLoading(false);
      }
  };

  const handleApprove = async (id: number) => {
      setProcessingId(id);
      try {
          // Pass requestId and note
          await emrService.admin.permissions.approve(id, "Approved by admin via Admin Panel");
          
          // Optimistic UI Update
          setPendingPerms(prev => prev.filter(p => p.id !== id));
          if (permStats) setPermStats({ ...permStats, pending: permStats.pending - 1, approved: permStats.approved + 1 });
      } catch (err: any) {
          alert(`Failed to approve: ${err.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleReject = async (id: number) => {
      setProcessingId(id);
      try {
          // Pass requestId and note
          await emrService.admin.permissions.reject(id, "Rejected by admin via Admin Panel");
          
          // Optimistic UI Update
          setPendingPerms(prev => prev.filter(p => p.id !== id));
          if (permStats) setPermStats({ ...permStats, pending: permStats.pending - 1, rejected: permStats.rejected + 1 });
      } catch (err: any) {
          alert(`Failed to reject: ${err.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleApproveAllForUser = async (dbId: number) => {
      if(!confirm("Approve all pending permissions for this user?")) return;
      try {
          await emrService.admin.permissions.approveAllForUser(dbId);
          fetchPermissionsData(); // Refresh list to get new state
      } catch (err) {
          alert("Failed to approve all");
      }
  };


  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('admin_panel')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('admin_subtitle')}</p>
            </div>
            
            {/* Section Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                    onClick={() => setActiveSection('users')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSection === 'users' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveSection('approvals')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeSection === 'approvals' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    {t('pending_requests')}
                    {permStats && permStats.pending > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{permStats.pending}</span>
                    )}
                </button>
            </div>
        </div>

        {/* ---------------- USERS SECTION ---------------- */}
        {activeSection === 'users' && (
            <div className="space-y-6 animate-fadeIn">
                 <div className="flex gap-2 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('search_users')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => fetchUsers()} className="p-2.5 text-slate-500 hover:text-teal-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <RefreshCw size={20} className={`${usersLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95">
                            <UserPlus size={18} />
                            <span className="hidden sm:inline">{t('add_user')}</span>
                        </button>
                    </div>
                 </div>

                 {usersError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Connection Error</h3>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{usersError}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{t('username')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{t('role')} / {t('department')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{t('branch')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{t('active')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {usersLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Loading...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No users found</td></tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                                        {u.role.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-white">{u.username}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{u.userId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">{u.role}</span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.department}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-slate-600 dark:text-slate-300">{u.branch}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenTransfer(u)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors" title={t('edit_user')}><Edit size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* ---------------- PENDING APPROVALS SECTION ---------------- */}
        {activeSection === 'approvals' && (
            <div className="space-y-6 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('pending_requests')}</p>
                            <p className="text-2xl font-bold text-amber-600">{permStats?.pending || 0}</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600"><Clock size={24} /></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('total_approved')}</p>
                            <p className="text-2xl font-bold text-emerald-600">{permStats?.approved || 0}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600"><CheckCircle size={24} /></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">{t('total_rejected')}</p>
                            <p className="text-2xl font-bold text-red-600">{permStats?.rejected || 0}</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600"><XCircle size={24} /></div>
                    </div>
                </div>

                <div className="flex justify-end">
                     <button onClick={fetchPermissionsData} className="p-2 text-slate-500 hover:text-teal-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm"><RefreshCw size={20} className={permsLoading ? 'animate-spin' : ''} /></button>
                </div>

                {/* Pending Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">User</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Permission Request</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">AI Analysis</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Change</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {permsLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Loading Requests...</td></tr>
                            ) : pendingPerms.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic flex flex-col items-center"><ShieldCheck size={32} className="text-emerald-500 mb-2 opacity-50" />No pending permissions found.</td></tr>
                            ) : (
                                pendingPerms.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{req.username}</p>
                                                    <p className="text-xs text-slate-500">{req.userRole} • {req.branch}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Key size={14} className="text-slate-400" />
                                                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                                    {req.permissionKey?.replace(':all', '')}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${req.requestType === 'JOB_TRANSFER' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {req.requestType ? req.requestType.replace('_', ' ') : 'NEW'}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500" style={{ width: `${(req.confidence * 100)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{(req.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${req.changeType === 'ADD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                {req.changeType === 'ADD' ? <Plus size={12} /> : <X size={12} />}
                                                {req.changeType}
                                             </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                                                    title={t('approve')}
                                                >
                                                    {processingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                                    title={t('reject')}
                                                >
                                                     {processingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Bulk Action Helper */}
                {pendingPerms.length > 0 && (
                    <div className="flex justify-end pt-2">
                        {/* <button 
                            onClick={() => {
                                const userIds = Array.from(new Set(pendingPerms.map(p => p.userDbId)));
                                if(userIds.length > 0) handleApproveAllForUser(userIds[0]);
                            }}
                            className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                        >
                            {t('approve_all')} <ArrowRight size={12} />
                        </button> */}
                    </div>
                )}
            </div>
        )}

        {/* Modal Overlay */}
        {isModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                            {modalMode === 'create' && t('create_user')}
                            {modalMode === 'transfer' && t('edit_user')}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    
                    {/* Only show tabs for Create, not Transfer */}
                    {modalMode !== 'transfer' && modalMode !== 'create' && (
                        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
                            <button onClick={() => setActiveTab('general')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500'}`}>{t('general_info')}</button>
                            <button onClick={() => setActiveTab('permissions')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500'}`}>{t('permissions')} ({editingUser.permissions?.length || 0})</button>
                        </div>
                    )}
                    
                    <div className="p-6 overflow-y-auto flex-1">
                        {modalMode === 'transfer' ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-semibold">{t('current_position')}:</p>
                                    <p>{editingUser.role} - {editingUser.department} ({editingUser.branch})</p>
                                </div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">{t('new_position_details')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('new_role')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.role} onChange={(e) => handleRoleChange(e.target.value as Role)}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('new_dept')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.department} onChange={(e) => setEditingUser({...editingUser, department: e.target.value as Department})}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('new_branch')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.branch} onChange={(e) => setEditingUser({...editingUser, branch: e.target.value as Branch})}>{branches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                                    <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('seniority')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.seniority} onChange={(e) => setEditingUser({...editingUser, seniority: e.target.value as Seniority})}>{seniorities.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('transfer_reason')}</label>
                                    <textarea 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-24"
                                        placeholder="e.g., Requested by Head of Department..."
                                        value={transferReason}
                                        onChange={(e) => setTransferReason(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="text-xs text-slate-500 italic">
                                    {t('pending_permissions_notice')}
                                </div>
                            </div>
                        ) : (
                            // CREATE MODE (and default General view)
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('username')}</label><input type="text" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.username || ''} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} /></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label><input type="email" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.email || ''} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} placeholder="auto-generated if empty" /></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('role')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.role} onChange={(e) => handleRoleChange(e.target.value as Role)}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('department')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.department} onChange={(e) => setEditingUser({...editingUser, department: e.target.value as Department})}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('branch')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.branch} onChange={(e) => setEditingUser({...editingUser, branch: e.target.value as Branch})}>{branches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('seniority')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.seniority} onChange={(e) => setEditingUser({...editingUser, seniority: e.target.value as Seniority})}>{seniorities.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('license_status')}</label><select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" value={editingUser.license} onChange={(e) => setEditingUser({...editingUser, license: e.target.value as 'Yes'|'No'})}><option value="Yes">Yes</option><option value="No">No</option></select></div>
                                {modalMode === 'create' && (
                                     <div className="space-y-2"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('password')}</label><input type="password" value="password123" disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500" /></div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg shadow-teal-600/20 active:scale-95">
                            <Save size={18} />
                            {modalMode === 'transfer' ? t('initiate_transfer') : t('create_user')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;