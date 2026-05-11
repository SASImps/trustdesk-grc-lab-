import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, auth, getConnectionStatus, googleProvider } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User 
} from 'firebase/auth';
import { LayoutDashboard, ShieldAlert, FileText, Activity, LogOut, Lock, Database, AlertTriangle, Settings, ExternalLink, Mail, Key, User as UserIcon, Layers, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RiskRegistry from './components/RiskRegistry';
import TPRM from './components/TPRM';
import GovernanceEngine from './components/GovernanceEngine';
import LabModules from './components/LabModules';
import Dashboard from './components/Dashboard';
import EvidenceVault from './components/EvidenceVault';
import NetworkScan from './components/NetworkScan';
import SettingsPanel from './components/Settings';
import SystemLogs from './components/SystemLogs';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const { status: connectionStatus, error: connectionError } = getConnectionStatus();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authIsLoading || !isFirebaseConfigured) return;
    
    setAuthIsLoading(true);
    setAuthError(null);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Authentication Error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Please login instead.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("Email/Password sign-in is not enabled for this project. Please enable it in the Firebase Console (Authentication > Sign-in method).");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Network request failed. This usually happens in the preview iframe. Try opening the app in a new tab.");
      } else {
        setAuthError(error.message || "An error occurred during authentication.");
      }
    } finally {
      setAuthIsLoading(false);
    }
  };

  const logout = () => signOut(auth);

  const handleGoogleLogin = async () => {
    if (authIsLoading || !isFirebaseConfigured) return;
    setAuthIsLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setAuthError(error.message || "Could not sign in with Google.");
    } finally {
      setAuthIsLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-brand-bg text-brand-accent font-mono text-xs tracking-widest animate-pulse">INITIALIZING TRUSTDESK_OS...</div>;

  const showConfigScreen = !isFirebaseConfigured || connectionStatus === 'error';

  if (showConfigScreen) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full glass-panel p-10 rounded-[32px] text-left relative z-10"
        >
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
              <AlertTriangle className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="font-serif text-3xl mb-2 text-white">
                {connectionStatus === 'error' ? 'Connection Error' : 'Security Config Required'}
              </h1>
              <p className="text-brand-subtext font-sans tracking-tight">TrustDesk Laboratory requires valid Firebase credentials to initialize secure channels.</p>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            {connectionStatus === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <p className="text-red-500 text-xs font-mono mb-2 uppercase tracking-tight">Diagnostic Output:</p>
                <p className="text-[11px] text-white/80 font-sans leading-relaxed">{connectionError}</p>
                {connectionError?.includes('Network connection failed') && (
                  <div className="mt-3 p-3 bg-red-500/20 rounded-lg">
                    <p className="text-[10px] text-red-200 font-bold uppercase mb-1">Fix for Network Error:</p>
                    <p className="text-[10px] text-red-100 mb-3">If you don't see the "Open in new tab" icon at the top right, use the direct link below to bypass iframe restrictions:</p>
                    <a 
                      href={window.location.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-500/30 hover:bg-red-500/50 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-500/30 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open App in Pure Tab
                    </a>
                    <button 
                      onClick={() => window.location.reload()}
                      className="ml-3 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-accent" />
                Step 1: Check your Secrets
              </h3>
              <p className="text-sm text-brand-subtext mb-4">Ensure your secrets in the <b>{"Gear Icon > Secrets"}</b> tab match your Firebase project exactly.</p>
              <div className="space-y-3 font-mono text-[10px] uppercase tracking-wider">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-brand-subtext/60">VITE_FIREBASE_API_KEY</span>
                    <span className={import.meta.env.VITE_FIREBASE_API_KEY ? "text-green-400" : "text-red-400"}>
                      {import.meta.env.VITE_FIREBASE_API_KEY ? "CONFIGURED" : "MISSING"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                  <span className="text-brand-subtext/60">VITE_FIREBASE_PROJECT_ID</span>
                  <span className={import.meta.env.VITE_FIREBASE_PROJECT_ID ? "text-green-400" : "text-red-400"}>
                    {import.meta.env.VITE_FIREBASE_PROJECT_ID ? "CONFIGURED" : "MISSING"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-l-2 border-brand-accent bg-brand-accent/5">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                Security Protocol:
              </h3>
              <p className="text-xs text-brand-subtext mb-4 leading-relaxed">
                TrustDesk uses <b>Firestore Security Rules</b> (`/firestore.rules`) to protect your data. 
                Even if someone sees your API Key, they cannot read or write data unless they are authenticated 
                and own the documents.
              </p>
            </div>
          </div>
          
          <p className="text-[10px] text-brand-subtext/40 uppercase tracking-[0.3em] font-mono leading-relaxed text-center">
            SYSTEM_STATUS: {connectionStatus === 'error' ? 'BOOT_FAIL' : 'WAITING_FOR_CREDENTIALS'} // ERR_CODE_OS_LOAD_FAILED
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-brand-bg p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel p-10 rounded-[32px] relative z-10"
        >
          <div className="mb-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-accent rounded-3xl flex items-center justify-center shadow-xl shadow-brand-accent/20 mb-6">
              <ShieldAlert className="text-white w-10 h-10" />
            </div>
            <h1 className="font-serif text-5xl mb-2 text-white text-center">TrustDesk</h1>
            <p className="text-brand-subtext font-sans tracking-tight text-sm text-center">Laboratory for Enterprise Compliance</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  key="signup-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] uppercase tracking-widest text-brand-subtext/60 ml-2">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40" />
                    <input 
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase tracking-widest text-brand-subtext/60 ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40" />
                <input 
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="analyst@trustdesk.os"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-brand-accent/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase tracking-widest text-brand-subtext/60 ml-2">Secure Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40" />
                <input 
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-brand-accent/50 outline-none transition-all"
                />
              </div>
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-mono"
              >
                {authError}
                {(authError.includes('Network connection failed') || authError.includes('Network request failed')) && (
                <div className="mt-2 pt-2 border-t border-red-500/20">
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 py-2 rounded-lg text-[10px] font-bold transition-all no-underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open App Outside Frame
                  </a>
                </div>
              )}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={authIsLoading}
              className={`w-full bg-brand-accent text-white py-4 rounded-xl font-bold tracking-tight transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-3 mt-4 ${
                authIsLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-[1.01]'
              }`}
            >
              {authIsLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignUp ? 'Create Laboratory Account' : 'Initialize Session'
              )}
            </button>

            {!isSignUp && (
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">OR</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authIsLoading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-3"
                >
                  <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="w-5 h-5 hidden" alt="" />
                  <Smartphone className="w-4 h-4 text-brand-accent" />
                  Sign in with Google
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="text-xs text-brand-subtext hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Back to Login' : 'Need an engineer account? Sign up'}
            </button>
          </div>

          <p className="mt-10 text-[9px] text-brand-subtext/30 uppercase tracking-[0.4em] font-mono leading-relaxed text-center italic">
            SECURE ACCESS PORTAL // GRC_OS V4.2
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'risks', label: 'Risk Registry', icon: Database },
    { id: 'tprm', label: 'TPRM Proxy', icon: ShieldAlert },
    { id: 'governance', label: 'Gov Engine', icon: FileText },
    { id: 'labs', label: 'Practice Lab', icon: Activity },
    { id: 'infra', label: 'Network Scan', icon: Layers },
    { id: 'vault', label: 'Evidence Vault', icon: Lock },
    { id: 'audit-logs', label: 'System Logs', icon: FileText },
    { id: 'settings', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-brand-border flex flex-col bg-brand-panel">
        <div className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-accent/10">Ω</div>
            <span className="font-serif text-2xl font-bold text-white tracking-tight">TrustDesk</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-subtext/40 font-mono">GRC PLATFORM v4.1</p>
        </div>
        
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  activeTab === tab.id 
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
                  : 'hover:bg-white/5 text-brand-subtext'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'group-hover:text-white transition-colors'}`} />
                <span className="font-medium text-xs tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-brand-border bg-black/20">
          <div className="flex items-center gap-4 p-4 mb-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" /> : <Activity className="w-5 h-5 text-brand-accent" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user.displayName || 'Analyst'}</p>
              <p className="text-[10px] uppercase text-brand-subtext/40 font-mono truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <header className="sticky top-0 z-10 px-10 py-6 flex justify-between items-center border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-mono text-brand-subtext/40 tracking-widest">System Status</span>
              <span className="flex items-center gap-2 text-[11px] font-bold text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 status-glow animate-pulse" />
                SECURE_GATEWAY: ACTIVE
              </span>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'risks' && <RiskRegistry />}
              {activeTab === 'tprm' && <TPRM />}
              {activeTab === 'governance' && <GovernanceEngine />}
              {activeTab === 'labs' && <LabModules />}
              {activeTab === 'infra' && <NetworkScan />}
              {activeTab === 'vault' && <EvidenceVault />}
              {activeTab === 'audit-logs' && <SystemLogs />}
              {activeTab === 'settings' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
