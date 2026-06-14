import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useCorporateAuth } from '../hooks/useCorporateAuth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAssociateAuth } from '../hooks/useAssociateAuth';
import { useClientManager } from '../hooks/useProfile';
import { useAssociateManager } from '../hooks/useAssociateManager';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  actions?: AssistantAction[];
}

type AssistantActionTarget = 'services' | 'upload-documents' | 'check-status' | 'contact' | 'dashboard';

interface AssistantAction {
  label: string;
  target: AssistantActionTarget;
}

interface LiveEvent {
  label: string;
  meta: string;
  tone: 'success' | 'info' | 'warning';
}

const toneClasses: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  info: 'bg-blue-50 text-ease-blue border-blue-100',
  warning: 'bg-orange-50 text-orange-700 border-orange-100',
};

const buildChecklist = (items: string[]) => items.map((item, index) => `${index + 1}. ${item}`).join('\n');

const LiveExperienceLayer: React.FC = () => {
  const { page, setPage } = useAppContext();
  const { isAuthenticated, user } = useAuth();
  const { isAgentAuthenticated, agent } = useAgentAuth();
  const { isCorporateAuthenticated } = useCorporateAuth();
  const { isAdminAuthenticated } = useAdminAuth();
  const { isAssociateAuthenticated } = useAssociateAuth();
  const { getClientsForAgent } = useClientManager();
  const { tasks } = useAssociateManager();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi, I am Chartered Ease AI.\n\nTell me what you want to complete:\n1. File ITR, GST, TDS or ROC\n2. Upload documents\n3. Check deadlines or status\n4. Start a business compliance task\n\nI will guide you step by step.',
      actions: [
        { label: 'Start Filing', target: 'services' },
        { label: 'Upload Documents', target: 'upload-documents' },
        { label: 'Talk to Expert', target: 'contact' },
      ],
    },
  ]);
  const isOperationalUser = isAgentAuthenticated || isCorporateAuthenticated || isAdminAuthenticated || isAssociateAuthenticated;

  const agentClients = useMemo(() => (
    isAgentAuthenticated && agent ? getClientsForAgent(agent.username) : []
  ), [agent, getClientsForAgent, isAgentAuthenticated]);

  const liveEvents = useMemo<LiveEvent[]>(() => {
    const rawSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
    const agentClientIds = new Set(agentClients.map(client => client.id));
    const agentClientNames = new Set(agentClients.map(client => client.name.toLowerCase()));
    const scopedSubmissions = isAgentAuthenticated
      ? rawSubmissions.filter((submission: any) => agentClientIds.has(submission.clientId))
      : rawSubmissions;
    const scopedTasks = isAgentAuthenticated
      ? tasks.filter(task => agentClientNames.has((task.clientName || '').toLowerCase()) || agentClientNames.has((task.profileName || '').toLowerCase()))
      : tasks;

    const submissionEvents: LiveEvent[] = scopedSubmissions
      .filter((submission: any) => submission?.service && submission?.submittedAt)
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 4)
      .map((submission: any) => ({
        label: `${submission.service} submitted`,
        meta: `Ref CE-${String(submission.id).slice(-6)}${submission.profileName ? ` - ${submission.profileName}` : ''}`,
        tone: 'info',
      }));

    const now = new Date();
    const nextSevenDays = new Date(now);
    nextSevenDays.setDate(now.getDate() + 7);
    const dueEvents: LiveEvent[] = scopedTasks
      .filter(task => {
        const dueDate = new Date(task.deadline);
        if (Number.isNaN(dueDate.getTime())) return false;
        const status = task.status.toLowerCase();
        return dueDate >= now && dueDate <= nextSevenDays && !['completed', 'filed'].includes(status);
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4)
      .map(task => {
        const dueDate = new Date(task.deadline);
        const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          label: `${task.serviceName} due ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}`,
          meta: task.clientName || task.profileName || 'Upcoming deadline',
          tone: 'warning',
        };
      });

    return [...submissionEvents, ...dueEvents].slice(0, 6);
  }, [agentClients, isAgentAuthenticated, page, tasks]);

  const shouldShowLiveToasts = page !== 'home' && isOperationalUser && !isAuthenticated && liveEvents.length > 0;

  useEffect(() => {
    if (liveEvents.length === 0) return;
    const interval = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % liveEvents.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [liveEvents.length]);

  useEffect(() => {
    if (activeIndex >= liveEvents.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, liveEvents.length]);

  useEffect(() => {
    if (!isChatOpen) return;
    window.requestAnimationFrame(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [isChatOpen, messages]);

  const activeEvent = liveEvents[activeIndex];
  const quickPrompts = [
    'Which ITR should I file?',
    'GST registration documents?',
    'What is due this month?',
    'I received a notice',
  ];

  const getAssistantReply = (question: string) => {
    const normalized = question.toLowerCase();
    const userName = user?.displayName || user?.mobileNumber || '';
    const personalPrefix = isAuthenticated
      ? `I can guide this from your workspace${userName ? `, ${userName}` : ''}.\n\n`
      : '';
    const dueAlerts = liveEvents.filter(event => event.label.toLowerCase().includes('due'));

    if (normalized.includes('which itr') || normalized.includes('itr should') || normalized.includes('itr type')) {
      return {
        text: `${personalPrefix}Let me identify the right ITR for you.\n\nStep 1: Confirm your income type.\n- Salary only: usually ITR-1\n- Salary + capital gains: usually ITR-2\n- Freelance or business income: usually ITR-3 or ITR-4\n\nStep 2: Tell me these 3 things:\n1. Are you salaried, freelancer, or business owner?\n2. Do you have capital gains or rental income?\n3. Do you have foreign income or directorship?\n\nOnce confirmed, start the correct ITR workflow and upload documents.`,
        actions: [
          { label: 'Start ITR Filing', target: 'services' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Talk to Expert', target: 'contact' },
        ],
      };
    }

    if (normalized.includes('gst')) {
      const isReturn = normalized.includes('return') || normalized.includes('filing') || normalized.includes('sales') || normalized.includes('purchase');
      return {
        text: isReturn
          ? `${personalPrefix}GST return filing flow:\n\nStep 1: Select return period.\nStep 2: Upload sales and purchase data.\nStep 3: Confirm nil purchase/no purchase if applicable.\nStep 4: Submit for review and track status.\n\nDocuments needed:\n${buildChecklist(['Sales invoices or sales register', 'Purchase invoices or purchase register', 'GST portal login credentials', 'Bank statement if reconciliation is required', 'Nil purchase/no purchase confirmation if applicable'])}\n\nNext step: upload the documents or start GST return filing.`
          : `${personalPrefix}GST registration checklist:\n\n${buildChecklist(['PAN card', 'Aadhaar card', 'Business address proof', 'Electricity bill', 'Rent agreement or ownership proof', 'Bank details or cancelled cheque', 'Mobile number and email ID', 'Business constitution proof, if applicable'])}\n\nStep 1: Keep these documents ready.\nStep 2: Start GST Registration.\nStep 3: Upload documents.\nStep 4: Track application status.`,
        actions: [
          { label: isReturn ? 'Start GST Return' : 'Start GST Registration', target: 'services' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Check Status', target: 'check-status' },
        ],
      };
    }

    if (normalized.includes('itr') || normalized.includes('income tax')) {
      return {
        text: `${personalPrefix}ITR filing journey:\n\nStep 1: Choose income type.\n- Salary ITR\n- Capital Gain ITR\n- Freelancer ITR\n- Business ITR\n\nStep 2: Upload core documents:\n${buildChecklist(['Form 16, if salaried', 'Bank statements', 'AIS and Form 26AS', 'Investment proofs and deductions', 'Capital gain statement, if applicable', 'House property or loan details, if applicable'])}\n\nStep 3: Our team reviews and prepares the return.\nStep 4: You approve before filing.`,
        actions: [
          { label: 'Start ITR Filing', target: 'services' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Talk to Expert', target: 'contact' },
        ],
      };
    }

    if (normalized.includes('tds')) {
      return {
        text: `${personalPrefix}TDS filing flow:\n\nStep 1: Select the correct form.\n- Form 24Q: Salary TDS\n- Form 26Q: Non-salary resident payments\n- Form 27Q: Non-resident/NRI payments\n- Form 27EQ: TCS return\n\nStep 2: Select financial year and quarter.\nStep 3: Upload challans and deductee data.\nStep 4: Submit for preparation and track status.\n\nDocuments needed:\n${buildChecklist(['Deductee details with PAN', 'Payment and deduction working', 'TDS challans paid', 'Previous return, if any', 'Salary sheet for Form 24Q'])}`,
        actions: [
          { label: 'Start TDS Filing', target: 'services' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Check Status', target: 'check-status' },
        ],
      };
    }

    if (normalized.includes('roc') || normalized.includes('company')) {
      return {
        text: `${personalPrefix}ROC/company compliance flow:\n\nStep 1: Select the form or work type.\n- AOC-4\n- MGT-7/MGT-7A\n- DIR-3 KYC\n- Board resolution\n\nStep 2: Upload company documents.\nStep 3: Team reviews and prepares filing.\nStep 4: Track acknowledgement.\n\nCommon documents:\n${buildChecklist(['Financial statements', 'Board report or resolution details', 'DSC/DIN details', 'Company master data', 'Previous filing acknowledgement, if available'])}`,
        actions: [
          { label: 'Start ROC Filing', target: 'services' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Talk to Expert', target: 'contact' },
        ],
      };
    }

    if (normalized.includes('notice')) {
      return {
        text: `${personalPrefix}For a notice, do this in order:\n\nStep 1: Upload the notice copy.\nStep 2: Upload ITR acknowledgement and computation for that year, if available.\nStep 3: Our team will review the reason, risk and response path.\nStep 4: We will contact you for the next action.\n\nDocuments needed:\n${buildChecklist(['Notice PDF/image', 'ITR acknowledgement for that year', 'ITR computation for that year', 'Any reply already submitted, if any'])}`,
        actions: [
          { label: 'Upload Notice', target: 'upload-documents' },
          { label: 'Talk to Expert', target: 'contact' },
          { label: 'Check Status', target: 'check-status' },
        ],
      };
    }

    if (normalized.includes('deadline') || normalized.includes('due') || normalized.includes('this month')) {
      const alertText = dueAlerts.length > 0
        ? dueAlerts.map((event, index) => `${index + 1}. ${event.label} - ${event.meta}`).join('\n')
        : 'I do not see live due-date alerts in this workspace right now.';

      return {
        text: `${personalPrefix}Here is how to handle deadlines:\n\n${alertText}\n\nStep 1: Open status or dashboard.\nStep 2: Upload missing documents, if any.\nStep 3: Ask the team to file or confirm completion.\n\nIf you are unsure, send me the filing type and period.`,
        actions: [
          { label: 'Check Status', target: 'check-status' },
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Talk to Expert', target: 'contact' },
        ],
      };
    }

    if (normalized.includes('status') || normalized.includes('track')) {
      return {
        text: `${personalPrefix}To check filing status:\n\nStep 1: Open your dashboard.\nStep 2: Go to Active Filings or Track Status.\nStep 3: Open the service card.\nStep 4: Check timeline, attachments and acknowledgement.\n\nIf something is pending, upload the requested document or message the team.`,
        actions: [
          { label: 'Check Status', target: 'check-status' },
          { label: 'Upload Documents', target: 'upload-documents' },
        ],
      };
    }

    if (normalized.includes('document') || normalized.includes('docs')) {
      return {
        text: `${personalPrefix}Document handling flow:\n\nStep 1: Upload reusable documents once in your document vault.\nStep 2: Start the service workflow.\nStep 3: Chartered Ease will reuse available documents and ask only for missing items.\nStep 4: Track document status as Uploaded, Under Review, Verified, or Re-upload Required.\n\nTell me the service name if you want the exact checklist.`,
        actions: [
          { label: 'Upload Documents', target: 'upload-documents' },
          { label: 'Start Filing', target: 'services' },
        ],
      };
    }

    if (normalized.includes('business') || normalized.includes('setup') || normalized.includes('registration') || normalized.includes('start')) {
      return {
        text: `${personalPrefix}Business setup can move step by step.\n\nStep 1: Choose entity type.\n- Proprietorship\n- Partnership Firm\n- LLP\n- Private Limited Company\n\nStep 2: Choose service.\n- GST Registration\n- Udyam\n- Shop Act\n- Partnership Registration\n- Company/LLP Registration\n\nStep 3: Upload KYC and address documents.\nStep 4: Track registration status.`,
        actions: [
          { label: 'Explore Services', target: 'services' },
          { label: 'Talk to Expert', target: 'contact' },
        ],
      };
    }

    return {
      text: `${personalPrefix}I can guide you, but I need 2 quick details.\n\n1. What do you want to complete: ITR, GST, TDS, ROC, documents, notice, or business setup?\n2. Which entity is this for: Individual, Proprietorship, Partnership, LLP, Company, or HUF?\n3. Is it urgent or linked to a deadline?\n\nReply with these details and I will give the exact next steps.`,
      actions: [
        { label: 'Explore Services', target: 'services' },
        { label: 'Upload Documents', target: 'upload-documents' },
        { label: 'Talk to Expert', target: 'contact' },
      ],
    };
  };

  const handleAssistantAction = (target: AssistantActionTarget) => {
    if (target === 'services') {
      setPage('services');
      setIsChatOpen(false);
      return;
    }

    if (target === 'upload-documents') {
      setPage(isAuthenticated ? 'document-vault' : 'login');
      setIsChatOpen(false);
      return;
    }

    if (target === 'check-status') {
      setPage(isAgentAuthenticated ? 'track-status' : isAuthenticated ? 'user-dashboard' : 'login');
      setIsChatOpen(false);
      return;
    }

    if (target === 'dashboard') {
      setPage(isAgentAuthenticated ? 'agent-dashboard' : isAuthenticated ? 'user-dashboard' : 'home');
      setIsChatOpen(false);
      return;
    }

    setPage('contact');
    setIsChatOpen(false);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = getAssistantReply(trimmed);

    setMessages(prev => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: reply.text, actions: reply.actions },
    ]);
    setChatInput('');
  };

  return (
    <>
      {shouldShowLiveToasts && (
        <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeEvent.label}-${activeEvent.meta}`}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="glass-card w-72 p-4"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full animate-pulse-ring ${activeEvent.tone === 'warning' ? 'bg-orange-500' : activeEvent.tone === 'success' ? 'bg-ease-green' : 'bg-ease-electric'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{activeEvent.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{activeEvent.meta}</p>
                  <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${toneClasses[activeEvent.tone]}`}>
                    Live update
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed bottom-24 right-5 z-50 flex h-[min(640px,72vh)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-white/70 bg-white shadow-[0_26px_90px_rgba(15,23,42,0.28)]"
          >
            <div className="relative overflow-hidden bg-slate-950 p-5 text-white">
              <div className="absolute inset-0 animated-grid opacity-20" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                    <span className="h-2 w-2 rounded-full bg-ease-green animate-pulse-ring" />
                    Online
                  </div>
                  <h3 className="mt-3 text-xl font-black">Chartered Ease AI</h3>
                  <p className="mt-1 text-sm text-slate-300">Guided compliance steps for filings, documents, deadlines and status.</p>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-lg leading-none text-white transition hover:bg-white/20"
                  aria-label="Close AI chat"
                >
                  &times;
                </button>
              </div>
            </div>

            <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ease-bg/80 p-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'bg-ease-blue text-white' : 'border border-slate-100 bg-white text-slate-700'}`}>
                    <p className="whitespace-pre-line">{message.text}</p>
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map(action => (
                          <button
                            key={`${message.text}-${action.label}`}
                            type="button"
                            onClick={() => handleAssistantAction(action.target)}
                            className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-ease-blue transition hover:-translate-y-0.5 hover:border-ease-electric/40 hover:bg-white"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-ease-blue/30 hover:text-ease-blue"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(chatInput);
                }}
                className="flex gap-2"
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about a filing, document or deadline..."
                  className="input min-w-0 flex-1 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-ease-blue px-4 py-2 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsChatOpen(prev => !prev)}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isChatOpen}
        aria-label="Open Chartered Ease AI chat"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-white/60 bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_60px_rgba(15,23,42,0.35)] transition"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ease-purple text-xs shadow-inner shadow-white/20">
          AI
        </span>
        <span className="hidden sm:inline">Ask Chartered Ease AI</span>
      </motion.button>
    </>
  );
};

export default LiveExperienceLayer;
