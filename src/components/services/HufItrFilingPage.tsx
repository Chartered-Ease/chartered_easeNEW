import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel, getServiceByKey } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type HufDocId =
    | 'hufPan'
    | 'kartaKyc'
    | 'hufDeclaration'
    | 'bankStatements'
    | 'ais26as'
    | 'tdsCertificates'
    | 'interestCertificates'
    | 'housePropertyDocs'
    | 'capitalGainsDocs'
    | 'businessFinancials'
    | 'deductionProof'
    | 'taxChallans'
    | 'otherDocs';

interface HufDocument {
    id: HufDocId;
    label: string;
    description: string;
    required: boolean;
}

const HUF_DOCS: HufDocument[] = [
    {
        id: 'hufPan',
        label: 'HUF PAN Card',
        description: 'PAN card in the name of the Hindu Undivided Family.',
        required: true,
    },
    {
        id: 'kartaKyc',
        label: 'Karta KYC',
        description: 'PAN/Aadhaar of the Karta and contact proof if available.',
        required: true,
    },
    {
        id: 'hufDeclaration',
        label: 'HUF Declaration / Deed',
        description: 'Declaration deed or family details showing Karta and members/coparceners.',
        required: true,
    },
    {
        id: 'bankStatements',
        label: 'HUF Bank Statements',
        description: 'Bank statements for the selected financial year.',
        required: true,
    },
    {
        id: 'ais26as',
        label: 'AIS / TIS / Form 26AS',
        description: 'Tax information statement and tax credit statement, if downloaded.',
        required: false,
    },
    {
        id: 'tdsCertificates',
        label: 'TDS Certificates',
        description: 'Form 16A or other TDS certificates for HUF income.',
        required: false,
    },
    {
        id: 'interestCertificates',
        label: 'Interest Certificates',
        description: 'Bank FD, savings interest or other investment income certificates.',
        required: false,
    },
    {
        id: 'housePropertyDocs',
        label: 'House Property Documents',
        description: 'Rent details, municipal tax, home loan interest certificate or property statement.',
        required: false,
    },
    {
        id: 'capitalGainsDocs',
        label: 'Capital Gains Working',
        description: 'Broker tax P&L, capital gain statement, property sale deed or purchase cost proof.',
        required: false,
    },
    {
        id: 'businessFinancials',
        label: 'Business / Profession Financials',
        description: 'Profit and loss, balance sheet, ledgers, GST data or books summary.',
        required: false,
    },
    {
        id: 'deductionProof',
        label: 'Deduction / Investment Proof',
        description: '80C, 80D, donation, loan interest or other deduction proofs.',
        required: false,
    },
    {
        id: 'taxChallans',
        label: 'Advance Tax / Self Assessment Challans',
        description: 'Tax payment challans paid for the year.',
        required: false,
    },
    {
        id: 'otherDocs',
        label: 'Other Supporting Documents',
        description: 'Any notice, computation, prior year return or relevant file.',
        required: false,
    },
];

const ASSESSMENT_YEARS = ['AY 2026-27', 'AY 2025-26', 'AY 2024-25'];
const RETURN_NATURES = ['Regular Return', 'Belated Return', 'Revised Return', 'Nil Return'];

