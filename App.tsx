import React, { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PermissionList from './components/PermissionList';
import AccessSimulator from './components/AccessSimulator';
import { UserProfile } from './types';
import { Search } from 'lucide-react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { getStoredUser, logout } from './services/authService';
import AdminPanel from './components/AdminPanel';

const AppContent: React.FC = () => {
  // Initialize state from LocalStorage to restore session on reload
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [policyFilter, setPolicyFilter] = useState('');
  const { t } = useAppContext();

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logout(); // Clear storage
    setUser(null);
    setPolicyFilter('');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {activeTab === 'dashboard' && (
        <div className="animate-fadeIn">
          <Dashboard user={user} />
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{t('active_policies')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">{t('policies_subtitle')}</p>
             </div>
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')}
                  value={policyFilter}
                  onChange={(e) => setPolicyFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
                />
             </div>
          </div>
          <PermissionList filter={policyFilter} />
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{t('simulator_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">{t('simulator_subtitle')}</p>
          </div>
          <AccessSimulator user={user} />
        </div>
      )}
      {activeTab === 'admin' && (
  <div className="animate-fadeIn">
    <AdminPanel />
  </div>
)}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;