import React from 'react';
import { Shield, Search } from 'lucide-react';

export function GovernanceEngine() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Governance Engine</h1>
        <p className="text-sm text-slate-500">Mapping technical controls to regulatory frameworks.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Search size={18} className="text-emerald-500" />
            AI Policy Mapping
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Upload your company policy and GRC Sentinel will automatically map relevant clauses to SOC2, ISO27001, and HIPAA controls.
          </p>
          <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-emerald-500/30 transition-colors cursor-pointer group">
            <Shield className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={32} />
            <p className="text-sm font-medium text-slate-500">Drop policy files here (.docx, .pdf)</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <h4 className="font-bold text-emerald-400 text-sm mb-2">SOC2 Compliance Status</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[92%]" />
              </div>
              <span className="text-emerald-400 font-bold text-sm">92%</span>
            </div>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <h4 className="font-bold text-blue-400 text-sm mb-2">ISO27001 Compliance Status</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[68%]" />
              </div>
              <span className="text-blue-400 font-bold text-sm">68%</span>
            </div>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <h4 className="font-bold text-amber-400 text-sm mb-2">HIPAA Compliance Status</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[45%]" />
              </div>
              <span className="text-amber-400 font-bold text-sm">45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
