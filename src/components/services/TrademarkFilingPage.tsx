import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type TrademarkDocId =
    | 'applicantKyc'
    | 'businessPan'
    | 'businessRegistration'
    | 'markRepresentation'
    | 'authorization'
    | 'useAffidavit'
    | 'useProof'
    | 'startupMsmeCertificate'
    | 'goodsServicesNote'
    | 'boardResolution';

interface TrademarkDocument {
    id: TrademarkDocId;
    label: string;
    description: string;
    required: boolean;
}

const TRADEMARK_DOCS: TrademarkDocument[] = [
    {
        id: 'applicantKyc',
        label: 'Applicant / Authorized Signatory KYC',
        description: 'PAN/Aadhaar of proprietor, partner, director or authorized signatory.',
        required: true,
    },
    {
        id: 'businessPan',
        label: 'Business PAN',
        description: 'PAN card of applicant entity or proprietor.',
        required: true,
    },
    {
        id: 'businessRegistration',
        label: 'Business Registration Proof',
        description: 'Incorporation certificate, LLP deed, partnership deed, GST or shop act proof.',
        required: true,
    },
    {
        id: 'markRepresentation',
        label: 'Trademark Representation',
        description: 'Logo/artwork file or clear word mark representation to be filed.',
        required: true,
    },
    {
        id: 'authorization',
        label: 'Authorization / Power of Attorney',
        description: 'Authorization letter or TM-48-style power of attorney for filing support.',
        required: true,
    },
    {
        id: 'useAffidavit',
        label: 'User Affidavit',
        description: 'Required when prior use of the trademark is claimed.',
        required: false,
    },
    {
        id: 'useProof',
        label: 'Proof of Use',
        description: 'Invoices, website screenshots, packaging, social pages or marketing material showing use.',
        required: false,
    },
    {
        id: 'startupMsmeCertificate',
        label: 'Startup / MSME Certificate',
        description: 'DPIIT or MSME certificate for eligible fee category support, if available.',
        required: false,
    },
    {
        id: 'goodsServicesNote',
        label: 'Goods / Services Note',
        description: 'Detailed list of goods/services under the proposed trademark.',
        required: false,
    },
    {
        id: 'boardResolution',
        label: 'Board Resolution / Partner Authorization',
        description: 'Authorization from company board or partners, if applicable.',
        required: false,
    },
];

const APPLICANT_CATEGORIES = [
    'Individual',
    'Startup',
    'Small Enterprise / MSME',
    'Private Limited Company',
    'LLP',
    'Partnership Firm',
    'Proprietorship',
    'Others',
];

const MARK_TYPES = ['Word Mark', 'Logo Mark', 'Word + Logo', 'Device / Label Mark'];
const APPLICATION_TYPES = ['Single Class', 'Multi Class'];
const USAGE_OPTIONS = ['Proposed to be used', 'Already in use'];

const TRADEMARK_TIMELINE = [
    'Details Captured',
    'Documents Uploaded',
    'Trademark Search & Class Check',
    'TM-A Application Preparation',
    'Filed on IP India',
    'Application Number / Acknowledgement Available',
];

