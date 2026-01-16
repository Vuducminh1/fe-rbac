import React, { useState, useEffect } from 'react';
import { UserProfile, Role, Branch, Department, Seniority, BackendUser } from '../types';
import { emrService } from '../services/emrService';
import { useAppContext } from '../contexts/AppContext';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Shield, 
  X, 
  Save, 
  Check, 
  Plus, 
  Key, 
  Briefcase, 
  MapPin, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { ROLE_PERMISSIONS } from '../services/authService';

const AdminPanel: React.FC = () => {
  const { t } = useAppContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>('general');

  // Permission Edit State
  const [newPermResource, setNewPermResource] = useState('');
  const [newPermAction, setNewPermAction] = useState('read');

  const roles: Role[] = ['Doctor', 'Nurse', 'Receptionist', 'Cashier', 'HR', 'Manager', 'ITAdmin', 'SecurityAdmin'];
  const branches: Branch[] = ['CN_HN', 'CN_HCM'];
  const departments: Department[] = ['Khoa_Noi', 'Khoa_Ngoai', 'Phong_TiepDon', 'Phong_TaiChinh', 'Phong_NhanSu', 'IT', 'Security'];
  const seniorities: Seniority[] = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Head'];
  const resources = [
    'PatientProfile', 'MedicalRecord', 'ClinicalNote', 'VitalSigns', 'Prescription', 
    'LabOrder', 'LabResult', 'MedicalReport', 'ImagingOrder', 'ImagingResult', 
    'Appointment', 'Admission', 'BillingRecord', 'Invoice', 'FinancialReport', 
    'InsuranceClaim', 'StaffProfile', 'WorkSchedule', 'OperationReport', 
    'SystemConfig', 'AccessPolicy', 'AuditLog', 'IncidentCase'
  ];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // The API now returns { users: BackendUser[], statistics: ... }
      const response = await emrService.users.getAll();
      
      if (response && Array.isArray(response.users)) {
        // Map BackendUser DTO to Frontend UserProfile
        const mappedUsers: UserProfile[] = response.users.map((backendUser: BackendUser) => {
          
          // Flatten permissions: { "MedicalRecord": "create,read" } -> ["MedicalRecord_create", "MedicalRecord_read"]
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
            license: backendUser.hasLicense ? 'Yes' : 'No', // Map boolean to enum
            permissions: flatPermissions,
            accessToken: 'dummy_admin_view', // Not needed for admin list
            tokenType: 'Bearer'
          };
        });
        
        setUsers(mappedUsers);
      } else {
        // Fallback or empty state
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser({
      username: '',
      role: 'Doctor',
      branch: 'CN_HN',
      department: 'Khoa_Noi',
      seniority: 'Junior',
      license: 'No',
      permissions: ROLE_PERMISSIONS['Doctor']
    });
    setModalMode('create');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser({ ...user });
    setModalMode('edit');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('confirm_delete'))) {
        try {
            // await emrService.users.delete(userId);
            // setUsers(users.filter(u => u.userId !== userId));
        } catch (e) {
            alert('Failed to delete user');
        }
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
        if (modalMode === 'create') {
            const newUser = {
                ...editingUser,
                userId: editingUser.username?.toLowerCase() || 'new_user',
                tokenType: 'Bearer',
                accessToken: 'dummy'
            };
            // const response = await emrService.users.create(newUser);
            // const addedUser = response || { ...newUser, userId: `u${Date.now()}` }; 
            // setUsers([...users, addedUser as UserProfile]);
        } else {
            // Update logic
            if (editingUser.userId) {
                // await emrService.users.update(editingUser.userId, editingUser);
                setUsers(users.map(u => u.userId === editingUser.userId ? editingUser as UserProfile : u));
            }
        }
        setIsModalOpen(false);
    } catch (err) {
        console.error("Save failed", err);
        alert("Failed to save user changes. API might be unreachable.");
    }
  };

  const handleAddPermission = () => {
    if (!newPermResource || !newPermAction) return;
    const permString = `${newPermResource}_${newPermAction}`;
    
    if (editingUser?.permissions && !editingUser.permissions.includes(permString)) {
        setEditingUser({
            ...editingUser,
            permissions: [...editingUser.permissions, permString]
        });
    }
  };

  const handleRemovePermission = (perm: string) => {
    if (editingUser?.permissions) {
        setEditingUser({
            ...editingUser,
            permissions: editingUser.permissions.filter(p => p !== perm)
        });
    }
  };

  // When role changes in Create mode, reset permissions to default
  const handleRoleChange = (newRole: Role) => {
    if (editingUser) {
        setEditingUser({
            ...editingUser,
            role: newRole,
            permissions: ROLE_PERMISSIONS[newRole] || []
        });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('admin_panel')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('admin_subtitle')}</p>
            </div>
            <button 
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-lg shadow-teal-600/20 transition-all active:scale-95"
            >
                <UserPlus size={18} />
                {t('add_user')}
            </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder={t('search_users')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-white transition-all shadow-sm"
            />
        </div>

        {/* User Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">User</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Role & Dept</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Branch</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                    Loading users from backend...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                                    No users found
                                </td>
                            </tr>
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
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                                                {u.role}
                                            </span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.department}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600 dark:text-slate-300">{u.branch}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(u)}
                                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.userId)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal Overlay */}
        {isModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                            {modalMode === 'create' ? t('create_user') : t('edit_user')}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            General Info
                        </button>
                        <button 
                            onClick={() => setActiveTab('permissions')}
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Permissions ({editingUser.permissions?.length || 0})
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {activeTab === 'general' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        value={editingUser.username || ''}
                                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                        disabled={modalMode === 'edit'} // Immutable username usually
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        value={editingUser.role}
                                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        value={editingUser.department}
                                        onChange={(e) => setEditingUser({...editingUser, department: e.target.value as Department})}
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Branch</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        value={editingUser.branch}
                                        onChange={(e) => setEditingUser({...editingUser, branch: e.target.value as Branch})}
                                    >
                                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seniority</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        value={editingUser.seniority}
                                        onChange={(e) => setEditingUser({...editingUser, seniority: e.target.value as Seniority})}
                                    >
                                        {seniorities.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Add Permission Form */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <Key size={16} /> Grant New Permission
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select 
                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                            value={newPermResource}
                                            onChange={(e) => setNewPermResource(e.target.value)}
                                        >
                                            <option value="">Select Resource...</option>
                                            {resources.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <select 
                                            className="w-full sm:w-32 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                            value={newPermAction}
                                            onChange={(e) => setNewPermAction(e.target.value)}
                                        >
                                            {actions.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                        <button 
                                            onClick={handleAddPermission}
                                            disabled={!newPermResource}
                                            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Permission List */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 mb-2">Current Permissions</h4>
                                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
                                        {editingUser.permissions && editingUser.permissions.length > 0 ? (
                                            editingUser.permissions.map(perm => {
                                                const [res, act] = perm.split('_');
                                                return (
                                                    <span key={perm} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group">
                                                        <span className="font-semibold">{res}</span>
                                                        <span className="text-slate-400">/</span>
                                                        <span>{act}</span>
                                                        <button 
                                                            onClick={() => handleRemovePermission(perm)}
                                                            className="ml-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No permissions assigned.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;