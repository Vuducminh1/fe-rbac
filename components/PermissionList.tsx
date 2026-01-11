import React, { useMemo } from 'react';
import { PermissionGroup } from '../types';
import { Lock, Unlock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface PermissionListProps {
  permissions: string[];
  filter?: string;
}

const PermissionList: React.FC<PermissionListProps> = ({ permissions, filter }) => {
  const { t } = useAppContext();
  
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    permissions.forEach(perm => {
      const [resource, action] = perm.split('_');
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(action);
    });
    return Object.entries(groups).map(([resource, actions]) => ({
      resource,
      actions
    }));
  }, [permissions]);

  const filteredGroups = filter 
    ? groupedPermissions.filter(g => g.resource.toLowerCase().includes(filter.toLowerCase()))
    : groupedPermissions;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredGroups.map((group) => (
        <div key={group.resource} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <span className="w-2 h-6 bg-teal-500 rounded-sm"></span>
              {group.resource}
            </h3>
            <Lock size={16} className="text-slate-300 dark:text-slate-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            {group.actions.map(action => (
              <span 
                key={action} 
                className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5
                  ${action === 'create' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : ''}
                  ${action === 'read' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' : ''}
                  ${action === 'update' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' : ''}
                  ${action === 'delete' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' : ''}
                `}
              >
                {action === 'read' && <Unlock size={10} />}
                {action.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      ))}
      {filteredGroups.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
          {t('no_policies')}
        </div>
      )}
    </div>
  );
};

export default PermissionList;