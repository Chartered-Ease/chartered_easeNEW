import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type StartupDocId =
    | 'incorporationCertificate'
    | 'companyPan'
    | 'authorizedSignatoryKyc'
    | 'businessWriteup'
    | 'pitchDeck'
    | 'productProof'
    | 'ipProof'
    | 'fundingIncubationProof'
    | 'gstOrMsme'
    | 'financials';

interface StartupDocument {
    id: StartupDocId;
    label: string;
    description: string;
    required: boolean;
}

const STARTUP_DOCS: StartupDocument[] = [
    {
        id: 'incorporationCertificate',
        label: 'Certificate of Incorporation',
        description: 'Company incorporation certificate issued by MCA.',
        required: true,
    },
    {
        id: 'companyPan',
        label: 'Company PAN',
        description: 'PAN card issued in the name of the company.',
        required: true,
    },
    {
        id: 'authorizedSignatoryKyc',
        label: 'Authorized Signatory KYC',
        description: 'PAN/Aadhaar of founder, director or authorized signatory.',
        required: true,
    },
    {
        id: 'businessWriteup',
        label: 'Innovation / Scalability Write-up',
        description: 'Brief note explaining innovation, improvement, scalability, employment or wealth creation.',
        required: true,
    },
    {
        id: 'pitchDeck',
        label: 'Pitch Deck / Business Plan',
        description: 'Deck or business plan explaining product, market and model.',
        required: false,
    },
    {
        id: 'productProof',
        label: 'Product Proof',
        description: 'Website, app screenshots, product screenshots, demo images or prototype proof.',
        required: false,
    },
    {
        id: 'ipProof',
        label: 'IP / Patent / Trademark Proof',
        description: 'Trademark, patent, copyright, technical documentation or IP filing proof, if any.',
        required: false,
    },
    {
        id: 'fundingIncubationProof',
        label: 'Funding / Incubation / Award Proof',
        description: 'Incubator letter, grant, investor proof, award or accelerator proof, if any.',
        required: false,
    },
    {
        id: 'gstOrMsme',
        label: 'GST / Udyam / Other Registration',
        description: 'Supporting business registrations, if available.',
        required: false,
    },
    {
        id: 'financials',
        label: 'Financials / ITR / Revenue Proof',
        description: 'Optional financial statements, ITR, invoices or revenue proof.',
        required: false,
    },
];

const INDUSTRIES = [
    'Fintech',
    'SaaS / Software',
    'AI / Automation',
    'E-commerce',
    'Healthcare',
    'Education',
    'Agritech',
    'Manufacturing',
    'Consumer Products',
    'Clean Energy',
    'Logistics',
    'Other',
];

const STAGES = ['Idea', 'Prototype', 'MVP', 'Early Revenue', 'Growth'];

