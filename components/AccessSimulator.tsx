import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Server, Loader2, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { emrService } from '../services/emrService';

interface AccessSimulatorProps {
  user: UserProfile;
}

/** Backend response shape (based on what you pasted) */
interface ResourceTypesApiResponse {
  success: boolean;
  message: string;
  data: {
    resourceTypes: Record<string, string>; // slug -> "WorkSchedule"
    usage?: Record<string, string>;
    totalTypes?: number;
  };
  timestamp?: string;
}

interface EndpointDef {
  action: string; // read/create/update/...
  method: string; // GET/POST/PUT/DELETE
  label: string;
  desc: string;
}

interface ResourceCard {
  slug: string;        // "schedule"
  displayName: string; // "WorkSchedule"  ✅ show on UI
  // endpoints will be fetched later by calling API riêng
  endpoints?: EndpointDef[];
  endpointsLoading?: boolean;
  endpointsError?: string | null;
  expanded?: boolean;
}

const AccessSimulator: React.FC<AccessSimulatorProps> = ({ user }) => {
  const { t } = useAppContext();

  const [resources, setResources] = useState<ResourceCard[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
  const fetchResourceTypes = async () => {
    try {
      setConfigLoading(true);
      setConfigError(null);

      const raw = await emrService.meta.getResourceTypes();

      const payload = (raw as any)?.data ? (raw as any).data : raw;

      const resourceTypes = (payload as any)?.resourceTypes;

      console.log("RAW:", raw);
      console.log("PAYLOAD:", payload);
      console.log("resourceTypes:", resourceTypes);

      if (!resourceTypes || typeof resourceTypes !== "object") {
        throw new Error("Invalid response: data.resourceTypes not found");
      }

      const arr = Object.entries(resourceTypes)
        .map(([slug, displayName]) => ({
          slug,
          displayName: String(displayName),
          expanded: false,
          endpoints: undefined,
          endpointsLoading: false,
          endpointsError: null,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      setResources(arr);
    } catch (e: any) {
      console.error("getResourceTypes failed:", e);
      // nếu axios: e.response?.status, e.response?.data sẽ có
      setConfigError(
        `Failed to load resource types. ${
          e?.response?.status ? `HTTP ${e.response.status}` : ""
        }`
      );
    } finally {
      setConfigLoading(false);
    }
  };

  fetchResourceTypes();
}, []);


  /**
   * TODO: bạn thay phần call API thật vào đây.
   * Ví dụ backend của bạn có endpoint:
   *  GET /api/v2/meta/resources/{slug}/endpoints
   * hoặc GET /api/v2/meta/endpoints?resourceType=schedule
   */
  const fetchEndpointsFor = async (slug: string): Promise<EndpointDef[]> => {
    // ví dụ minh hoạ: bạn thay bằng service thật
    // return await emrService.meta.getEndpointsByResourceType(slug);

    // tạm thời return rỗng để chỉ hiển thị resource types
    return [];
  };

  const toggleResource = async (slug: string) => {
    setResources(prev =>
      prev.map(r => (r.slug === slug ? { ...r, expanded: !r.expanded } : r))
    );

    // Nếu vừa expand và chưa load endpoints => call API riêng
    const current = resources.find(r => r.slug === slug);
    const willExpand = current ? !current.expanded : true;
    const notLoadedYet = current && current.endpoints === undefined;

    if (willExpand && notLoadedYet) {
      setResources(prev =>
        prev.map(r =>
          r.slug === slug ? { ...r, endpointsLoading: true, endpointsError: null } : r
        )
      );

      try {
        const eps = await fetchEndpointsFor(slug);
        setResources(prev =>
          prev.map(r =>
            r.slug === slug ? { ...r, endpoints: eps, endpointsLoading: false } : r
          )
        );
      } catch (e) {
        console.error(e);
        setResources(prev =>
          prev.map(r =>
            r.slug === slug
              ? { ...r, endpointsLoading: false, endpointsError: 'Failed to load endpoints' }
              : r
          )
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="text-teal-600 dark:text-teal-400" size={24} />
            {t('simulator_console')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Display supported resource types. Endpoints are loaded per resource via separate APIs.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Role: <span className="font-mono">{user.role}</span>
        </div>
      </div>

      {/* Loading */}
      {configLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Loader2 size={32} className="animate-spin text-teal-600 mb-4" />
          <p className="text-slate-500 font-medium">Fetching resource types from backend...</p>
        </div>
      )}

      {/* Error */}
      {!configLoading && configError && (
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
          <AlertTriangle size={32} className="text-red-500 mb-2" />
          <p className="text-red-700 dark:text-red-400 font-bold mb-1">Configuration Error</p>
          <p className="text-red-600 dark:text-red-300 text-sm">{configError}</p>
        </div>
      )}

      {/* Grid */}
      {!configLoading && !configError && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {resources.map(r => (
            <div
              key={r.slug}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
            >
              <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                {/* ✅ chỗ bạn cần: hiển thị WorkSchedule */}
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                  {r.displayName}
                </h3>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">{r.slug}</span>

                  <button
                    onClick={() => toggleResource(r.slug)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all"
                    title="Load endpoints (from separate API)"
                  >
                    {r.endpointsLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Loading
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        {r.expanded ? 'Hide' : 'Load'} endpoints
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Endpoints (loaded separately) */}
              {r.expanded && (
                <div className="p-4">
                  {r.endpointsLoading && (
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Loading endpoints...
                    </div>
                  )}

                  {!r.endpointsLoading && r.endpointsError && (
                    <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {r.endpointsError}
                    </div>
                  )}

                  {!r.endpointsLoading && !r.endpointsError && (
                    <>
                      {Array.isArray(r.endpoints) && r.endpoints.length > 0 ? (
                        <div className="space-y-2">
                          {r.endpoints.map((ep, idx) => (
                            <div
                              key={`${r.slug}_${idx}`}
                              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                                  {ep.label}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {ep.desc}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {ep.method} · {ep.action}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 italic">
                          No endpoints loaded (or endpoint API not wired yet).
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessSimulator;
