import React from 'react';
import { UserProfile } from '../types';
import { 
  Building2, 
  Users, 
  Award, 
  MapPin, 
  FileCheck, 
  Activity,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../contexts/AppContext';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { t } = useAppContext();
  // Compute basic stats from permissions
  const readCount = user.permissions.filter(p => p.includes('_read')).length;
  const writeCount = user.permissions.filter(p => p.includes('_create') || p.includes('_update')).length;
  const deleteCount = user.permissions.filter(p => p.includes('_delete')).length;

  const chartData = [
    { name: 'Read', value: readCount, color: '#3b82f6' },
    { name: 'Write', value: writeCount, color: '#10b981' },
    { name: 'Delete', value: deleteCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{t('welcome')}, {user.username}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">{t('identity_overview')}</p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-sm font-medium text-slate-800 dark:text-slate-300 transition-colors">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           <p className="text-xs text-slate-400 font-mono mt-1">ID: {user.userId}</p>
        </div>
      </div>

      {/* Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between relative overflow-hidden transition-colors">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('role')}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{user.role}</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
               {user.seniority} {t('level')}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('department')}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{user.department}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <MapPin size={10} /> {user.branch}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('license_status')}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{user.license === 'Yes' ? t('active') : t('inactive')}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{t('verified')}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Award size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-colors">
           <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('total_policies')}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{user.permissions.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('effective_permissions')}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
            <FileCheck size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permission Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-1 flex flex-col transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-slate-400" />
            {t('access_type_dist')}
          </h3>
          <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-700 dark:text-white">{user.permissions.length}</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {chartData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Info */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 transition-colors">
           <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <Activity size={18} className="text-slate-400" />
            {t('recent_activity')}
          </h3>
          
          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:h-[80%] before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            <div className="relative pl-10">
               <span className="absolute left-3 top-1.5 w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-900 border-2 border-white dark:border-slate-900 ring-1 ring-teal-500"></span>
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('login_successful')}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{t('login_desc', { type: user.tokenType, branch: user.branch })}</p>
                 </div>
                 <span className="text-xs font-mono text-slate-400">{t('just_now')}</span>
               </div>
            </div>

            <div className="relative pl-10 opacity-60">
               <span className="absolute left-3 top-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></span>
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('policy_sync')}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{t('policy_desc')}</p>
                 </div>
                 <span className="text-xs font-mono text-slate-400">{t('min_ago')}</span>
               </div>
            </div>

             <div className="relative pl-10 opacity-40">
               <span className="absolute left-3 top-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900"></span>
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('token_refresh')}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{t('token_desc')}</p>
                 </div>
                 <span className="text-xs font-mono text-slate-400">{t('hr_ago')}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;