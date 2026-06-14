
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager, fileToDataURL, Document as ProfileDocument } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { LoaderIcon } from '../icons/LoaderIcon';
import { getServiceByKey } from '../../data/entityServiceCatalog';

// --- ICONS ---
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-ease-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const VideoCameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const AYs = ["AY 2024-25", "AY 2023-24"];

type Step = 'init' | 'login' | 'dashboard' | 'mode-selection' | 'upload' | 'slot-booking' | 'processing';

const IncomeTaxFilingPage: React.FC = () => {
    const { setPage, selectedClientId, selectedServiceId } = useAppContext();
    const { getClient, updateClientItrCredentials, processServiceApplication } = useClientManager();
    const { user } = useAuth();
    const { isAgentAuthenticated } = useAgentAuth();
    
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const selectedCatalogService = getServiceByKey(selectedServiceId);
    const serviceName = selectedCatalogService?.route === 'itr-filing' ? selectedCatalogService.name : 'Income Tax Filing';
    const dashboardPage = isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard';
    const isFreelancerItr = selectedServiceId === 'individual-freelancer-itr';
    const isCapitalGainItr = selectedServiceId === 'individual-capital-gain-itr' || selectedServiceId === 'huf-capital-gains-reporting';

    // State
    const [step, setStep] = useState<Step>('init');
    const [credentials, setCredentials] = useState({ pan: '', password: '' });
    const [selectedAY, setSelectedAY] = useState<string | null>(null);
    const [returnType, setReturnType] = useState<'regular' | 'expert' | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // Expert Booking State
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

    // Business Logic Flags
    const isSalaried = client?.entityType === 'individual' && !isFreelancerItr && !isCapitalGainItr;
    const [hasCapitalGains, setHasCapitalGains] = useState<boolean>(isCapitalGainItr);
    const [needsFinancialsHelp, setNeedsFinancialsHelp] = useState<boolean>(false);
    const sourceDocumentsTitle = isFreelancerItr ? 'Freelance Income Details' : isCapitalGainItr ? 'Capital Gains Working' : 'Business Financials';
    const sourceDocumentsDescription = isFreelancerItr
        ? 'Invoices, receipts, expense summary or professional income statement.'
        : isCapitalGainItr
            ? 'Capital gain statement, broker tax P&L or property sale documents.'
            : 'Profit & Loss / Tax P&L, Balance Sheet.';

    // Upload State
    const [stagedFiles, setStagedFiles] = useState<Record<string, File[]>>({
        bankStatements: [],
        form16: [],
        businessFinancials: [],
        capitalGainsShares: [],
        capitalGainsProperty: [],
        other: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!client) {
            setPage('client-list');
        } else {
            // Auto-redirect based on credential existence
            if (step === 'init') {
                if (client.itrCredentials?.pan) {
                    setStep('dashboard');
                } else {
                    setStep('login');
                }
            }
        }
    }, [client, setPage, step]);

    useEffect(() => {
        if (isCapitalGainItr) {
            setHasCapitalGains(true);
        }
    }, [isCapitalGainItr]);

    // Helpers to check status
    const getStatusForAY = (ay: string) => {
        const submissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
        const relevant = submissions.find((s: any) => 
            s.clientId === client?.id && 
            s.service === serviceName && 
            s.extractedData?.assessmentYear === ay
        );
        if (relevant) {
            if (relevant.status === 'Completed') return 'Filed';
            return 'In Progress';
        }
        return 'Not Started';
    };

    // Generate next 3 days for mock booking
    const getAvailableSlots = () => {
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push({
                dateStr: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                times: ['10:00 AM', '02:00 PM', '04:00 PM']
            });
        }
        return dates;
    };

    if (!client) return <div className="p-12 text-center">Loading client context...</div>;

    // --- HANDLERS ---

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(credentials.pan)) {
            alert("Invalid PAN Format (e.g., ABCDE1234F)");
            return;
        }
        if (credentials.pan && credentials.password) {
            updateClientItrCredentials(client.id, credentials);
            setStep('dashboard');
        }
    };

    const handleDisconnect = () => {
        if (window.confirm("Disconnecting will remove saved credentials. Continue?")) {
            updateClientItrCredentials(client.id, null);
            setCredentials({ pan: '', password: '' });
            setShowSettings(false);
            setStep('login');
        }
    };

    const handleUpdateCredentials = () => {
        setCredentials(prev => ({ ...prev, pan: client.itrCredentials?.pan || '' }));
        setShowSettings(false);
        setStep('login');
    };

    const handleAYSelect = (ay: string) => {
        const status = getStatusForAY(ay);
        if (status === 'Filed') return; // Prevent re-filing if done
        setSelectedAY(ay);
        setStep('mode-selection');
    };

    const handleSelectMode = (type: 'regular' | 'expert') => {
        setReturnType(type);
        if (type === 'regular') setStep('upload');
        else setStep('slot-booking');
    };

    const handleFileChange = (key: string, files: FileList | null) => {
        if (files) {
            setStagedFiles(prev => ({ ...prev, [key]: [...prev[key], ...Array.from(files)] }));
        }
    };

    const removeFile = (key: string, idx: number) => {
        setStagedFiles(prev => ({
            ...prev,
            [key]: prev[key].filter((_, i) => i !== idx)
        }));
    };

    const createSubmission = async (docs: ProfileDocument[], status: string, filingType: 'basic' | 'expert' = 'basic', bookedSlot?: any) => {
        const profileName = `${serviceName} - ${selectedAY} (${filingType === 'expert' ? 'Assisted' : 'Regular'})`;
        const extractedData: Record<string, any> = {
            assessmentYear: selectedAY,
            filingType: returnType,
            pan: client.itrCredentials?.pan,
            expertAssisted: filingType === 'expert',
            hasCapitalGains: hasCapitalGains
        };

        if (!isSalaried) {
            extractedData.needsFinancialsHelp = needsFinancialsHelp;
        }

        const newProfile = processServiceApplication(
            client.id, null, serviceName, extractedData, docs
        );

        const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");
        existingSubmissions.push({
            id: Date.now(),
            service: serviceName,
            clientName: client.name,
            clientId: client.id,
            profileName: profileName,
            profileId: newProfile.id,
            mobile: client.mobileNumber,
            entityType: client.entityType,
            extractedData: newProfile.extractedData,
            documents: docs,
            status: status,
            submittedAt: new Date().toLocaleString(),
            filingType: filingType,
            bookedSlot: bookedSlot,
            createdByType: isAgentAuthenticated ? 'agent' : 'customer'
        });
        localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));
    };

    const handleRegularSubmit = async () => {
        // Minimal validation
        if (isSalaried && stagedFiles.bankStatements.length === 0) {
            alert("Please upload at least one Bank Statement.");
            return;
        }
        if (isCapitalGainItr && stagedFiles.bankStatements.length === 0) {
            alert("Please upload at least one Bank Statement.");
            return;
        }
        if (!isSalaried && stagedFiles.bankStatements.length === 0 && stagedFiles.businessFinancials.length === 0) {
             alert(`Please upload Bank Statements or ${sourceDocumentsTitle}.`);
             return;
        }

        setIsSubmitting(true);
        try {
            const allFiles: { type: string, file: File }[] = [];
            
            // Common Docs
            stagedFiles.bankStatements.forEach(f => allFiles.push({ type: 'Bank Statement', file: f }));
            
            if (isSalaried) {
                // Salaried Only
                stagedFiles.form16.forEach(f => allFiles.push({ type: 'Form 16 / Salary Slip', file: f }));
            } else {
                // Business Only
                stagedFiles.businessFinancials.forEach(f => allFiles.push({ type: sourceDocumentsTitle, file: f }));
                
                // Capital Gains
                if (hasCapitalGains) {
                    stagedFiles.capitalGainsShares.forEach(f => allFiles.push({ type: 'Capital Gains - Shares/MF', file: f }));
                    stagedFiles.capitalGainsProperty.forEach(f => allFiles.push({ type: 'Capital Gains - Property', file: f }));
                }
            }

            // Other Docs (Common)
            stagedFiles.other.forEach(f => allFiles.push({ type: 'Other Document', file: f }));

            const docs: ProfileDocument[] = await Promise.all(allFiles.map(async item => ({
                type: item.type,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file)
            })));

            await createSubmission(docs, "Processing", 'basic');
            setTimeout(() => { setIsSubmitting(false); setStep('processing'); }, 1500);
        } catch (e) {
            console.error(e);
            setIsSubmitting(false);
        }
    };

    const handleExpertBook = async () => {
        if (!selectedSlot) {
            alert("Please select a time slot.");
            return;
        }
        setIsSubmitting(true);
        try {
            const bookedSlotData = {
                date: selectedSlot.date,
                time: selectedSlot.time,
                associateName: "Senior Tax Expert"
            };
            
            await createSubmission([], "Scheduled", 'expert', bookedSlotData);
            setTimeout(() => { setIsSubmitting(false); setStep('processing'); }, 1500);
        } catch (e) {
            console.error(e);
            setIsSubmitting(false);
        }
    };

    const renderIncomeTaxWorkspace = () => {
        const credentialsConnected = Boolean(client.itrCredentials?.pan) && step !== 'login';
        const activePan = credentialsConnected ? client.itrCredentials?.pan : credentials.pan;

        return (
            <div className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-ease-bg px-4 py-8 sm:px-6 lg:py-10">
                <div className="pointer-events-none absolute inset-0 animated-grid opacity-30" />
                <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-ease-electric/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-ease-purple/10 blur-3xl" />

                <div className="relative mx-auto max-w-7xl space-y-6">
                    <button
                        onClick={() => setPage(dashboardPage)}
                        className="inline-flex items-center rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-ease-blue hover:shadow-lg"
                    >
                        <span className="mr-2">&larr;</span> Back to Dashboard
                    </button>

                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-6 text-white md:p-8">
                            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-100">Income Tax Command Center</p>
                                    <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{serviceName}</h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                        One workspace for IT portal access, assessment year selection, document collection and filing progress.
                                    </p>
                                </div>
                                <div className="rounded-[1.35rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                    <p className="mt-2 text-lg font-black text-white">{client.name}</p>
                                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                                        <span className="text-xs font-black uppercase tracking-wide text-blue-100">Portal status</span>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${credentialsConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                            <span className={`mr-2 h-2 w-2 rounded-full ${credentialsConnected ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                            {credentialsConnected ? 'Connected' : 'Connect required'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
                        <section className="glass-card p-5 md:p-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-ease-electric">Assessment years</p>
                                    <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Choose filing year</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Select the assessment year to start document upload and filing workflow.
                                    </p>
                                </div>
                                <span className="w-max rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-ease-blue">
                                    {credentialsConnected ? 'Ready to file' : 'Connect credentials first'}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {AYs.map((ay, index) => {
                                    const status = getStatusForAY(ay);
                                    const startYear = parseInt(ay.split(' ')[1].split('-')[0], 10) - 1;
                                    const endYear = parseInt(ay.split(' ')[1].split('-')[0], 10);

                                    return (
                                        <button
                                            key={ay}
                                            onClick={() => credentialsConnected && handleAYSelect(ay)}
                                            disabled={!credentialsConnected || status === 'Filed'}
                                            className={`group rounded-[1.5rem] border bg-white p-5 text-left shadow-sm transition duration-300 ${credentialsConnected ? 'hover:-translate-y-1 hover:border-ease-electric/30 hover:shadow-xl hover:shadow-ease-electric/10' : 'cursor-not-allowed opacity-70'} ${status === 'Filed' ? 'border-emerald-100' : 'border-slate-100'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Filing slot {index + 1}</p>
                                                    <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">{ay}</h3>
                                                </div>
                                                {status === 'Filed' ? <CheckCircleIcon /> : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{status}</span>}
                                            </div>
                                            <div className="mt-8 flex items-end justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Financial year</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-600">{startYear}-{endYear}</p>
                                                </div>
                                                <span className="text-sm font-black text-ease-blue transition group-hover:translate-x-1">
                                                    {credentialsConnected ? 'Start workflow ->' : 'Locked'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="glass-card overflow-hidden">
                            <div className="border-b border-slate-100 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-ease-electric">IT portal access</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">{credentialsConnected ? 'Credentials connected' : 'Connect credentials'}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {credentialsConnected ? 'Your saved PAN login is ready for this income-tax workflow.' : 'Save PAN and password once to unlock the assessment-year dashboard.'}
                                </p>
                            </div>

                            {credentialsConnected ? (
                                <div className="space-y-4 p-5">
                                    <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-4">
                                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Connected PAN</p>
                                        <p className="mt-2 text-2xl font-black text-emerald-900">{activePan}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={handleUpdateCredentials} className="rounded-full bg-ease-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                                            Update
                                        </button>
                                        <button onClick={handleDisconnect} className="rounded-full border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100">
                                            Disconnect
                                        </button>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/80 p-4 text-xs font-bold leading-5 text-ease-blue">
                                        Use the assessment-year cards to continue. You can update the password anytime from this same workspace.
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-5 p-5">
                                    <label>
                                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">PAN Number (User ID)</span>
                                        <input
                                            type="text"
                                            className="input w-full uppercase"
                                            value={credentials.pan}
                                            onChange={e => setCredentials({ ...credentials, pan: e.target.value.toUpperCase() })}
                                            maxLength={10}
                                            placeholder="ABCDE1234F"
                                            required
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">IT Portal Password</span>
                                        <input
                                            type="password"
                                            className="input w-full"
                                            value={credentials.password}
                                            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                            placeholder="Password"
                                            required
                                        />
                                    </label>
                                    <div className="flex items-start rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-xs font-bold leading-5 text-ease-blue">
                                        <LockClosedIcon />
                                        <span className="ml-2">Your credentials are encrypted and stored locally for future filings. You will not need to enter them again.</span>
                                    </div>
                                    <button type="submit" className="w-full rounded-full bg-ease-blue px-5 py-4 text-base font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric hover:shadow-ease-electric/30">
                                        Save & Continue
                                    </button>
                                </form>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDERERS ---

    if (step === 'init') return <div className="min-h-screen flex items-center justify-center"><LoaderIcon /></div>;

    if (step === 'login' || step === 'dashboard') return renderIncomeTaxWorkspace();

    // 1. LOGIN
    if (step === 'login') {
        return (
            <div className="relative flex min-h-[calc(100vh-88px)] items-center overflow-hidden bg-ease-bg px-4 py-10 sm:px-6 lg:py-14">
                <div className="pointer-events-none absolute inset-0 animated-grid opacity-35" />
                <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-ease-electric/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-ease-purple/10 blur-3xl" />
                <button 
                    onClick={() => setPage(dashboardPage)} 
                    className="absolute left-6 top-6 z-10 flex items-center rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:text-ease-blue hover:shadow-lg"
                >
                    <span className="mr-2">&larr;</span> Back to Dashboard
                    <span className="hidden">
                    <span className="mr-2">←</span> Back to Services
                    </span>
                </button>

                <div className="glass-card relative mx-auto grid w-full max-w-5xl overflow-hidden p-0 lg:grid-cols-[1.05fr_440px]">
                    <div className="mesh-surface hidden min-h-[540px] flex-col justify-between p-8 text-white lg:flex">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-100">ITR Filing Workspace</p>
                            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight">Connect once. File with fewer repeats.</h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-blue-100">
                                Your PAN credentials unlock the guided income-tax workflow for assessment year selection, document upload and filing status tracking.
                            </p>
                        </div>
                        <div className="grid gap-3">
                            {['Encrypted credential handoff', 'Assessment year dashboard', 'Document checklist and status'].map(item => (
                                <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                    <p className="text-sm font-black text-white">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 md:p-8">
                    <div className="mb-6">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">Secure access</span>
                        <h2 className="mt-4 font-display text-3xl font-bold text-slate-950">{serviceName}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Connect your IT Portal account once. We use it only to move this filing workflow ahead.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">PAN Number (User ID)</label>
                            <input 
                                type="text" 
                                className="input w-full uppercase" 
                                value={credentials.pan} 
                                onChange={e => setCredentials({...credentials, pan: e.target.value.toUpperCase()})}
                                maxLength={10}
                                placeholder="ABCDE1234F"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">IT Portal Password</label>
                            <input 
                                type="password" 
                                className="input w-full" 
                                value={credentials.password} 
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="flex items-start rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-xs font-bold leading-5 text-ease-blue">
                            <LockClosedIcon />
                            <span className="ml-2">Your credentials are encrypted and stored locally for future filings. You won't need to enter them again.</span>
                        </div>
                        <button type="submit" className="w-full rounded-full bg-ease-blue px-5 py-4 text-base font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric hover:shadow-ease-electric/30">
                            Save & Continue
                        </button>
                    </form>
                    </div>
                </div>
            </div>
        );
    }

    // 2. DASHBOARD
    if (step === 'dashboard') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <button onClick={() => setPage('services')} className="text-sm text-gray-500 hover:text-ease-blue">← Back to Services</button>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2">Income Tax Dashboard</h1>
                            <p className="text-gray-600">Client: <strong>{client.name}</strong> ({client.itrCredentials?.pan})</p>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowSettings(!showSettings)} 
                                className="flex items-center space-x-2 bg-white border px-3 py-1.5 rounded-full hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm"
                            >
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                <span>Connected</span>
                                <SettingsIcon />
                            </button>
                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border z-10 animate-fade-in-up">
                                    <button onClick={handleUpdateCredentials} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Update Password</button>
                                    <button onClick={handleDisconnect} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Disconnect</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {AYs.map(ay => {
                            const status = getStatusForAY(ay);
                            return (
                                <div 
                                    key={ay}
                                    onClick={() => handleAYSelect(ay)}
                                    className={`bg-white p-6 rounded-xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                                        status === 'Filed' ? 'border-green-200' : 'border-transparent hover:border-ease-blue'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">{ay}</h3>
                                        {status === 'Filed' && <CheckCircleIcon />}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-sm text-gray-500">
                                            Financial Year: {parseInt(ay.split(' ')[1].split('-')[0]) - 1}-{parseInt(ay.split(' ')[1].split('-')[0])}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            status === 'Filed' ? 'bg-green-100 text-green-800' :
                                            status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // 3. MODE SELECTION
    if (step === 'mode-selection') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <button onClick={() => setStep('dashboard')} className="mb-6 text-sm text-ease-blue hover:underline">← Back to Dashboard</button>
                    <h2 className="text-3xl font-bold text-gray-900">Select Filing Method for {selectedAY}</h2>
                    <p className="text-gray-600 mt-2 mb-10">Choose how you would like to proceed with your filing.</p>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        <div onClick={() => handleSelectMode('regular')} className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-ease-blue hover:shadow-xl transition-all group">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <DocumentTextIcon />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Regular ITR Filing</h3>
                            <p className="text-sm text-gray-500 mt-2">Self-service filing. Upload documents and our system processes it. Suitable for all income types including Nil returns.</p>
                        </div>
                        
                        {/* Expert Assisted - Only for Direct Customers */}
                        {!isAgentAuthenticated && (
                            <div onClick={() => handleSelectMode('expert')} className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-purple-500 hover:shadow-xl transition-all group">
                                <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <VideoCameraIcon />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Expert Assisted Filing</h3>
                                <p className="text-sm text-gray-500 mt-2">Book a 1-on-1 video session with a tax expert. They will guide you through the process, optimize tax saving, and file on your behalf.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 4. SLOT BOOKING (EXPERT MODE)
    if (step === 'slot-booking') {
        const slots = getAvailableSlots();
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setStep('mode-selection')} className="mb-6 text-sm text-ease-blue hover:underline">← Back</button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Expert Session</h2>
                    
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <p className="text-gray-600 mb-6">Select a convenient time for a video consultation with our tax expert.</p>
                        
                        <div className="space-y-6">
                            {slots.map((day, idx) => (
                                <div key={idx}>
                                    <h4 className="font-semibold text-gray-800 mb-3">{day.dateStr}</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {day.times.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedSlot({ date: day.dateStr, time })}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                                    selectedSlot?.date === day.dateStr && selectedSlot?.time === time
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t">
                            <div className="flex justify-between items-center">
                                <div className="text-sm">
                                    {selectedSlot ? (
                                        <span className="text-purple-700 font-medium">Selected: {selectedSlot.date} at {selectedSlot.time}</span>
                                    ) : (
                                        <span className="text-gray-400">Please select a slot</span>
                                    )}
                                </div>
                                <button 
                                    onClick={handleExpertBook}
                                    disabled={!selectedSlot || isSubmitting}
                                    className="bg-purple-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isSubmitting ? <LoaderIcon /> : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 5. REGULAR UPLOAD
    if (step === 'upload') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => setStep('mode-selection')} className="mb-6 text-sm text-ease-blue hover:underline">← Back</button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents ({selectedAY})</h2>
                    <p className="text-gray-600 mb-6 text-sm">Upload documents based on your income source.</p>
                    
                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                        
                        {/* 1. Bank Statements (Common) */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800">Bank Statements <span className="text-red-500">*</span></h4>
                                    <p className="text-xs text-gray-500">For the financial year (Apr - Mar).</p>
                                </div>
                                <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100">
                                    + Add File
                                    <input type="file" multiple className="hidden" accept=".pdf" onChange={(e) => handleFileChange('bankStatements', e.target.files)} />
                                </label>
                            </div>
                            {stagedFiles.bankStatements.length === 0 && <p className="text-sm text-gray-400 italic">No files selected.</p>}
                            <ul className="space-y-2 mt-2">
                                {stagedFiles.bankStatements.map((f, i) => (
                                    <li key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                        <span className="truncate">{f.name}</span>
                                        <button onClick={() => removeFile('bankStatements', i)} className="text-red-500"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 2. Source-Specific Documents */}
                        {isSalaried ? (
                            // SALARIED VIEW
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-800">Form 16 / Salary Slips</h4>
                                        <p className="text-xs text-gray-500">Mandatory for salaried individuals.</p>
                                    </div>
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100">
                                        + Add File
                                        <input type="file" multiple className="hidden" onChange={(e) => handleFileChange('form16', e.target.files)} />
                                    </label>
                                </div>
                                <ul className="space-y-2 mt-2">
                                    {stagedFiles.form16.map((f, i) => (
                                        <li key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                            <span className="truncate">{f.name}</span>
                                            <button onClick={() => removeFile('form16', i)} className="text-red-500"><TrashIcon /></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            // BUSINESS / PROPRIETORSHIP VIEW
                            <>
                                {!isCapitalGainItr && <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{sourceDocumentsTitle}</h4>
                                            <p className="text-xs text-gray-500">{sourceDocumentsDescription}</p>
                                        </div>
                                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100">
                                            + Add File
                                            <input type="file" multiple className="hidden" onChange={(e) => handleFileChange('businessFinancials', e.target.files)} />
                                        </label>
                                    </div>
                                    <ul className="space-y-2 mt-2">
                                        {stagedFiles.businessFinancials.map((f, i) => (
                                            <li key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                <span className="truncate">{f.name}</span>
                                                <button onClick={() => removeFile('businessFinancials', i)} className="text-red-500"><TrashIcon /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>}

                                {!isCapitalGainItr && <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-bold text-gray-800 mb-2">Need help preparing your financials?</h4>
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="financialsHelp"
                                                checked={!needsFinancialsHelp} 
                                                onChange={() => setNeedsFinancialsHelp(false)}
                                                className="text-ease-blue focus:ring-ease-blue h-4 w-4"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">I already have financials</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="financialsHelp"
                                                checked={needsFinancialsHelp} 
                                                onChange={() => setNeedsFinancialsHelp(true)}
                                                className="text-ease-blue focus:ring-ease-blue h-4 w-4"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">I need help preparing financials</span>
                                        </label>
                                    </div>
                                    {needsFinancialsHelp && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 animate-fade-in">
                                            <p>Our team can prepare your Profit & Loss Statement and Balance Sheet. Please ensure you have uploaded all your bank statements and any available sales/purchase invoices. We will contact you if more information is needed.</p>
                                        </div>
                                    )}
                                </div>}

                                {/* Capital Gains Section */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-gray-800">Do you have Capital Gains income?</h4>
                                        <div className="flex space-x-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    checked={hasCapitalGains === true} 
                                                    onChange={() => setHasCapitalGains(true)}
                                                    className="text-ease-blue focus:ring-ease-blue"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Yes</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    checked={hasCapitalGains === false} 
                                                    onChange={() => setHasCapitalGains(false)}
                                                    className="text-ease-blue focus:ring-ease-blue"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">No</span>
                                            </label>
                                        </div>
                                    </div>

                                    {hasCapitalGains && (
                                        <div className="space-y-4 border-t pt-4 animate-fade-in">
                                            {/* Shares */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-semibold text-gray-700">a) Shares / Mutual Funds</p>
                                                    <label className="cursor-pointer text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">
                                                        + Upload
                                                        <input type="file" multiple className="hidden" onChange={(e) => handleFileChange('capitalGainsShares', e.target.files)} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">Capital Gain Statement / Tax P&L, Broker Statement.</p>
                                                <ul className="space-y-1">
                                                    {stagedFiles.capitalGainsShares.map((f, i) => (
                                                        <li key={i} className="flex justify-between text-xs bg-white border p-1.5 rounded">
                                                            <span className="truncate">{f.name}</span>
                                                            <button onClick={() => removeFile('capitalGainsShares', i)} className="text-red-500">&times;</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Property */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-semibold text-gray-700">b) Property Sale</p>
                                                    <label className="cursor-pointer text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">
                                                        + Upload
                                                        <input type="file" multiple className="hidden" onChange={(e) => handleFileChange('capitalGainsProperty', e.target.files)} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">Sale deed, Purchase deed, Stamp duty value details.</p>
                                                <ul className="space-y-1">
                                                    {stagedFiles.capitalGainsProperty.map((f, i) => (
                                                        <li key={i} className="flex justify-between text-xs bg-white border p-1.5 rounded">
                                                            <span className="truncate">{f.name}</span>
                                                            <button onClick={() => removeFile('capitalGainsProperty', i)} className="text-red-500">&times;</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 3. Other (Common) */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800">Other Documents</h4>
                                    <p className="text-xs text-gray-500">Investments (LIC, PPF), Home Loan Cert, Donations (80G).</p>
                                </div>
                                <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100">
                                    + Add File
                                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange('other', e.target.files)} />
                                </label>
                            </div>
                            <ul className="space-y-2 mt-2">
                                {stagedFiles.other.map((f, i) => (
                                    <li key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                        <span className="truncate">{f.name}</span>
                                        <button onClick={() => removeFile('other', i)} className="text-red-500"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-4 border-t">
                            <button 
                                onClick={handleRegularSubmit} 
                                disabled={isSubmitting}
                                className="w-full bg-ease-green text-white py-3 rounded-lg font-bold hover:bg-ease-green/90 disabled:opacity-70 flex justify-center"
                            >
                                {isSubmitting ? <LoaderIcon /> : 'Submit Documents'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 6. PROCESSING / SUCCESS
    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
                <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                        <CheckCircleIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {returnType === 'expert' ? 'Session Booked!' : 'Request Submitted!'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {returnType === 'expert' 
                            ? `Your expert consultation is scheduled for ${selectedSlot?.date} at ${selectedSlot?.time}. You will receive a meeting link shortly.`
                            : `We have received your ITR request for ${selectedAY}. You can track the status in your dashboard.`
                        }
                    </p>
                    <button onClick={() => setPage('user-dashboard')} className="bg-ease-blue text-white px-6 py-2 rounded-lg hover:bg-ease-blue/90">
                        Go to Applications
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default IncomeTaxFilingPage;
