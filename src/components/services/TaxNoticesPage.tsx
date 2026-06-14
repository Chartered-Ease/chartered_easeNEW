import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type TaxNoticeDocId =
    | 'noticeCopy'
    | 'itrAckComputation'
    | 'ais26as'
    | 'supportingDocs'
    | 'previousCorrespondence';

interface TaxNoticeDocument {
    id: TaxNoticeDocId;
    label: string;
    description: string;
    required: boolean;
}

const TAX_NOTICE_DOCS: TaxNoticeDocument[] = [
    {
        id: 'noticeCopy',
        label: 'Notice Received',
        description: 'Upload the notice copy, PDF, screenshot or email received from the Income Tax Department.',
        required: true,
    },
    {
        id: 'itrAckComputation',
        label: 'ITR Acknowledgement + Computation',
        description: 'Upload ITR acknowledgement and computation for the same year, if available.',
        required: false,
    },
    {
        id: 'ais26as',
        label: 'AIS / Form 26AS / TIS',
        description: 'Tax credit and income information statement for mismatch review, if available.',
        required: false,
    },
    {
        id: 'supportingDocs',
        label: 'Supporting Documents',
        description: 'Bank statement, salary papers, capital gain report, challan or deduction proof related to the notice.',
        required: false,
    },
    {
        id: 'previousCorrespondence',
        label: 'Previous Correspondence',
        description: 'Any reply already filed, portal screenshot or past communication for this notice.',
        required: false,
    },
];

const ASSESSMENT_YEARS = ['AY 2027-28', 'AY 2026-27', 'AY 2025-26', 'AY 2024-25', 'AY 2023-24'];
const NOTICE_TYPES = [
    'Defective return notice',
    'Intimation u/s 143(1)',
    'Demand notice',
    'AIS / TIS mismatch',
    'Refund adjustment',
    'Scrutiny / verification',
    'Other income-tax notice',
];
const PORTAL_STATUS = ['Not checked', 'Available on portal', 'Downloaded', 'Not sure'];
const ITR_FILED_OPTIONS = ['Yes', 'No', 'Not sure'];
const CONTACT_MODES = ['Phone / WhatsApp', 'Email', 'Video call', 'Any mode'];
const TAX_NOTICE_TIMELINE = [
    'Notice Uploaded',
    'Team Review',
    'Issue Classification',
    'Client Contact',
    'Next Steps Shared',
];

