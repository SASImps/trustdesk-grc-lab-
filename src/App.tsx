import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  FileCheck, 
  Activity, 
  Settings as SettingsIcon, 
  Search, 
  Users, 
  Database, 
  LayoutDashboard,
  Menu,
  Bell,
  ChevronRight,
  LogOut,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, signInWithPopup, googleProvider, onAuthStateChanged, signOut, type User } from './lib/firebase';
import { RiskRegistry } from './components/RiskRegistry';
import { EvidenceVault } from './components/EvidenceVault';
import { DashboardOverview } from './components/Dashboard';
import { GovernanceEngine } from './components/GovernanceEngine';
import { NetworkScan } from './components/NetworkScan';

// Helper for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sidebar components
const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    id={`sidebar-item-${label.toLowerCase().replace(' ', '-')}`}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    )}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4">
        <Shield className="text-emerald-500 animate-pulse" size={64} />
        <h2 className="text-emerald-400 font-mono tracking-widest animate-pulse">SENTINEL INITIALIZING...</h2>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'risk', label: 'Risk Registry', icon: AlertTriangle },
    { id: 'evidence', label: 'Evidence Vault', icon: FileCheck },
    { id: 'governance', label: 'Governance Engine', icon: Shield },
    { id: 'network', label: 'Network Scan', icon: Activity },
    { id: 'tprm', label: 'TPRM', icon: Users },
    { id: 'logs', label: 'System Logs', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview />;
      case 'risk': return <RiskRegistry />;
      case 'evidence': return <EvidenceVault />;
      case 'governance': return <GovernanceEngine />;
      case 'network': return <NetworkScan />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
          <Activity size={48} className="mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold">Module Under Maintenance</h2>
          <p>The {activeTab} engine is being optimized by AI.</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden selection:bg-emerald-500/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        id="main-sidebar"
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-[#0b1121] border-r border-slate-800 flex-shrink-0 z-30 relative overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">GRC SENTINEL</h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Autonomous Cyber Defense</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
          {tabs.map((tab) => (
            <SidebarItem
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-[#0b1121]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName || 'Security Agent'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 rounded transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950/50">
        {/* Header */}
        <header id="app-header" className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-2" />
            <h2 className="font-semibold text-lg text-slate-200 capitalize">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-slate-400 focus-within:border-emerald-500/50 transition-all">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search controls..." 
                className="bg-transparent border-none outline-none text-xs w-48"
              />
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8 max-w-7xl mx-auto w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="h-screen w-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0b1121] border border-slate-800 rounded-3xl p-10 shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-6">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">GRC SENTINEL</h1>
          <p className="text-emerald-400 font-mono text-[10px] tracking-[0.2em] uppercase mb-8">Autonomous Cyber Governance</p>
          
          <div className="space-y-6 w-full">
            <div className="text-left space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Lock className="text-slate-400" size={16} />
                </div>
                <p className="text-sm text-slate-400">Secure entry for authorized compliance agents and security personnel.</p>
              </div>
            </div>

            <button 
              onClick={onLogin}
              className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Sign in with Security Credentials
            </button>
            
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Verified by AI Compliance Engines</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