const HUF_TIMELINE = [
    'HUF Details Captured',
    'Documents Uploaded',
    'AIS / Form 26AS Review',
    'Tax Computation',
    'ITR Prepared',
    'Filed and ITR-V Available',
];

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const UploadCard: React.FC<{
    doc: HufDocument;
    files: File[];
    required: boolean;
    onChange: (docId: HufDocId, files: File[]) => void;
}> = ({ doc, files, required, onChange }) => (
    <motion.div
        layout
        whileHover={{ y: -3 }}
        className={`rounded-[1.35rem] border p-4 shadow-sm transition ${files.length > 0 ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">
                        {doc.label} {required && <span className="text-red-500">*</span>}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${files.length > 0 ? 'bg-emerald-100 text-emerald-700' : required ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {files.length > 0 ? `${files.length} uploaded` : required ? 'required' : 'optional'}
                    </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">{doc.description}</p>
                {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {files.map((file, index) => (
                            <div key={`${doc.id}-${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                                <span className="truncate font-bold text-slate-700">{file.name}</span>
                                <button type="button" onClick={() => onChange(doc.id, files.filter((_, fileIndex) => fileIndex !== index))} className="ml-3 shrink-0 text-xs font-black text-red-600">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-ease-blue px-4 py-2 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                Upload
                <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.zip"
                    onClick={(event) => { event.currentTarget.value = ''; }}
                    onChange={(event) => {
                        if (!event.target.files) return;
                        onChange(doc.id, [...files, ...Array.from(event.target.files)]);
                    }}
                />
            </label>
        </div>
    </motion.div>
);

const HufItrFilingPage: React.FC = () => {
    const { setPage, selectedClientId, selectedServiceId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const selectedService = getServiceByKey(selectedServiceId);
    const isCapitalGainsService = selectedServiceId === 'huf-capital-gains-reporting';
    const serviceName = selectedService?.name || 'HUF ITR Filing';

    const [step, setStep] = useState(1);
    const [hufData, setHufData] = useState({
        hufName: '',
        hufPan: '',
        kartaName: '',
        kartaPan: '',
        kartaAadhaar: '',
        memberCount: '',
        address: '',
        mobile: '',
        email: '',
    });
    const [returnData, setReturnData] = useState({
        assessmentYear: ASSESSMENT_YEARS[0],
        returnNature: RETURN_NATURES[0],
        hasHouseProperty: false,
        hasCapitalGains: isCapitalGainsService,
        hasBusinessIncome: false,
        hasOtherSources: true,
        hasAgriculturalIncome: false,
        hasDeductions: false,
        taxRegimePreference: 'Let expert decide',
        notes: '',
    });
    const [portalData, setPortalData] = useState({
        userId: '',
        password: '',
    });
    const [files, setFiles] = useState<Record<HufDocId, File[]>>({
        hufPan: [],
        kartaKyc: [],
        hufDeclaration: [],
        bankStatements: [],
        ais26as: [],
        tdsCertificates: [],
        interestCertificates: [],
        housePropertyDocs: [],
        capitalGainsDocs: [],
        businessFinancials: [],
        deductionProof: [],
        taxChallans: [],
        otherDocs: [],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ referenceId: string; submittedAt: string } | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setHufData(prev => ({
            ...prev,
            hufName: prev.hufName || client.name,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
    }, [client]);

    const suggestedItrForm = returnData.hasBusinessIncome ? 'ITR-3' : 'ITR-2';

    const isDocRequired = (doc: HufDocument) => {
        if (doc.required) return true;
        if (doc.id === 'capitalGainsDocs') return returnData.hasCapitalGains;
        if (doc.id === 'businessFinancials') return returnData.hasBusinessIncome;
        if (doc.id === 'housePropertyDocs') return returnData.hasHouseProperty;
        if (doc.id === 'deductionProof') return returnData.hasDeductions;
        return false;
    };

    const requiredDocs = HUF_DOCS.filter(isDocRequired);
    const requiredReady = requiredDocs.every(doc => files[doc.id].length > 0);
    const uploadedCount = useMemo(() => (Object.values(files) as File[][]).reduce((count, fileList) => count + fileList.length, 0), [files]);
    const completion = Math.round((HUF_DOCS.filter(doc => files[doc.id].length > 0).length / HUF_DOCS.length) * 100);

    const updateFiles = (docId: HufDocId, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const updateReturnFlag = (key: keyof typeof returnData, value: boolean | string) => {
        setReturnData(prev => ({ ...prev, [key]: value }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!hufData.hufName.trim()) return 'Please enter HUF name.';
            if (!panRegex.test(hufData.hufPan.trim().toUpperCase())) return 'Please enter a valid HUF PAN.';
            if (!hufData.kartaName.trim()) return 'Please enter Karta name.';
            if (!panRegex.test(hufData.kartaPan.trim().toUpperCase())) return 'Please enter a valid Karta PAN.';
            if (!hufData.address.trim()) return 'Please enter HUF address.';
        }
        if (step === 2) {
            const hasIncomeHead = returnData.hasHouseProperty || returnData.hasCapitalGains || returnData.hasBusinessIncome || returnData.hasOtherSources || returnData.hasAgriculturalIncome;
            if (returnData.returnNature !== 'Nil Return' && !hasIncomeHead) return 'Select at least one HUF income source or choose Nil Return.';
        }
        if (step === 4 && !requiredReady) return 'Please upload all required HUF ITR documents.';
        return '';
    };

    const goNext = () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setError('');
        if (step === 1 && !portalData.userId) {
            setPortalData(prev => ({ ...prev, userId: hufData.hufPan.trim().toUpperCase() }));
        }
        setStep(current => Math.min(current + 1, 5));
    };

    const handleSubmit = async () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        if (!client) {
            setError('Client context is missing. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const uploadQueue: Array<{ doc: HufDocument; file: File; index: number }> = [];
            HUF_DOCS.forEach(doc => {
                files[doc.id].forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `huf_${item.doc.id}_${item.index + 1}` : `huf_${item.doc.id}`,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                hufData,
                returnData,
                portalData: {
                    userId: portalData.userId || hufData.hufPan,
                    passwordProvided: Boolean(portalData.password),
                },
                suggestedItrForm,
                documentStatuses: HUF_DOCS.map(doc => ({
                    document: doc.label,
                    status: files[doc.id].length > 0 ? 'Uploaded' : isDocRequired(doc) ? 'Pending' : 'Optional',
                })),
                expectedOutputs: ['ITR computation', 'ITR-V acknowledgement', 'Filed return copy'],
                timeline: HUF_TIMELINE,
            };

            const newProfile = processServiceApplication(client.id, null, serviceName, extractedData, profileDocuments);
            const existingSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
            const submissionId = Date.now();
            const submittedAt = new Date().toLocaleString();

            existingSubmissions.push({
                id: submissionId,
                service: serviceName,
                clientName: client.name,
                clientId: client.id,
                profileName: newProfile.name,
                profileId: newProfile.id,
                mobile: client.mobileNumber,
                entityType: client.entityType,
                extractedData: newProfile.extractedData,
                documents: newProfile.documents,
                outputDocuments: [],
                status: `${serviceName} Request Submitted`,
                submittedAt,
                createdByType: isAgentAuthenticated ? 'agent' : 'customer',
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
            });
        } catch (err: any) {
            console.error('HUF ITR submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit HUF ITR request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading HUF ITR workflow...</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">HUF ITR Filing</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Request submitted</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The HUF return request is now in review. Computation, filing status and ITR-V will appear on the dashboard.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submitted.referenceId}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Suggested Form</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{suggestedItrForm}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Files Uploaded</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{uploadedCount}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {HUF_TIMELINE.map((item, index) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index <= 1 ? 'bg-emerald-100 text-emerald-700' : index === 2 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-950">{item}</p>
                                            <p className="text-sm font-bold text-slate-500">{index <= 1 ? 'Completed' : index === 2 ? 'Next step' : 'Pending'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="blue-glow-button">
                                Back to Dashboard
                            </button>
                            <button onClick={() => { setSubmitted(null); setStep(1); }} className="soft-button bg-white text-slate-900">
                                Edit HUF Details
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to workspace
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">{serviceName}</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">HUF income tax workflow</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Capture HUF, Karta, income heads, portal access and working documents for return preparation and filing.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">{getEntityLabel(client.entityType)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 sm:grid-cols-5">
                    {['HUF', 'Income', 'Portal', 'Documents', 'Review'].map((label, index) => (
                        <div key={label} className={`rounded-2xl border p-3 transition ${index + 1 <= step ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-400'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index + 1 <= step ? 'bg-ease-blue text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}</span>
                                <span className="text-xs font-black uppercase tracking-wide">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <main className="glass-card p-5 md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Step {step} of 5</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">
                            {step === 1 && 'HUF and Karta details'}
                            {step === 2 && 'Return and income heads'}
                            {step === 3 && 'Income tax portal access'}
                            {step === 4 && 'Upload HUF ITR documents'}
                            {step === 5 && 'Review and submit'}
                        </h2>

                        <div className="mt-6">
                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        ['hufName', 'HUF Name'],
                                        ['hufPan', 'HUF PAN'],
                                        ['kartaName', 'Karta Name'],
                                        ['kartaPan', 'Karta PAN'],
                                        ['kartaAadhaar', 'Karta Aadhaar'],
                                        ['memberCount', 'Number of HUF Members'],
                                        ['mobile', 'Mobile Number'],
                                        ['email', 'Email ID'],
                                    ].map(([key, label]) => (
                                        <label key={key}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <input
                                                value={hufData[key as keyof typeof hufData]}
                                                onChange={(event) => setHufData(prev => ({ ...prev, [key]: key.toLowerCase().includes('pan') ? event.target.value.toUpperCase() : event.target.value }))}
                                                className="input"
                                                placeholder={label}
                                                maxLength={key.toLowerCase().includes('pan') ? 10 : undefined}
                                            />
                                        </label>
                                    ))}
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">HUF Address</span>
                                        <textarea value={hufData.address} onChange={(event) => setHufData(prev => ({ ...prev, address: event.target.value }))} className="input min-h-[95px]" placeholder="Registered / communication address of HUF" />
                                    </label>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Assessment Year</span>
                                            <select value={returnData.assessmentYear} onChange={(event) => updateReturnFlag('assessmentYear', event.target.value)} className="input">
                                                {ASSESSMENT_YEARS.map(year => <option key={year}>{year}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Return Nature</span>
                                            <select value={returnData.returnNature} onChange={(event) => updateReturnFlag('returnNature', event.target.value)} className="input">
                                                {RETURN_NATURES.map(type => <option key={type}>{type}</option>)}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {[
                                            ['hasHouseProperty', 'Income from House Property'],
                                            ['hasCapitalGains', 'Capital Gains'],
                                            ['hasBusinessIncome', 'Business / Profession Income'],
                                            ['hasOtherSources', 'Interest / Dividend / Other Sources'],
                                            ['hasAgriculturalIncome', 'Agricultural / Exempt Income'],
                                            ['hasDeductions', 'Deductions / Investments'],
                                        ].map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => updateReturnFlag(key as keyof typeof returnData, !returnData[key as keyof typeof returnData])}
                                                className={`rounded-[1.15rem] border p-4 text-left text-sm font-black transition ${returnData[key as keyof typeof returnData] ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50/50'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Tax Regime Preference</span>
                                            <select value={returnData.taxRegimePreference} onChange={(event) => updateReturnFlag('taxRegimePreference', event.target.value)} className="input">
                                                <option>Let expert decide</option>
                                                <option>New regime preferred</option>
                                                <option>Old regime preferred</option>
                                            </select>
                                        </label>
                                        <div className="rounded-[1.15rem] border border-blue-100 bg-blue-50 p-4">
                                            <p className="text-xs font-black uppercase tracking-wide text-ease-blue">Suggested ITR Form</p>
                                            <p className="mt-2 font-display text-3xl font-bold text-slate-950">{suggestedItrForm}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">{returnData.hasBusinessIncome ? 'Business/profession income selected' : 'No business/profession income selected'}</p>
                                        </div>
                                    </div>

                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notes for Tax Team</span>
                                        <textarea value={returnData.notes} onChange={(event) => updateReturnFlag('notes', event.target.value)} className="input min-h-[100px]" placeholder="Add special points, asset sale notes, carried forward losses, refund preference, etc." />
                                    </label>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Income Tax Portal User ID</span>
                                        <input value={portalData.userId} onChange={(event) => setPortalData(prev => ({ ...prev, userId: event.target.value.toUpperCase() }))} className="input" placeholder="Usually HUF PAN" maxLength={10} />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Portal Password</span>
                                        <input type="password" value={portalData.password} onChange={(event) => setPortalData(prev => ({ ...prev, password: event.target.value }))} className="input" placeholder="Optional, can be shared later" />
                                    </label>
                                    <div className="md:col-span-2 rounded-[1.2rem] border border-blue-100 bg-blue-50 p-4">
                                        <p className="text-sm font-bold leading-6 text-slate-700">
                                            If portal password is not shared now, the request will still be submitted and the team can collect access later for AIS/Form 26AS review and final e-verification guidance.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {HUF_DOCS.map(doc => (
                                        <UploadCard key={doc.id} doc={doc} files={files[doc.id]} required={isDocRequired(doc)} onChange={updateFiles} />
                                    ))}
                                </div>
                            )}

                            {step === 5 && (
                                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                                    <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-950">{hufData.hufName}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">Karta: {hufData.kartaName} | {returnData.assessmentYear}</p>
                                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Suggested form</span><span>{suggestedItrForm}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Return nature</span><span>{returnData.returnNature}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                        </div>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-blue">After submission</p>
                                        <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                                            {HUF_TIMELINE.map((item, index) => (
                                                <div key={item} className="flex gap-3">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-ease-blue">{index + 1}</span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <button onClick={() => setStep(current => Math.max(current - 1, 1))} disabled={step === 1} className="soft-button bg-white text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                                Previous
                            </button>
                            {step < 5 ? (
                                <button onClick={goNext} className="blue-glow-button">Continue</button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                    {isSubmitting ? <LoaderIcon /> : 'Submit HUF ITR Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Readiness</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">HUF filing cockpit</h2>
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Document progress</span>
                                        <span>{completion}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-ease-electric transition-all duration-500" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Files uploaded</span><span>{uploadedCount}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Suggested form</span><span>{suggestedItrForm}</span></div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 bg-purple-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-ease-purple">Important</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                    ITR uploads here are working documents for computation and review. The income-tax return itself is filed through the prescribed e-filing workflow.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default HufItrFilingPage;
