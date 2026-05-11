import { useState } from 'react';
import { Beaker, ShieldAlert, Fingerprint, Code2, Play, CheckCircle2, AlertTriangle, Terminal, Cpu, Apple, Globe, Sparkles, Award, HelpCircle, ChevronRight, Hash, ShieldCheck, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { assessAISafety, generateGRCSolution, gradeScenario, generateCriticalThinkingTest } from '../services/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { logSystemEvent } from '../lib/logger';
import { createEvidence } from '../lib/evidence';

const COMPANIES = [
  { id: 'google', name: 'Google', icon: Globe, color: 'text-blue-500' },
  { id: 'apple', name: 'Apple', icon: Apple, color: 'text-gray-400' },
  { id: 'nvidia', name: 'NVIDIA', icon: Cpu, color: 'text-green-500' },
  { id: 'custom', name: 'Custom Entity', icon: Terminal, color: 'text-brand-accent' }
];

const LABS = [
  {
    id: 'ai-safety',
    title: 'AI Safety Sandbox',
    standard: 'NIST AI RMF',
    icon: ShieldAlert,
    description: 'Stress-test LLM security filters and prompt injections.',
    tasks: ['Evaluate LLM system prompts', 'Identify adversarial patterns', 'Submit remediation report']
  },
  {
    id: 'grc-lab',
    title: 'Policy Builder Lab',
    standard: 'ISO 27001 / SOC2',
    icon: Sparkles,
    description: 'Build enterprise-grade policies for real organizations using AI.',
    tasks: ['Select Target Company', 'Input Risk Context', 'Generate AI Policy Solution']
  },
  {
    id: 'certification',
    title: 'GRC Certification',
    standard: 'ISO/IEC 27001 Specialist',
    icon: Award,
    description: 'Design a scenario, label controls manually, and pass the AI stress test.',
    tasks: ['Draft Scenario & Label Controls', 'Analyze AI Peer-Review Grade', 'Pass Critical Thinking Quiz']
  }
];

export default function LabModules() {
  const [activeLab, setActiveLab] = useState<typeof LABS[0]>(LABS[0]);
  const [promptInput, setPromptInput] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Certification Specific State
  const [certStep, setCertStep] = useState<'draft' | 'grading' | 'test' | 'complete'>('draft');
  const [certLabels, setCertLabels] = useState({ risk: '', control: '', impact: 'Medium' });
  const [grading, setGrading] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [score, setScore] = useState(0);

  const handleExportResult = () => {
    const dataToExport = activeLab.id === 'certification' ? { grading, test, score } : result;
    if (!dataToExport) {
      console.warn("No data to export");
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustdesk-portfolio-${activeLab.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const resetLab = (lab: typeof LABS[0]) => {
    setActiveLab(lab);
    setResult(null);
    setScanning(false);
    setPromptInput('');
    setCertStep('draft');
    setCertLabels({ risk: '', control: '', impact: 'Medium' });
    setGrading(null);
    setTest(null);
    setCurrentTestIndex(0);
    setScore(0);
  };

  const runLabAction = async () => {
    if (!promptInput || !auth.currentUser) return;
    setScanning(true);
    setResult(null);

    const actionId = Math.random().toString(36).substring(7).toUpperCase();

    try {
      if (activeLab.id === 'grc-lab') {
        const res = await generateGRCSolution(selectedCompany.name, activeLab.standard, promptInput);
        setResult(res);
        await createEvidence(
          'POLICY',
          `Policy Generation: ${selectedCompany.name}`,
          `AI-assisted policy generation for ${activeLab.standard} in ${selectedCompany.name}.`,
          { res, company: selectedCompany.name }
        );
        
        await logSystemEvent(
          `GRC Lab: Policy Drafted`,
          'POLICY_GENERATION',
          'success',
          `Policy framework generated for ${selectedCompany.name} targeting ${activeLab.standard}.`,
          actionId
        );
      } else if (activeLab.id === 'certification') {
        setCertStep('grading');
        const scenarioText = `
          Scenario: ${promptInput}
          Manual Labels:
          - Risk Category: ${certLabels.risk}
          - Control Implemented: ${certLabels.control}
          - Impact Assessment: ${certLabels.impact}
        `;
        const gradeRes = await gradeScenario(scenarioText);
        setGrading(gradeRes);
        const testRes = await generateCriticalThinkingTest(scenarioText);
        setTest(testRes);
        
        await logSystemEvent(
          `Certification Started: ${activeLab.standard}`,
          'LAB_EXECUTION',
          'success',
          `Scenario submitted for peer review. Inherent grade: ${gradeRes.score}%`,
          actionId
        );
      } else {
        const res = await assessAISafety(promptInput);
        setResult(res);
        await createEvidence(
          'AUDIT',
          `AI Safety Audit: Sandbox`,
          `Automated stress-test of LLM safety filters against prompt injection patterns.`,
          { res }
        );
        
        await logSystemEvent(
          `AI Safety Audit: Scanning Done`,
          'AI_AUDIT',
          res.riskRating === 'High' ? 'failure' : 'success',
          `Risk Rating: ${res.riskRating}. PII Found: ${res.piiFound}`,
          actionId
        );
      }
    } catch (e) {
      console.error(e);
      await logSystemEvent(
        `Lab Failure: ${activeLab.id}`,
        'LAB_EXECUTION',
        'failure',
        `Error: ${e instanceof Error ? e.message : 'Unknown error during lab execution'}`,
        actionId
      );
    } finally {
      setScanning(false);
    }
  };

  const handleTestAnswer = async (index: number) => {
    let newScore = score;
    if (index === test.questions[currentTestIndex].correctIndex) {
      newScore = score + 1;
      setScore(newScore);
    }
    
    if (currentTestIndex < (test?.questions?.length || 0) - 1) {
      setCurrentTestIndex(i => i + 1);
    } else {
      setCertStep('complete');
      await createEvidence(
        'CERTIFICATION',
        `Professional Certification: ${activeLab.standard}`,
        `Successfully passed AI Peer-Review (${grading.score}%) and Critical Thinking Assessment.`,
        { grade: grading.score, finalScore: newScore, total: test.questions.length }
      );
      
      await logSystemEvent(
        `Certification Complete: ${activeLab.standard}`,
        'LAB_EXECUTION',
        'success',
        `Final Exam Score: ${newScore}/${test.questions.length}. Peer Review: ${grading.score}%`,
        'CERT_' + Math.random().toString(36).substring(7).toUpperCase()
      );
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {LABS.map(lab => {
          const Icon = lab.icon;
          return (
            <motion.button
              whileHover={{ y: -6, scale: 1.01 }}
              key={lab.id}
              onClick={() => resetLab(lab)}
              className={`p-10 rounded-[32px] border text-left transition-all relative overflow-hidden group min-h-[300px] flex flex-col justify-between ${
                activeLab?.id === lab.id 
                ? 'bg-brand-accent text-white border-brand-accent shadow-2xl shadow-brand-accent/20' 
                : 'bg-brand-panel border-brand-border hover:border-white/20 shadow-2xl shadow-black/40'
              }`}
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-colors ${
                  activeLab?.id === lab.id ? 'bg-white text-brand-accent shadow-xl' : 'bg-white/5 text-brand-accent border border-white/10'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <p className={`text-[10px] font-mono tracking-[0.3em] uppercase mb-3 ${activeLab?.id === lab.id ? 'text-white/60' : 'text-brand-subtext/40'}`}>{lab.standard}</p>
                <h4 className="font-serif text-3xl mb-4 text-white group-hover:text-white uppercase">{lab.title}</h4>
                <p className={`text-sm leading-relaxed mb-8 ${activeLab?.id === lab.id ? 'text-white/70' : 'text-brand-subtext/60 italic'}`}>
                  "{lab.description}"
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLab.id + certStep}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {/* Lab Bench */}
          <div className="space-y-8">
            <div className="bg-brand-panel p-10 rounded-[40px] border border-brand-border shadow-2xl shadow-black/40">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-accent">
                  <Beaker className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-3xl text-white">
                  {activeLab.id === 'grc-lab' ? 'Practice Lab: AI GRC Engine' : 
                   activeLab.id === 'certification' ? 'Certification Workshop' : 'Live Test Environment'}
                </h3>
              </div>
              
              <div className="space-y-10">
                {activeLab.id === 'grc-lab' && (
                  <div className="space-y-4">
                    <label className="col-label block text-xs tracking-widest uppercase">Target Organization</label>
                    <div className="grid grid-cols-2 gap-4">
                      {COMPANIES.map(company => {
                        const CIcon = company.icon;
                        return (
                          <button
                            key={company.id}
                            onClick={() => setSelectedCompany(company)}
                            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                              selectedCompany.id === company.id 
                              ? 'bg-brand-accent/10 border-brand-accent text-white shadow-lg' 
                              : 'bg-white/5 border-white/10 text-brand-subtext hover:border-white/20'
                            }`}
                          >
                            <CIcon className={`w-5 h-5 ${company.color}`} />
                            <span className="text-sm font-medium">{company.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeLab.id === 'certification' && certStep === 'draft' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="col-label block text-[10px] tracking-widest uppercase">Risk Category</label>
                      <input 
                        type="text"
                        placeholder="e.g. Identity Spoofing"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        value={certLabels.risk}
                        onChange={e => setCertLabels({...certLabels, risk: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="col-label block text-[10px] tracking-widest uppercase">Impact Level</label>
                      <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        value={certLabels.impact}
                        onChange={e => setCertLabels({...certLabels, impact: e.target.value})}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-3">
                      <label className="col-label block text-[10px] tracking-widest uppercase">Proposed Control mapping</label>
                      <input 
                        type="text"
                        placeholder="e.g. Mandatory MFA (SOC2 CC6.1)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        value={certLabels.control}
                        onChange={e => setCertLabels({...certLabels, control: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {(certStep === 'draft' || activeLab.id !== 'certification') && (
                  <div className="p-6 bg-black/40 rounded-2xl font-mono text-[11px] leading-relaxed space-y-2 border border-white/5 shadow-inner">
                    <p className="text-brand-accent/40 flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" /> LAB_READY // ACTIVE: {activeLab.id.toUpperCase()}</p>
                    <p className="text-brand-subtext/20">TARGET: {selectedCompany.name.toUpperCase()}</p>
                    <div className="h-px bg-white/5 my-4" />
                    <p className="text-green-500 font-bold tracking-[0.2em]">{'>'} AWAITING_GRC_INPUT_PARAMETERS...</p>
                  </div>
                )}

                {certStep === 'draft' && (
                  <div>
                    <label className="col-label block mb-4 text-xs tracking-widest uppercase">Scenario / Breach Context</label>
                    <textarea 
                        rows={6}
                        placeholder={activeLab.id === 'grc-lab' 
                          ? `Describe the specific risk, policy area, or governance challenge for ${selectedCompany.name}...` 
                          : "Paste the technical specs or payload to audit..."}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-xs font-mono text-white focus:outline-none focus:border-brand-accent transition-all resize-none shadow-inner"
                        value={promptInput}
                        onChange={e => setPromptInput(e.target.value)}
                    />
                  </div>
                )}

                {certStep === 'grading' && (
                  <div className="space-y-8 py-12">
                     <div className="flex flex-col items-center justify-center gap-6">
                        <div className="w-20 h-20 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center">
                           <ShieldCheck className="w-10 h-10 text-brand-accent animate-pulse" />
                        </div>
                        <div className="text-center">
                           <h4 className="font-serif text-2xl text-white mb-2">Analyzing Reasoning...</h4>
                           <p className="text-xs text-brand-subtext tracking-widest uppercase">AI Auditor is scanning for logic gaps</p>
                        </div>
                     </div>
                  </div>
                )}

                {certStep === 'test' && test && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-mono text-brand-accent uppercase tracking-widest">Question {currentTestIndex + 1} of {test?.questions?.length || 0}</span>
                       <HelpCircle className="w-5 h-5 text-brand-accent" />
                    </div>
                    <h4 className="text-lg text-white font-serif italic mb-8">{test.questions[currentTestIndex].question}</h4>
                    <div className="space-y-4">
                       {test.questions[currentTestIndex].options.map((opt: string, i: number) => (
                         <button 
                           key={i}
                           onClick={() => handleTestAnswer(i)}
                           className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left text-sm text-brand-subtext hover:bg-brand-accent/10 hover:border-brand-accent hover:text-white transition-all group flex items-center justify-between"
                         >
                            {opt}
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                 {certStep === 'complete' && (
                  <div className="text-center py-20 space-y-8">
                     <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                        <Award className="w-12 h-12 text-green-500" />
                     </div>
                     <div>
                        <h4 className="font-serif text-4xl text-white mb-4">Certification Passed</h4>
                        <p className="text-brand-subtext italic">"You have successfully navigated the risk landscape and logic gates."</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                           <p className="text-[10px] text-brand-subtext uppercase tracking-widest mb-1">Peer Grade</p>
                           <p className="text-2xl font-bold text-white">{grading.score}%</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                           <p className="text-[10px] text-brand-subtext uppercase tracking-widest mb-1">Quiz Score</p>
                           <p className="text-2xl font-bold text-brand-accent">{score}/{test?.questions?.length || 0}</p>
                        </div>
                     </div>
                     <button 
                       onClick={handleExportResult}
                       className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                     >
                        <Download className="w-4 h-4" /> Export Certification Record
                     </button>
                  </div>
                )}

                {certStep === 'draft' && (
                  <button 
                    onClick={runLabAction}
                    disabled={scanning || !promptInput}
                    className={`w-full py-5 rounded-[20px] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl ${
                      scanning 
                      ? 'bg-white/5 text-brand-subtext cursor-not-allowed border border-white/5' 
                      : 'bg-brand-accent text-white hover:scale-[1.01] shadow-brand-accent/20 active:scale-95'
                    }`}
                  >
                    {scanning ? (
                      <>
                        <Terminal className="w-4 h-4 animate-spin text-brand-accent" /> 
                        INITIALIZING_AI_REASONING...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> 
                        {activeLab.id === 'grc-lab' ? 'Generate AI GRC Solution' : 
                         activeLab.id === 'certification' ? 'Submit for AI Peer-Review' : 'Execute Control Assessment'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Bench */}
          <div className="space-y-10">
            <div className="bg-brand-accent p-12 rounded-[48px] text-white shadow-2xl shadow-brand-accent/20 relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
               <h4 className="font-mono text-[10px] font-bold mb-10 uppercase tracking-[0.4em] text-white/40 italic">Module_Checklist</h4>
               <ul className="space-y-6">
                  {activeLab.tasks.map((task, i) => (
                    <li key={i} className="flex gap-6 items-start group">
                      <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold group-hover:bg-white group-hover:text-brand-accent transition-colors">
                         {i + 1}
                      </div>
                      <span className="text-sm font-medium leading-relaxed text-white/80">{task}</span>
                    </li>
                  ))}
               </ul>
            </div>

            <div className={`p-10 rounded-[48px] border transition-all min-h-[440px] flex flex-col justify-center ${
              (result || grading) ? 'bg-brand-panel border-brand-border shadow-2xl shadow-black/40' : 'bg-white/[0.01] border-white/5 border-dashed'
            }`}>
              {!result && !grading && !scanning && (
                <div className="text-center group">
                  <Terminal className="w-20 h-20 mx-auto mb-8 text-brand-subtext/10 group-hover:text-brand-accent/10 transition-colors" />
                  <p className="font-serif italic text-3xl text-brand-subtext/10 tracking-[0.3em]">AWAITING_CHALLENGE</p>
                  <p className="text-[10px] font-mono text-brand-subtext/5 uppercase mt-4">Node: {auth.currentUser?.uid.slice(0, 8) || 'GUEST'}</p>
                </div>
              )}

              {scanning && (
                 <div className="space-y-8 px-10">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: [-200, 400] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-1/2 h-full bg-brand-accent shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                      />
                    </div>
                    <p className="text-center font-mono text-[10px] uppercase tracking-[0.5em] text-brand-accent/60 animate-pulse">Consulting Governance Knowledge Base...</p>
                 </div>
              )}

              {grading && activeLab.id === 'certification' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="flex items-center justify-between p-8 bg-white/5 rounded-[32px] border border-white/10">
                      <div>
                         <p className="text-[10px] font-mono text-brand-subtext uppercase tracking-widest mb-1">Reasoning Grade</p>
                         <h4 className="text-5xl font-serif text-white">{grading.score}%</h4>
                      </div>
                      <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center">
                         <Hash className="w-8 h-8 text-brand-accent" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="col-label uppercase text-[10px] tracking-[0.2em]">Auditor Critique</p>
                      <p className="text-sm leading-relaxed text-brand-subtext italic">"{grading.critique}"</p>
                   </div>

                   <div className="space-y-4">
                      <p className="col-label uppercase text-[10px] tracking-[0.2em]">Hidden Blind Spots</p>
                      <div className="space-y-3">
                         {grading.blindSpots.map((spot: string, i: number) => (
                           <div key={i} className="flex gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl items-center">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <p className="text-xs text-brand-subtext font-medium">{spot}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {certStep === 'grading' && (
                     <button 
                       onClick={() => setCertStep('test')}
                       className="w-full py-5 bg-white text-brand-accent rounded-[28px] font-bold text-[10px] uppercase tracking-[0.4em] hover:scale-[1.01] transition-all shadow-2xl active:scale-95"
                     >
                        Begin Critical Thinking Test
                     </button>
                   )}
                </motion.div>
              )}

              {result && activeLab.id === 'grc-lab' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 h-full overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-[24px]">
                     <div className="flex items-center gap-4">
                        <Sparkles className="w-6 h-6 text-brand-accent" />
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest">AI GRC Output Framework</h4>
                     </div>
                     <button 
                       onClick={handleExportResult}
                       className="p-3 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-xl text-brand-accent transition-all flex items-center gap-2 group"
                       title="Export Portfolio Artifact"
                     >
                       <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Export Artifact</span>
                     </button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="p-8 bg-white/[0.02] rounded-[32px] border-l-4 border-brand-accent space-y-4">
                        <p className="col-label uppercase tracking-widest text-[9px]">Policy Statement</p>
                        <p className="text-sm italic leading-relaxed text-white">"{result.policy}"</p>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                           <p className="col-label tracking-widest text-[9px] uppercase">Recommended Controls</p>
                           <div className="space-y-3">
                              {result.controls.map((c: string, i: number) => (
                                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-start">
                                   <div className="w-5 h-5 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-[10px] font-bold text-brand-accent shrink-0">{i+1}</div>
                                   <p className="text-xs text-brand-subtext leading-relaxed">{c}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {result && activeLab.id === 'ai-safety' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                   <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[24px]">
                       <div className="flex items-center gap-4">
                          <span className="col-label tracking-[0.3em]">Technical Risk Assessment</span>
                          <button 
                            onClick={handleExportResult}
                            className="p-2 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-xl text-brand-accent transition-all flex items-center gap-2 group"
                            title="Export Proof of Audit"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Evidence</span>
                          </button>
                       </div>
                       <div className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border ${
                         result.riskRating === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                         result.riskRating === 'Medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 
                         'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                       }`}>
                         {result.riskRating} RISK
                       </div>
                    </div>
                    
                    <div className="space-y-8">
                       <div className="flex items-start gap-6 border-l-2 border-white/5 pl-8">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${result.piiFound ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-green-500/10 text-green-500 border border-green-500/10'}`}>
                             <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-white mb-2 uppercase tracking-widest leading-none">PII Detection Logic</p>
                             <p className="text-sm text-brand-subtext/60 leading-relaxed italic">
                                {result.piiFound ? '"Potential sensitive identifiers detected in provided payload. Immediate redaction required for Lab verification."' : '"No standard PII patterns detected in current stream."'}
                             </p>
                          </div>
                       </div>
                       
                       <div className="p-8 bg-white/[0.02] rounded-[32px] border border-white/5 shadow-inner">
                          <p className="col-label mb-4 tracking-[0.2em]">Remediation Roadmap</p>
                          <p className="text-sm leading-relaxed text-brand-subtext/80 italic">"{result.remediation}"</p>
                       </div>
                    </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
