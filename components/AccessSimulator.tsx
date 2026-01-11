import React, { useState } from 'react';
import { UserProfile, AccessLog } from '../types';
import { Play, RotateCcw, ShieldAlert, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface AccessSimulatorProps {
  user: UserProfile;
}

const AccessSimulator: React.FC<AccessSimulatorProps> = ({ user }) => {
  const [selectedResource, setSelectedResource] = useState('MedicalRecord');
  const [selectedAction, setSelectedAction] = useState('read');
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const { t } = useAppContext();

  // Resources from "Ma trận phân quyền" and Mock APIs
  const resources = [
    'PatientProfile',
    'MedicalRecord', 
    'ClinicalNote', 
    'VitalSigns', 
    'Prescription', 
    'LabOrder',
    'LabResult',
    'Appointment',
    'BillingRecord',
    'Invoice',
    'StaffProfile',
    'WorkSchedule',
    'MedicalReport',
    'FinancialReport',
    'OperationReport',
    'SystemConfig',
    'AccessPolicy',
    'AuditLog',
    'IncidentCase'
  ];

  // Actions from "Ma trận phân quyền" (C, R, U, A)
  const actions = ['create', 'read', 'update', 'approve', 'delete', 'export'];

  const handleTest = () => {
    const requiredPermission = `${selectedResource}_${selectedAction}`;
    
    // RBAC Check
    let isAllowed = user.permissions.includes(requiredPermission);
    let riskScore = 0;
    let denyReason = undefined;

    // ABAC Simulation (Simplified frontend logic based on README rules)
    
    // Rule: BRANCH_MISMATCH (Simulated randomly for effect if not strictly checked)
    // In real app, this compares target resource branch vs user branch.
    
    // Rule: RECEPTIONIST_NO_CLINICAL_ACCESS
    if (user.role === 'Receptionist' && ['MedicalRecord', 'ClinicalNote', 'VitalSigns', 'Prescription'].includes(selectedResource)) {
        isAllowed = false;
        denyReason = 'RECEPTIONIST_NO_CLINICAL_ACCESS';
    }

    // Rule: HR_NO_PATIENT_OR_FINANCE_ACCESS
    if (user.role === 'HR' && ['PatientProfile', 'BillingRecord', 'Invoice'].includes(selectedResource)) {
        isAllowed = false;
        denyReason = 'HR_NO_PATIENT_OR_FINANCE_ACCESS';
    }

    // Rule: NO_DELETE_PATIENT_DATA
    if (selectedAction === 'delete' && ['PatientProfile', 'MedicalRecord'].includes(selectedResource)) {
        isAllowed = false;
        denyReason = 'NO_DELETE_PATIENT_DATA';
        riskScore += 5;
    }

    // Risk Scoring Simulation
    if (['MedicalRecord', 'AuditLog', 'SystemConfig'].includes(selectedResource)) riskScore += 3;
    if (['export', 'delete'].includes(selectedAction)) riskScore += 2;
    if (selectedAction === 'approve') riskScore += 1;

    
    const newLog: AccessLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      resource: selectedResource,
      action: selectedAction,
      status: isAllowed ? 'Allowed' : 'Denied',
      riskScore: riskScore,
      denyReason: !isAllowed && !denyReason ? 'RBAC_DENY' : denyReason
    };

    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Play className="text-teal-600 dark:text-teal-400" size={20} />
            {t('simulator_console')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('target_resource')}</label>
            <select 
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            >
              {resources.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('attempted_action')}</label>
            <select 
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            >
              {actions.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>

          <button 
            onClick={handleTest}
            className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            {t('test_access')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">{t('access_logs')}</h3>
          {logs.length > 0 && (
            <button onClick={clearLogs} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw size={12} /> {t('clear')}
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
              <AlertCircle size={48} className="mb-3 opacity-20" />
              <p>{t('no_logs')}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-3">{t('time')}</th>
                  <th className="px-6 py-3">{t('request')}</th>
                  <th className="px-6 py-3 text-right">{t('result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{log.resource}</span>
                            <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                            <span className="text-slate-500 dark:text-slate-400 uppercase text-xs">{log.action}</span>
                        </div>
                        {log.denyReason && (
                           <span className="text-xs text-red-500 mt-1 font-mono">{log.denyReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          {log.status === 'Allowed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                              <ShieldCheck size={14} /> {t('allowed')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium text-xs">
                              <ShieldAlert size={14} /> {t('denied')}
                            </span>
                          )}
                          {(log.riskScore || 0) > 0 && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                  (log.riskScore || 0) > 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                              }`}>
                                <AlertTriangle size={10} /> Risk Score: {log.riskScore}
                              </span>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessSimulator;