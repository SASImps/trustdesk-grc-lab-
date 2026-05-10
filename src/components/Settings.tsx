import { useState } from 'react';
import { User, Settings as SettingsIcon, Shield, Bell, Zap, Database, Globe, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';

export default function Settings() {
  const [activePanel, setActivePanel] = useState('profile');

  const panels = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'notifications', label: 'Alert Config', icon: Bell },
    { id: 'api', label: 'API & Integrations', icon: Zap },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-2xl">
        <h1 className="font-serif text-6xl text-white mb-6">Configuration <span className="italic">Stack.</span></h1>
        <p className="text-xl text-brand-subtext leading-relaxed">
          Manage your GRC environment, cryptographic keys, and technical assessment parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation */}
        <div className="space-y-2">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all ${
                  activePanel === panel.id 
                    ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/20' 
                    : 'text-brand-subtext hover:bg-white/5 bg-white/[0.02]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{panel.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-panel rounded-[40px] border border-brand-border p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] -mr-32 -mt-32" />

            {activePanel === 'profile' && (
              <div className="space-y-10">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-brand-accent">
                    <User className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif text-white mb-2">{auth.currentUser?.email?.split('@')[0]}</h2>
                    <p className="text-sm text-brand-subtext/60 font-mono uppercase tracking-widest">Access Level: Lead Architect</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-brand-subtext/40 uppercase tracking-[0.2em]">Contact Email</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={auth.currentUser?.email || ''} 
                      className="w-full bg-black/20 border border-white/5 p-4 rounded-xl text-brand-subtext font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-brand-subtext/40 uppercase tracking-[0.2em]">Organization ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter Org ID..." 
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-mono text-sm focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'security' && (
              <div className="space-y-10">
                <div className="p-8 bg-brand-accent/10 border border-brand-accent/20 rounded-3xl flex items-center gap-6">
                  <Globe className="w-10 h-10 text-brand-accent shrink-0" />
                  <div>
                    <h3 className="font-bold text-white mb-1">MFA Status: Active</h3>
                    <p className="text-xs text-brand-subtext/60 leading-relaxed">Your account is secured with hardware-backed multi-factor authentication.</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-bold text-brand-subtext/40 uppercase tracking-[0.3em] mb-6">Security Hardening</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Session Hardening', desc: 'Auto-terminate idle active sessions', enabled: true },
                        { label: 'IP White-listing', desc: 'Restrict dashboard access to known nodes', enabled: false },
                        { label: 'Audit Trail Lock', desc: 'Prevents deletion of verified artifacts', enabled: true },
                        { label: 'API Key Rotation', desc: '30-day automated rotation cycle', enabled: true }
                      ].map((item, idx) => (
                        <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group hover:border-brand-accent/40 transition-all">
                           <div className="flex-1">
                              <p className="font-bold text-white mb-1 text-sm">{item.label}</p>
                              <p className="text-[10px] text-brand-subtext/40 leading-relaxed">{item.desc}</p>
                           </div>
                           <div className={`w-10 h-5 rounded-full p-1 transition-colors ${item.enabled ? 'bg-brand-accent' : 'bg-white/10'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activePanel === 'api' && (
              <div className="space-y-10">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-serif text-white">Gemini AI Integration</h3>
                   <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-mono rounded-lg">Operational</span>
                </div>
                
                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-6">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-mono text-brand-subtext/40 uppercase">Secret_Key_V4</p>
                     <button className="text-[10px] font-bold text-brand-accent hover:underline uppercase tracking-widest">Generate New</button>
                   </div>
                   <div className="flex items-center gap-4 bg-white/[0.02] p-4 border border-white/5 rounded-xl">
                      <Key className="w-4 h-4 text-brand-subtext/40" />
                      <p className="font-mono text-sm text-brand-subtext/20">••••••••••••••••••••••••••••••••</p>
                   </div>
                   <p className="text-[10px] text-brand-subtext/40 italic">Note: Gemini keys are managed via the platform environment variables.</p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                      <Database className="w-6 h-6 mx-auto text-brand-accent" />
                      <p className="text-[9px] font-bold text-brand-subtext/40 uppercase">Tokens/MTD</p>
                      <p className="text-xl font-bold text-white">428k</p>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                      <Zap className="w-6 h-6 mx-auto text-brand-accent" />
                      <p className="text-[9px] font-bold text-brand-subtext/40 uppercase">Avg Latency</p>
                      <p className="text-xl font-bold text-white">1.2s</p>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                      <SettingsIcon className="w-6 h-6 mx-auto text-brand-accent" />
                      <p className="text-[9px] font-bold text-brand-subtext/40 uppercase">Model</p>
                      <p className="text-xl font-bold text-white">Gen-3</p>
                   </div>
                </div>
              </div>
            )}

            {activePanel === 'notifications' && (
              <div className="py-20 text-center opacity-40">
                 <Bell className="w-20 h-20 mx-auto mb-6 text-brand-accent" />
                 <p className="font-serif italic text-2xl">Coming to Next Release</p>
                 <p className="text-sm mt-2 font-mono uppercase tracking-[0.2em] text-brand-subtext/40">v4.2 Roadmap</p>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
