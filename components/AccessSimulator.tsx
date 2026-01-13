import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { Server, Loader2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { emrService } from '../services/emrService';
import { api } from '../services/apiClient';

interface AccessSimulatorProps {
  user: UserProfile;
}

type TypesPayload = {
  resourceTypes: Record<string, string>;
  usage: Record<string, string>;
  totalTypes?: number;
};

type EndpointAction = 'readById' | 'create' | 'update' | 'delete' | 'action';

type EndpointDef = {
  action: EndpointAction;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  label: string;
  desc: string;
  path: string; // contains /api/v2/mock/{slug}/{id}...
};

type ResourceCard = {
  slug: string;
  displayName: string;
  endpoints: EndpointDef[];
};

type CallState = {
  loading?: boolean;
  ok?: boolean;
  status?: number;
  message?: string;
  dataPreview?: string;
};

const buildEndpoints = (slug: string, displayName: string, usage: Record<string, string>): EndpointDef[] => {
  const replaceTemplate = (tpl: string) =>
    tpl
      .replace('{resourceType}', slug)
      .replace('{id}', '{id}')
      .replace('{action}', '{action}');

  const list: EndpointDef[] = [];

  // ✅ (mày đã yêu cầu bỏ GET ALL nên không có nữa)

  if (usage.getById) {
    list.push({
      action: 'readById',
      method: 'GET',
      label: `Get ${displayName} by id`,
      desc: replaceTemplate(usage.getById),
      path: `/api/v2/mock/{id}`,
    });
  }

  list.push({
    action: 'create',
    method: 'POST',
    label: `Create ${displayName}`,
    desc: replaceTemplate(usage.create || 'POST /api/v2/mock/{resourceType}'),
    path: `/api/v2/mock/${slug}`,
  });

  list.push({
    action: 'update',
    method: 'PUT',
    label: `Update ${displayName}`,
    desc: replaceTemplate(usage.update || 'PUT /api/v2/mock/{resourceType}/{id}'),
    path: `/api/v2/mock/${slug}/{id}`,
  });

  list.push({
    action: 'delete',
    method: 'DELETE',
    label: `Delete ${displayName}`,
    desc: replaceTemplate(usage.delete || 'DELETE /api/v2/mock/{resourceType}/{id}'),
    path: `/api/v2/mock/${slug}/{id}`,
  });

  if (usage.action) {
    list.push({
      action: 'action',
      method: 'POST',
      label: `Action on ${displayName}`,
      desc: replaceTemplate(usage.action),
      path: `/api/v2/mock/${slug}/{id}/{action}`,
    });
  }

  return list;
};

const getMethodBadgeClass = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'POST':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'PUT':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'DELETE':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

const AccessSimulator: React.FC<AccessSimulatorProps> = ({ user }) => {
  const { t } = useAppContext();

  const [typesPayload, setTypesPayload] = useState<TypesPayload | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // inputs for running endpoints that need id/action
  const [idBySlug, setIdBySlug] = useState<Record<string, string>>({});
  const [actionBySlug, setActionBySlug] = useState<Record<string, string>>({});
  const [callState, setCallState] = useState<Record<string, CallState>>({}); // key: `${slug}_${idx}`

  useEffect(() => {
    let cancelled = false;

    const fetchResourceTypes = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);

        const p = await emrService.meta.getResourceTypes();
        if (!p || typeof p !== 'object') throw new Error('Invalid response');
        if (!('resourceTypes' in p) || typeof (p as any).resourceTypes !== 'object') throw new Error('resourceTypes missing');
        if (!('usage' in p) || typeof (p as any).usage !== 'object') throw new Error('usage missing');

        if (!cancelled) setTypesPayload(p as TypesPayload);
      } catch (e) {
        console.error('getResourceTypes failed:', e);
        if (!cancelled) setConfigError('Failed to load resource types from server.');
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };

    fetchResourceTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const resources: ResourceCard[] = useMemo(() => {
    if (!typesPayload) return [];
    const { resourceTypes, usage } = typesPayload;

    return Object.entries(resourceTypes)
      .map(([slug, displayName]) => ({
        slug,
        displayName: String(displayName),
        endpoints: buildEndpoints(slug, String(displayName), usage),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [typesPayload]);

  const resolvePath = (tplPath: string, slug: string) => {
    const id = idBySlug[slug] || '';
    const act = actionBySlug[slug] || '';
    return tplPath.replace('{id}', id).replace('{action}', act);
  };

  const runEndpoint = async (slug: string, ep: EndpointDef, idx: number) => {
    const key = `${slug}_${idx}`;
    const url = resolvePath(ep.path, slug);

    // validate required params
    if (ep.path.includes('{id}') && !idBySlug[slug]) {
      setCallState(prev => ({
        ...prev,
        [key]: { ok: false, message: 'Missing id. Fill ID first.' },
      }));
      return;
    }
    if (ep.path.includes('{action}') && !actionBySlug[slug]) {
      setCallState(prev => ({
        ...prev,
        [key]: { ok: false, message: 'Missing action. Fill Action first.' },
      }));
      return;
    }

    setCallState(prev => ({ ...prev, [key]: { loading: true } }));

    try {
      let res: any;

      // apiClient unwraps data, but still throws on non-2xx
      if (ep.method === 'GET') {
        res = await api.get<any>(url);
      } else if (ep.method === 'POST') {
        res = await api.post<any>(url, {}); // create/action (body optional)
      } else if (ep.method === 'PUT') {
        res = await api.put<any>(url, {});  // update (demo empty body)
      } else {
        res = await api.delete<any>(url);
      }

      const preview = JSON.stringify(res, null, 2);
      setCallState(prev => ({
        ...prev,
        [key]: {
          loading: false,
          ok: true,
          message: 'OK',
          dataPreview: preview.length > 900 ? preview.slice(0, 900) + '\n...' : preview,
        },
      }));
    } catch (e: any) {
      const msg = e?.message || 'Request failed';
      const status = e?.status;
      setCallState(prev => ({
        ...prev,
        [key]: {
          loading: false,
          ok: false,
          status,
          message: status ? `HTTP ${status}: ${msg}` : msg,
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="text-teal-600 dark:text-teal-400" size={24} />
            {t('simulator_console')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Click method badges to call backend APIs.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Role: <span className="font-mono">{user.role}</span>
        </div>
      </div>

      {configLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Loader2 size={32} className="animate-spin text-teal-600 mb-4" />
          <p className="text-slate-500 font-medium">Fetching resource types from backend...</p>
        </div>
      )}

      {!configLoading && configError && (
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
          <AlertTriangle size={32} className="text-red-500 mb-2" />
          <p className="text-red-700 dark:text-red-400 font-bold mb-1">Configuration Error</p>
          <p className="text-red-600 dark:text-red-300 text-sm">{configError}</p>
        </div>
      )}

      {!configLoading && !configError && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {resources.map(r => (
            <div
              key={r.slug}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
            >
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{r.displayName}</h3>
                  <span className="text-xs font-mono text-slate-400">{r.slug}</span>
                </div>

                {/* inputs for ID + Action */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    value={idBySlug[r.slug] || ''}
                    onChange={(e) => setIdBySlug(prev => ({ ...prev, [r.slug]: e.target.value }))}
                    placeholder="ID (e.g. POL001)"
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none"
                  />
                  <input
                    value={actionBySlug[r.slug] || ''}
                    onChange={(e) => setActionBySlug(prev => ({ ...prev, [r.slug]: e.target.value }))}
                    placeholder="Action (e.g. approve)"
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {r.endpoints.map((ep, idx) => {
                  const key = `${r.slug}_${idx}`;
                  const st = callState[key];
                  const resolved = resolvePath(ep.path, r.slug);

                  return (
                    <div key={key} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* ✅ badge is now a real button */}
                        <button
                          type="button"
                          onClick={() => runEndpoint(r.slug, ep, idx)}
                          disabled={!!st?.loading}
                          className={`w-16 text-center text-[10px] font-bold px-2 py-1 rounded border transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${getMethodBadgeClass(ep.method)}`}
                          title={`Call ${resolved}`}
                        >
                          {st?.loading ? '...' : ep.method}
                        </button>

                        <div className="min-w-0">
                          <div className="text-sm font-mono text-slate-800 dark:text-slate-200 truncate">
                            {ep.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {ep.desc}
                          </div>

                          {/* result */}
                          {st?.message && (
                            <div
                              className={`mt-2 text-xs font-mono ${
                                st.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {st.message}
                            </div>
                          )}

                          {st?.dataPreview && (
                            <pre className="mt-2 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 overflow-auto max-h-40">
                              {st.dataPreview}
                            </pre>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
                        {resolved}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessSimulator;