const UploadCard: React.FC<{
    doc: TrademarkDocument;
    files: File[];
    onChange: (docId: TrademarkDocId, files: File[]) => void;
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
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.svg,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.zip"
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

const TrademarkFilingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState(1);
    const [applicantData, setApplicantData] = useState({
        applicantName: '',
        applicantCategory: APPLICANT_CATEGORIES[3],
        entityType: '',
        pan: '',
        address: '',
        mobile: '',
        email: '',
    });
    const [markData, setMarkData] = useState({
        markName: '',
        markType: MARK_TYPES[0],
        applicationType: APPLICATION_TYPES[0],
        niceClass: '',
        goodsServicesDescription: '',
        usageStatus: USAGE_OPTIONS[0],
        firstUseDate: '',
    });
    const [businessData, setBusinessData] = useState({
        natureOfBusiness: '',
        brandMeaning: '',
        targetCustomers: '',
        similarMarksKnown: '',
        filingInstruction: '',
    });
    const [files, setFiles] = useState<Record<TrademarkDocId, File[]>>({
        applicantKyc: [],
        businessPan: [],
        businessRegistration: [],
        markRepresentation: [],
        authorization: [],
        useAffidavit: [],
        useProof: [],
        startupMsmeCertificate: [],
        goodsServicesNote: [],
        boardResolution: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState<{ referenceId: string; submittedAt: string } | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setApplicantData(prev => ({
            ...prev,
            applicantName: prev.applicantName || client.name,
            entityType: prev.entityType || getEntityLabel(client.entityType),
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
    }, [client]);

    const requiredReady = TRADEMARK_DOCS.filter(doc => doc.required).every(doc => files[doc.id].length > 0);
    const uploadedCount = useMemo(() => (Object.values(files) as File[][]).reduce((count, fileList) => count + fileList.length, 0), [files]);
    const completion = Math.round((TRADEMARK_DOCS.filter(doc => files[doc.id].length > 0).length / TRADEMARK_DOCS.length) * 100);

    const updateFiles = (docId: TrademarkDocId, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!applicantData.applicantName.trim()) return 'Please enter applicant name.';
            if (!applicantData.pan.trim()) return 'Please enter applicant/business PAN.';
            if (!applicantData.address.trim()) return 'Please enter applicant address.';
            if (!applicantData.mobile.trim() || !applicantData.email.trim()) return 'Please enter mobile and email.';
        }
        if (step === 2) {
            if (!markData.markName.trim()) return 'Please enter trademark / brand name.';
            if (!markData.niceClass.trim()) return 'Please enter Nice class or class range.';
            if (!markData.goodsServicesDescription.trim()) return 'Please describe goods or services.';
            if (markData.usageStatus === 'Already in use' && !markData.firstUseDate) return 'Please enter first use date for prior use claim.';
        }
        if (step === 3) {
            if (!businessData.natureOfBusiness.trim()) return 'Please enter nature of business.';
            if (!businessData.brandMeaning.trim()) return 'Please enter brand meaning or usage context.';
        }
        if (step === 4) {
            if (!requiredReady) return 'Please upload all required trademark filing documents.';
            if (markData.usageStatus === 'Already in use' && files.useProof.length === 0 && files.useAffidavit.length === 0) {
                return 'Please upload proof of use or user affidavit for prior use claim.';
            }
        }
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
            const uploadQueue: Array<{ doc: TrademarkDocument; file: File; index: number }> = [];
            TRADEMARK_DOCS.forEach(doc => {
                files[doc.id].forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `trademark_${item.doc.id}_${item.index + 1}` : `trademark_${item.doc.id}`,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                applicantData,
                markData,
                businessData,
                documentStatuses: TRADEMARK_DOCS.map(doc => ({
                    document: doc.label,
                    status: files[doc.id].length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: ['TM-A filing acknowledgement', 'Trademark application number', 'Trademark status updates'],
                timeline: TRADEMARK_TIMELINE,
            };

            const serviceName = 'Trademark Filing';
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
                status: 'Trademark Filing Request Submitted',
                submittedAt,
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
            });
        } catch (err: any) {
            console.error('Trademark filing submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit trademark filing request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading trademark workflow...</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Trademark Filing</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Request submitted</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Your trademark filing request is in review. The application number and filing acknowledgement will appear on the dashboard once available.
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
                                {TRADEMARK_TIMELINE.map((item, index) => (
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
                                Edit Trademark Details
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
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Trademark Filing</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Protect your brand identity</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Capture applicant details, trademark class, brand usage, business context and filing documents for TM-A preparation.
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
                    {['Applicant', 'Trademark', 'Business', 'Documents', 'Review'].map((label, index) => (
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
                            {step === 1 && 'Applicant details'}
                            {step === 2 && 'Trademark and class details'}
                            {step === 3 && 'Business and brand context'}
                            {step === 4 && 'Upload trademark documents'}
                            {step === 5 && 'Review and submit'}
                        </h2>

                        <div className="mt-6">
                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Applicant Name</span>
                                        <input value={applicantData.applicantName} onChange={(event) => setApplicantData(prev => ({ ...prev, applicantName: event.target.value }))} className="input" placeholder="Applicant / entity name" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Applicant Category</span>
                                        <select value={applicantData.applicantCategory} onChange={(event) => setApplicantData(prev => ({ ...prev, applicantCategory: event.target.value }))} className="input">
                                            {APPLICANT_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Entity Type</span>
                                        <input value={applicantData.entityType} onChange={(event) => setApplicantData(prev => ({ ...prev, entityType: event.target.value }))} className="input" placeholder="Entity type" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">PAN</span>
                                        <input value={applicantData.pan} onChange={(event) => setApplicantData(prev => ({ ...prev, pan: event.target.value.toUpperCase() }))} className="input" placeholder="PAN" />
                                    </label>
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Principal Place of Business / Address</span>
                                        <textarea value={applicantData.address} onChange={(event) => setApplicantData(prev => ({ ...prev, address: event.target.value }))} className="input min-h-[90px]" placeholder="Applicant address" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mobile</span>
                                        <input value={applicantData.mobile} onChange={(event) => setApplicantData(prev => ({ ...prev, mobile: event.target.value }))} className="input" placeholder="Mobile number" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Email</span>
                                        <input value={applicantData.email} onChange={(event) => setApplicantData(prev => ({ ...prev, email: event.target.value }))} className="input" placeholder="Email ID" />
                                    </label>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Trademark / Brand Name</span>
                                        <input value={markData.markName} onChange={(event) => setMarkData(prev => ({ ...prev, markName: event.target.value }))} className="input" placeholder="Brand name" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mark Type</span>
                                        <select value={markData.markType} onChange={(event) => setMarkData(prev => ({ ...prev, markType: event.target.value }))} className="input">
                                            {MARK_TYPES.map(type => <option key={type}>{type}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Application Type</span>
                                        <select value={markData.applicationType} onChange={(event) => setMarkData(prev => ({ ...prev, applicationType: event.target.value }))} className="input">
                                            {APPLICATION_TYPES.map(type => <option key={type}>{type}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Nice Class</span>
                                        <input value={markData.niceClass} onChange={(event) => setMarkData(prev => ({ ...prev, niceClass: event.target.value }))} className="input" placeholder="Example: Class 35 / 42" />
                                    </label>
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Goods / Services Description</span>
                                        <textarea value={markData.goodsServicesDescription} onChange={(event) => setMarkData(prev => ({ ...prev, goodsServicesDescription: event.target.value }))} className="input min-h-[105px]" placeholder="Describe the goods or services for which the mark will be used" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Usage Status</span>
                                        <select value={markData.usageStatus} onChange={(event) => setMarkData(prev => ({ ...prev, usageStatus: event.target.value }))} className="input">
                                            {USAGE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">First Use Date</span>
                                        <input type="date" value={markData.firstUseDate} onChange={(event) => setMarkData(prev => ({ ...prev, firstUseDate: event.target.value }))} className="input" disabled={markData.usageStatus !== 'Already in use'} />
                                    </label>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4">
                                    {[
                                        ['natureOfBusiness', 'Nature of Business'],
                                        ['brandMeaning', 'Brand Meaning / How the mark is used'],
                                        ['targetCustomers', 'Target Customers / Market'],
                                        ['similarMarksKnown', 'Similar Marks Known, if any'],
                                        ['filingInstruction', 'Special Filing Instruction'],
                                    ].map(([key, label]) => (
                                        <label key={key}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <textarea
                                                value={businessData[key as keyof typeof businessData]}
                                                onChange={(event) => setBusinessData(prev => ({ ...prev, [key]: event.target.value }))}
                                                className="input min-h-[90px]"
                                                placeholder={label}
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {TRADEMARK_DOCS.map(doc => (
                                        <UploadCard key={doc.id} doc={doc} files={files[doc.id]} onChange={updateFiles} />
                                    ))}
                                </div>
                            )}

                            {step === 5 && (
                                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                                    <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-950">{markData.markName || 'Trademark Filing'}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{markData.goodsServicesDescription}</p>
                                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Applicant</span><span>{applicantData.applicantName}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Mark type</span><span>{markData.markType}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Class</span><span>{markData.niceClass}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                        </div>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-blue">After submission</p>
                                        <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                                            {TRADEMARK_TIMELINE.map((item, index) => (
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
                                    {isSubmitting ? <LoaderIcon /> : 'Submit Trademark Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Filing Readiness</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Brand protection cockpit</h2>
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
                                    Trademark filing depends on correct class selection, applicant category, mark representation and proof of use when prior use is claimed.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default TrademarkFilingPage;
