import React, { useMemo, useEffect, useState } from 'react';
import { Lock, Unlock, Loader2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { getMe } from '../services/authService';

interface PermissionListProps {
  filter?: string;
}

type RawPermissions =
  | string[]                               // ["BillingRecord_create", ...]
  | Record<string, string>                 // { BillingRecord: "create,read,update", ... }
  | null
  | undefined;

type PermissionGroup = { resource: string; actions: string[] };

const normalizePermissions = (perms: RawPermissions): string[] => {
  // Case 1: already normalized array
  if (Array.isArray(perms)) {
    return perms
      .filter((p): p is string => typeof p === 'string' && p.includes('_'));
  }

  // Case 2: map from BE: { Resource: "create,read,update" }
  if (perms && typeof perms === 'object') {
    const out: string[] = [];

    for (const [resource, actionsStr] of Object.entries(perms)) {
      const actions = String(actionsStr)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      for (const action of actions) {
        out.push(`${resource}_${action}`);
      }
    }

    return out;
  }

  return [];
};

const groupPermissions = (permissions: string[]): PermissionGroup[] => {
  // resource -> set(actions)
  const groups: Record<string, Set<string>> = {};

  for (const perm of permissions) {
    const idx = perm.indexOf('_');
    if (idx <= 0) continue;

    const resource = perm.slice(0, idx);
    const action = perm.slice(idx + 1);

    if (!resource || !action) continue;

    if (!groups[resource]) groups[resource] = new Set<string>();
    groups[resource].add(action);
  }

  return Object.entries(groups)
    .map(([resource, actionSet]) => ({
      resource,
      actions: Array.from(actionSet).sort()
    }))
    .sort((a, b) => a.resource.localeCompare(b.resource));
};

const PermissionList: React.FC<PermissionListProps> = ({ filter }) => {
  const { t } = useAppContext();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const userProfile: any = await getMe();
        const normalized = normalizePermissions(userProfile?.permissions);

        if (!cancelled) setPermissions(normalized);
      } catch (err) {
        console.error('Failed to fetch permissions', err);
        if (!cancelled) setError('Could not load permissions from server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPermissions();

    return () => {
      cancelled = true; // tránh setState khi unmount
    };
  }, []);

  const groupedPermissions = useMemo(() => {
    return groupPermissions(permissions);
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    const q = (filter || '').trim().toLowerCase();
    if (!q) return groupedPermissions;
    return groupedPermissions.filter(g => g.resource.toLowerCase().includes(q));
  }, [filter, groupedPermissions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <Loader2 size={32} className="animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 text-sm">Synchronizing permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
        <AlertTriangle size={32} className="text-red-500 mb-2" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredGroups.map(group => (
        <div
          key={group.resource}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all"
        >
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
                key={`${group.resource}_${action}`}
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
