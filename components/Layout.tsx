import React from 'react';
import { UserProfile } from '../types';
import { LogOut, Shield, User, LayoutDashboard, FileKey, Eye, Sun, Moon, Globe } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface LayoutProps {
  user: UserProfile;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab }) => {
  const { theme, toggleTheme, language, setLanguage, t } = useAppContext();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 flex flex-col shadow-xl z-20 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors duration-300">
          <div className="w-8 h-8 bg-teal-600 dark:bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/30">
            P
          </div>
          <span className="text-slate-800 dark:text-white font-bold text-lg tracking-tight transition-colors duration-300">Policy IAM</span>
        </div>

        <div className="p-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center gap-3 border border-slate-200 dark:border-slate-700/50 transition-colors duration-300">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.role.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate transition-colors duration-300">{user.username}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate transition-colors duration-300">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 dark:shadow-teal-900/50'
                : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium text-sm">{t('overview')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('policies')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeTab === 'policies'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 dark:shadow-teal-900/50'
                : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileKey size={20} />
            <span className="font-medium text-sm">{t('my_policies')}</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeTab === 'simulator'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 dark:shadow-teal-900/50'
                : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye size={20} />
            <span className="font-medium text-sm">{t('access_simulator')}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">{t('sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm z-10 transition-colors duration-300">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Shield size={16} />
            <span className="hidden md:inline">{t('secure_connection')}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{user.branch}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>{user.department}</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Controls */}
             <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
                  title="Toggle Theme"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <button 
                   onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                   className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
                   title="Switch Language"
                >
                   <Globe size={14} />
                   {language.toUpperCase()}
                </button>
             </div>

             <div className="hidden sm:block px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-semibold rounded-full border border-teal-100 dark:border-teal-900/50 transition-colors duration-300">
                {user.tokenType} {t('token_active')}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-6xl mx-auto w-full">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;