const UploadCard: React.FC<{
    doc: StartupDocument;
    files: File[];
    onChange: (docId: StartupDocId, files: File[]) => void;
}> = ({ doc, files, onChange }) => (
    <motion.div
        layout
        whileHover={{ y: -3 }}
        className={`rounded-[1.35rem] border p-4 shadow-sm transition ${files.length > 0 ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${files.length > 0 ? 'bg-emerald-100 text-emerald-700' : doc.required ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {files.length > 0 ? `${files.length} uploaded` : doc.required ? 'required' : 'optional'}
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
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.zip"
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

const StartupIndiaRegistrationPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState(1);
    const [startupData, setStartupData] = useState({
        startupName: '',
        entityType: '',
        cin: '',
        incorporationDate: '',
        companyPan: '',
        registeredOffice: '',
        state: '',
        website: '',
        industry: INDUSTRIES[0],
        stage: STAGES[2],
    });
    const [businessData, setBusinessData] = useState({
        natureOfBusiness: '',
        businessObjective: '',
        problemStatement: '',
        solutionInnovation: '',
        revenueModel: '',
        scalabilityPlan: '',
        employmentWealthCreation: '',
    });
    const [founderData, setFounderData] = useState({
        authorizedSignatory: '',
        designation: '',
        mobile: '',
        email: '',
        founderCount: '',
    });
    const [files, setFiles] = useState<Record<StartupDocId, File[]>>({
        incorporationCertificate: [],
        companyPan: [],
        authorizedSignatoryKyc: [],
        businessWriteup: [],
        pitchDeck: [],
        productProof: [],
        ipProof: [],
        fundingIncubationProof: [],
        gstOrMsme: [],
        financials: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState<{ referenceId: string; submittedAt: string } | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setStartupData(prev => ({
            ...prev,
            startupName: prev.startupName || client.name,
            entityType: prev.entityType || getEntityLabel(client.entityType),
        }));
        setFounderData(prev => ({
            ...prev,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
    }, [client]);

    const requiredReady = STARTUP_DOCS.filter(doc => doc.required).every(doc => files[doc.id].length > 0);
    const uploadedCount = useMemo(() => (Object.values(files) as File[][]).reduce((count, fileList) => count + fileList.length, 0), [files]);
    const completion = Math.round((STARTUP_DOCS.filter(doc => files[doc.id].length > 0).length / STARTUP_DOCS.length) * 100);

    const updateFiles = (docId: StartupDocId, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!startupData.startupName.trim()) return 'Please enter startup name.';
            if (!startupData.cin.trim()) return 'Please enter CIN / registration number.';
            if (!startupData.incorporationDate) return 'Please select incorporation date.';
            if (!startupData.companyPan.trim()) return 'Please enter company PAN.';
        }
        if (step === 2) {
            if (!businessData.natureOfBusiness.trim()) return 'Please enter nature of business.';
            if (!businessData.businessObjective.trim()) return 'Please enter business objective.';
            if (!businessData.solutionInnovation.trim()) return 'Please explain innovation or improvement.';
            if (!businessData.scalabilityPlan.trim()) return 'Please enter scalability plan.';
        }
        if (step === 3) {
            if (!founderData.authorizedSignatory.trim()) return 'Please enter authorized signatory name.';
            if (!founderData.designation.trim()) return 'Please enter designation.';
            if (!founderData.mobile.trim() || !founderData.email.trim()) return 'Please enter mobile and email.';
        }
        if (step === 4 && !requiredReady) return 'Please upload all required Startup India documents.';
        return '';
    };

    const goNext = () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setError('');
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
            const uploadQueue: Array<{ doc: StartupDocument; file: File; index: number }> = [];
            STARTUP_DOCS.forEach(doc => {
                files[doc.id].forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `${item.doc.id}_${item.index + 1}` : item.doc.id,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                startupData,
                businessData,
                founderData,
                documentStatuses: STARTUP_DOCS.map(doc => ({
                    document: doc.label,
                    status: files[doc.id].length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: ['DPIIT Recognition Certificate', 'Startup India application acknowledgement'],
                timeline: ['Documents Uploaded', 'Eligibility Review', 'DPIIT Profile Preparation', 'Application Submitted', 'Recognition Certificate Available'],
            };

            const serviceName = 'Startup India Registration';
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
                status: 'Startup India Registration Request Submitted',
                submittedAt,
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
            });
        } catch (err: any) {
            console.error('Startup India submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit Startup India request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading Startup India workflow...</div>
            </div>
        );
    }

    if (submitted) {
        const timeline = ['Documents Uploaded', 'Eligibility Review', 'DPIIT Profile Preparation', 'Application Submitted', 'Recognition Certificate Available'];

        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Startup India Registration</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Request submitted</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The Startup India / DPIIT recognition request is now in review. Status and output documents will appear on the dashboard.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submitted.referenceId}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Files Uploaded</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{uploadedCount}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Submitted</p>
                                <p className="mt-2 text-base font-black text-slate-950">{submitted.submittedAt}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {timeline.map((item, index) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-emerald-100 text-emerald-700' : index === 1 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-950">{item}</p>
                                            <p className="text-sm font-bold text-slate-500">{index === 0 ? 'Completed' : index === 1 ? 'Next step' : 'Pending'}</p>
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
                                Edit Startup Details
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
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Startup India Registration</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">DPIIT recognition workflow</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Capture startup eligibility, innovation narrative, founder/KYC details and supporting documents for Startup India recognition.
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
                    {['Startup', 'Objective', 'Founder', 'Documents', 'Review'].map((label, index) => (
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
                            {step === 1 && 'Startup profile'}
                            {step === 2 && 'Business objective and innovation'}
                            {step === 3 && 'Founder / KYC details'}
                            {step === 4 && 'Upload Startup India documents'}
                            {step === 5 && 'Review and submit'}
                        </h2>

                        <div className="mt-6">
                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        ['startupName', 'Startup / Company Name'],
                                        ['entityType', 'Entity Type'],
                                        ['cin', 'CIN / Registration Number'],
                                        ['incorporationDate', 'Incorporation Date'],
                                        ['companyPan', 'Company PAN'],
                                        ['state', 'State'],
                                        ['registeredOffice', 'Registered Office'],
                                        ['website', 'Website / App Link'],
                                    ].map(([key, label]) => (
                                        <label key={key} className={key === 'registeredOffice' ? 'md:col-span-2' : ''}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <input
                                                type={key === 'incorporationDate' ? 'date' : 'text'}
                                                value={startupData[key as keyof typeof startupData]}
                                                onChange={(event) => setStartupData(prev => ({ ...prev, [key]: event.target.value }))}
                                                className="input"
                                                placeholder={label}
                                            />
                                        </label>
                                    ))}
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Industry / Sector</span>
                                        <select value={startupData.industry} onChange={(event) => setStartupData(prev => ({ ...prev, industry: event.target.value }))} className="input">
                                            {INDUSTRIES.map(industry => <option key={industry}>{industry}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Startup Stage</span>
                                        <select value={startupData.stage} onChange={(event) => setStartupData(prev => ({ ...prev, stage: event.target.value }))} className="input">
                                            {STAGES.map(stageOption => <option key={stageOption}>{stageOption}</option>)}
                                        </select>
                                    </label>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-4">
                                    {[
                                        ['natureOfBusiness', 'Nature of Business'],
                                        ['businessObjective', 'Business Objective'],
                                        ['problemStatement', 'Problem Being Solved'],
                                        ['solutionInnovation', 'Innovation / Improvement'],
                                        ['revenueModel', 'Revenue Model'],
                                        ['scalabilityPlan', 'Scalability Plan'],
                                        ['employmentWealthCreation', 'Employment / Wealth Creation Potential'],
                                    ].map(([key, label]) => (
                                        <label key={key}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <textarea
                                                value={businessData[key as keyof typeof businessData]}
                                                onChange={(event) => setBusinessData(prev => ({ ...prev, [key]: event.target.value }))}
                                                className="input min-h-[95px]"
                                                placeholder={label}
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        ['authorizedSignatory', 'Authorized Signatory / Founder Name'],
                                        ['designation', 'Designation'],
                                        ['mobile', 'Mobile Number'],
                                        ['email', 'Email ID'],
                                        ['founderCount', 'Number of Founders / Directors'],
                                    ].map(([key, label]) => (
                                        <label key={key}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <input
                                                value={founderData[key as keyof typeof founderData]}
                                                onChange={(event) => setFounderData(prev => ({ ...prev, [key]: event.target.value }))}
                                                className="input"
                                                placeholder={label}
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {STARTUP_DOCS.map(doc => (
                                        <UploadCard key={doc.id} doc={doc} files={files[doc.id]} onChange={updateFiles} />
                                    ))}
                                </div>
                            )}

                            {step === 5 && (
                                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                                    <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-950">{startupData.startupName}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{businessData.natureOfBusiness}</p>
                                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Industry</span><span>{startupData.industry}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Stage</span><span>{startupData.stage}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                        </div>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-blue">After submission</p>
                                        <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                                            {['Documents Uploaded', 'Eligibility Review', 'DPIIT Profile Preparation', 'Application Submitted', 'Recognition Certificate Available'].map((item, index) => (
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
                                    {isSubmitting ? <LoaderIcon /> : 'Submit Startup India Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Readiness</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Recognition cockpit</h2>
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
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>Review</span></div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 bg-purple-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-ease-purple">Important</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                    DPIIT recognition depends on eligibility and the innovation/scalability explanation submitted on the official Startup India workflow.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default StartupIndiaRegistrationPage;