const UploadCard: React.FC<{
    doc: TaxNoticeDocument;
    files: File[];
    onChange: (docId: TaxNoticeDocId, files: File[]) => void;
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

const TaxNoticesPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState(1);
    const [noticeData, setNoticeData] = useState({
        assessmentYear: ASSESSMENT_YEARS[0],
        noticeType: NOTICE_TYPES[0],
        noticeDate: '',
        responseDueDate: '',
        noticeReference: '',
        amountInvolved: '',
        portalStatus: PORTAL_STATUS[0],
    });
    const [taxReturnData, setTaxReturnData] = useState({
        itrFiled: ITR_FILED_OPTIONS[0],
        returnFiledDate: '',
        acknowledgementNumber: '',
        demandPaid: 'No',
    });
    const [contactData, setContactData] = useState({
        issueSummary: '',
        actionAlreadyTaken: '',
        preferredContactTime: 'Anytime during business hours',
        contactMode: CONTACT_MODES[0],
    });
    const [files, setFiles] = useState<Record<TaxNoticeDocId, File[]>>({
        noticeCopy: [],
        itrAckComputation: [],
        ais26as: [],
        supportingDocs: [],
        previousCorrespondence: [],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ referenceId: string; submittedAt: string } | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    const requiredReady = TAX_NOTICE_DOCS.filter(doc => doc.required).every(doc => files[doc.id].length > 0);
    const uploadedCount = useMemo(() => (Object.values(files) as File[][]).reduce((count, fileList) => count + fileList.length, 0), [files]);
    const completion = Math.round((TAX_NOTICE_DOCS.filter(doc => files[doc.id].length > 0).length / TAX_NOTICE_DOCS.length) * 100);
    const amountInvolved = Number(noticeData.amountInvolved || 0);

    const updateFiles = (docId: TaxNoticeDocId, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!noticeData.assessmentYear.trim()) return 'Please select the assessment year.';
            if (!noticeData.noticeType.trim()) return 'Please select notice type.';
            if (!noticeData.noticeDate.trim()) return 'Please enter notice date.';
        }
        if (step === 2) {
            if (!contactData.issueSummary.trim()) return 'Please add a short summary of what the notice is about.';
            if (!contactData.preferredContactTime.trim()) return 'Please add preferred contact time.';
        }
        if (step === 3 && !requiredReady) return 'Please upload the notice received.';
        return '';
    };

    const goNext = () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setError('');
        setStep(current => Math.min(current + 1, 4));
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
            const uploadQueue: Array<{ doc: TaxNoticeDocument; file: File; index: number }> = [];
            TAX_NOTICE_DOCS.forEach(doc => {
                files[doc.id].forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `tax_notice_${item.doc.id}_${item.index + 1}` : `tax_notice_${item.doc.id}`,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                noticeData,
                taxReturnData,
                contactData,
                summary: {
                    amountInvolved,
                    itrDocumentsAvailable: files.itrAckComputation.length > 0,
                    noticeUploaded: files.noticeCopy.length > 0,
                    contactMode: contactData.contactMode,
                },
                documentStatuses: TAX_NOTICE_DOCS.map(doc => ({
                    document: doc.label,
                    status: files[doc.id].length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: ['Notice review summary', 'Response requirement checklist', 'Draft reply if applicable'],
                timeline: TAX_NOTICE_TIMELINE,
            };

            const serviceName = 'Tax Notice Review';
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
                status: 'Tax Notice Review Submitted',
                submittedAt,
                createdByType: isAgentAuthenticated ? 'agent' : 'customer',
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
            });
        } catch (err: any) {
            console.error('Tax notice submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit tax notice review.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading tax notice workflow...</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Tax Notice Review</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Notice submitted for review</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Your notice and supporting documents are received. The Chartered Ease team will review the case and contact you for the next steps.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submitted.referenceId}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Assessment Year</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{noticeData.assessmentYear}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Files Uploaded</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{uploadedCount}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {TAX_NOTICE_TIMELINE.map((item, index) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-emerald-100 text-emerald-700' : index === 1 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
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

                        <div className="border-t border-slate-100 bg-orange-50/70 p-6">
                            <p className="text-xs font-black uppercase tracking-wide text-orange-700">What happens now</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                Our team will review the notice, ITR records and documents uploaded here. We will contact you before preparing any reply or action plan.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="blue-glow-button">
                                Back to Dashboard
                            </button>
                            <button onClick={() => { setSubmitted(null); setStep(1); }} className="soft-button bg-white text-slate-900">
                                Edit Notice Details
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
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Tax Notice Review</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Upload notice and get expert review</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Share the notice received, ITR acknowledgement and computation if available. Our team will review and contact you with the next action required.
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

                <div className="grid gap-3 sm:grid-cols-4">
                    {['Notice', 'Context', 'Documents', 'Review'].map((label, index) => (
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
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Step {step} of 4</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">
                            {step === 1 && 'Notice details'}
                            {step === 2 && 'ITR context and contact preference'}
                            {step === 3 && 'Upload notice documents'}
                            {step === 4 && 'Review and submit'}
                        </h2>

                        <div className="mt-6">
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Assessment Year</span>
                                            <select value={noticeData.assessmentYear} onChange={(event) => setNoticeData(prev => ({ ...prev, assessmentYear: event.target.value }))} className="input">
                                                {ASSESSMENT_YEARS.map(year => <option key={year}>{year}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notice Type</span>
                                            <select value={noticeData.noticeType} onChange={(event) => setNoticeData(prev => ({ ...prev, noticeType: event.target.value }))} className="input">
                                                {NOTICE_TYPES.map(type => <option key={type}>{type}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notice Date</span>
                                            <input type="date" value={noticeData.noticeDate} onChange={(event) => setNoticeData(prev => ({ ...prev, noticeDate: event.target.value }))} className="input" />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Response Due Date</span>
                                            <input type="date" value={noticeData.responseDueDate} onChange={(event) => setNoticeData(prev => ({ ...prev, responseDueDate: event.target.value }))} className="input" />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">DIN / Notice Reference</span>
                                            <input value={noticeData.noticeReference} onChange={(event) => setNoticeData(prev => ({ ...prev, noticeReference: event.target.value }))} className="input" placeholder="DIN, communication reference or demand number" />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Amount Involved, if any</span>
                                            <input type="number" min="0" value={noticeData.amountInvolved} onChange={(event) => setNoticeData(prev => ({ ...prev, amountInvolved: event.target.value }))} className="input" placeholder="Amount in Rs." />
                                        </label>
                                    </div>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Portal Status</span>
                                        <select value={noticeData.portalStatus} onChange={(event) => setNoticeData(prev => ({ ...prev, portalStatus: event.target.value }))} className="input">
                                            {PORTAL_STATUS.map(status => <option key={status}>{status}</option>)}
                                        </select>
                                    </label>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Was ITR Filed For This Year?</span>
                                            <select value={taxReturnData.itrFiled} onChange={(event) => setTaxReturnData(prev => ({ ...prev, itrFiled: event.target.value }))} className="input">
                                                {ITR_FILED_OPTIONS.map(option => <option key={option}>{option}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Return Filed Date, if known</span>
                                            <input type="date" value={taxReturnData.returnFiledDate} onChange={(event) => setTaxReturnData(prev => ({ ...prev, returnFiledDate: event.target.value }))} className="input" />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">ITR Acknowledgement Number</span>
                                            <input value={taxReturnData.acknowledgementNumber} onChange={(event) => setTaxReturnData(prev => ({ ...prev, acknowledgementNumber: event.target.value }))} className="input" placeholder="Optional" />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Any Demand Already Paid?</span>
                                            <select value={taxReturnData.demandPaid} onChange={(event) => setTaxReturnData(prev => ({ ...prev, demandPaid: event.target.value }))} className="input">
                                                <option>No</option>
                                                <option>Yes</option>
                                                <option>Partly paid</option>
                                                <option>Not sure</option>
                                            </select>
                                        </label>
                                    </div>

                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">What is the notice about?</span>
                                        <textarea value={contactData.issueSummary} onChange={(event) => setContactData(prev => ({ ...prev, issueSummary: event.target.value }))} className="input min-h-[120px]" placeholder="Example: Demand raised after ITR processing, mismatch in AIS, defective return, refund adjustment, etc." />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Action Already Taken</span>
                                        <textarea value={contactData.actionAlreadyTaken} onChange={(event) => setContactData(prev => ({ ...prev, actionAlreadyTaken: event.target.value }))} className="input min-h-[90px]" placeholder="Mention if any reply, payment or rectification has already been done." />
                                    </label>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Preferred Contact Mode</span>
                                            <select value={contactData.contactMode} onChange={(event) => setContactData(prev => ({ ...prev, contactMode: event.target.value }))} className="input">
                                                {CONTACT_MODES.map(mode => <option key={mode}>{mode}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Preferred Contact Time</span>
                                            <input value={contactData.preferredContactTime} onChange={(event) => setContactData(prev => ({ ...prev, preferredContactTime: event.target.value }))} className="input" placeholder="Example: 11 AM to 2 PM" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {TAX_NOTICE_DOCS.map(doc => (
                                        <UploadCard key={doc.id} doc={doc} files={files[doc.id]} onChange={updateFiles} />
                                    ))}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                                    <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-950">{noticeData.noticeType}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{noticeData.assessmentYear} | Notice date {noticeData.noticeDate || 'Not entered'}</p>
                                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Amount involved</span><span>Rs. {amountInvolved.toLocaleString('en-IN')}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>ITR status</span><span>{taxReturnData.itrFiled}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Notice copy</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Uploaded' : 'Pending'}</span></div>
                                        </div>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-orange-100 bg-orange-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-wide text-orange-700">After submission</p>
                                        <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                                            {TAX_NOTICE_TIMELINE.map((item, index) => (
                                                <div key={item} className="flex gap-3">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-orange-700">{index + 1}</span>
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
                            {step < 4 ? (
                                <button onClick={goNext} className="blue-glow-button">Continue</button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                    {isSubmitting ? <LoaderIcon /> : 'Submit Notice for Review'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Review Snapshot</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Notice review cockpit</h2>
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Document progress</span>
                                        <span>{completion}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Assessment year</span><span>{noticeData.assessmentYear}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Files uploaded</span><span>{uploadedCount}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>Review</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Team action</span><span>Contact user</span></div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 bg-orange-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-orange-700">Important</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                    This workflow captures documents for expert review. The team will verify the notice and contact the user before any response is filed.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default TaxNoticesPage;
