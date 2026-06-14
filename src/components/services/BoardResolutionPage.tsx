import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, downloadFile, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

type ResolutionPurpose =
    | 'bank-account'
    | 'gst-registration'
    | 'director-authorisation'
    | 'loan-approval'
    | 'share-allotment'
    | 'registered-office'
    | 'auditor-appointment'
    | 'custom';

const PURPOSES: Array<{
    id: ResolutionPurpose;
    title: string;
    description: string;
    badge: string;
}> = [
    {
        id: 'bank-account',
        title: 'Bank Account Opening',
        description: 'Authorize opening and operation of company bank account.',
        badge: 'Most used',
    },
    {
        id: 'gst-registration',
        title: 'GST Registration',
        description: 'Authorize one director/signatory to apply for GST registration.',
        badge: 'Compliance',
    },
    {
        id: 'director-authorisation',
        title: 'Authorize Director',
        description: 'Authorize one director for filings, agreements, submissions or operational work.',
        badge: 'General',
    },
    {
        id: 'loan-approval',
        title: 'Loan / Bank Finance',
        description: 'Approve loan application, banking documents and related authorization.',
        badge: 'Finance',
    },
    {
        id: 'share-allotment',
        title: 'Share Allotment',
        description: 'Approve allotment of shares and related ROC documentation.',
        badge: 'Capital',
    },
    {
        id: 'registered-office',
        title: 'Registered Office Change',
        description: 'Approve change or update of registered office address.',
        badge: 'ROC',
    },
    {
        id: 'auditor-appointment',
        title: 'Auditor Appointment',
        description: 'Approve appointment or reappointment of statutory auditor.',
        badge: 'Annual',
    },
    {
        id: 'custom',
        title: 'Custom Resolution',
        description: 'Create a board resolution for any other specific company purpose.',
        badge: 'Custom',
    },
];

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const valueOrBlank = (value: string, fallback = '__________________________') => escapeHtml(value.trim() || fallback);

const sanitizeFileName = (value: string) => value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Board_Resolution';

const makeDataUrl = (html: string) => {
    const encoded = window.btoa(unescape(encodeURIComponent(html)));
    return `data:application/msword;charset=utf-8;base64,${encoded}`;
};

const formatDate = (value: string) => {
    if (!value) return '___ / ___ / ______';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const BoardResolutionPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [purpose, setPurpose] = useState<ResolutionPurpose | null>(null);
    const [formData, setFormData] = useState({
        companyName: '',
        cin: '',
        registeredOffice: '',
        meetingDate: new Date().toISOString().slice(0, 10),
        meetingTime: '',
        meetingPlace: '',
        chairperson: '',
        authorizedDirector: '',
        authorizedDirectorDin: '',
        bankName: '',
        branchName: '',
        lenderName: '',
        loanAmount: '',
        shareDetails: '',
        newOfficeAddress: '',
        auditorName: '',
        customPurpose: '',
        customResolutionText: '',
        notes: '',
    });
    const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [generatedDoc, setGeneratedDoc] = useState<ProfileDocument | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setFormData(prev => ({
            ...prev,
            companyName: prev.companyName || client.name,
        }));
    }, [client]);

    const selectedPurpose = PURPOSES.find(item => item.id === purpose);

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!purpose) return 'Please select the resolution purpose.';
        if (!formData.companyName.trim()) return 'Please enter company name.';
        if (!formData.meetingDate) return 'Please select board meeting date.';
        if (!formData.meetingPlace.trim()) return 'Please enter meeting place.';
        if (!formData.chairperson.trim()) return 'Please enter chairperson name.';
        if (!formData.authorizedDirector.trim()) return 'Please enter authorized director/signatory name.';
        if (purpose === 'bank-account' && !formData.bankName.trim()) return 'Please enter bank name.';
        if (purpose === 'loan-approval' && (!formData.lenderName.trim() || !formData.loanAmount.trim())) return 'Please enter lender name and loan amount.';
        if (purpose === 'share-allotment' && !formData.shareDetails.trim()) return 'Please enter share allotment details.';
        if (purpose === 'registered-office' && !formData.newOfficeAddress.trim()) return 'Please enter new registered office address.';
        if (purpose === 'auditor-appointment' && !formData.auditorName.trim()) return 'Please enter auditor name.';
        if (purpose === 'custom' && (!formData.customPurpose.trim() || !formData.customResolutionText.trim())) return 'Please enter custom purpose and resolution text.';
        return '';
    };

    const resolutionText = () => {
        const director = valueOrBlank(formData.authorizedDirector);
        const din = formData.authorizedDirectorDin.trim() ? `, DIN ${valueOrBlank(formData.authorizedDirectorDin)}` : '';

        switch (purpose) {
            case 'bank-account':
                return `RESOLVED THAT approval of the Board be and is hereby accorded to open and operate a current account in the name of the Company with ${valueOrBlank(formData.bankName)}${formData.branchName.trim() ? `, ${valueOrBlank(formData.branchName)} branch` : ''}.<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to sign, execute and submit all account opening forms, KYC documents, declarations, internet banking forms and other papers as may be required by the bank.`;
            case 'gst-registration':
                return `RESOLVED THAT ${director}${din} be and is hereby authorized to apply for GST registration, sign and submit forms, upload documents, verify OTPs, appoint professionals and do all acts required for obtaining GST registration and managing GST portal access for the Company.`;
            case 'director-authorisation':
                return `RESOLVED THAT ${director}${din} be and is hereby authorized to represent the Company before government departments, banks, tax authorities, vendors, customers and other institutions, and to sign applications, forms, declarations, agreements and correspondence for and on behalf of the Company.`;
            case 'loan-approval':
                return `RESOLVED THAT approval of the Board be and is hereby accorded to apply for and avail loan/credit facility of Rs. ${valueOrBlank(formData.loanAmount, '__________')} from ${valueOrBlank(formData.lenderName)} on such terms as may be agreed.<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to negotiate, sign and submit loan applications, sanction letters, security documents, declarations and all related papers.`;
            case 'share-allotment':
                return `RESOLVED THAT approval of the Board be and is hereby accorded for allotment of shares as per the following details: ${valueOrBlank(formData.shareDetails)}.<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to make entries in statutory registers, issue share certificates and file necessary forms with the Registrar of Companies.`;
            case 'registered-office':
                return `RESOLVED THAT approval of the Board be and is hereby accorded to shift/update the registered office of the Company to ${valueOrBlank(formData.newOfficeAddress)}.<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to file necessary forms, documents and intimations with the Registrar of Companies and other authorities.`;
            case 'auditor-appointment':
                return `RESOLVED THAT ${valueOrBlank(formData.auditorName)} be and is hereby appointed/reappointed as Statutory Auditor of the Company, subject to applicable provisions of the Companies Act, 2013.<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to file Form ADT-1 and other necessary documents with the Registrar of Companies.`;
            case 'custom':
                return `RESOLVED THAT ${valueOrBlank(formData.customResolutionText, 'the matter placed before the Board be and is hereby approved.')}<br/><br/>RESOLVED FURTHER THAT ${director}${din} be and is hereby authorized to do all acts, deeds and things necessary to give effect to this resolution.`;
            default:
                return '';
        }
    };

    const createResolutionHtml = () => `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>Board Resolution - ${valueOrBlank(formData.companyName)}</title>
                <style>
                    body { font-family: Georgia, 'Times New Roman', serif; color: #111827; padding: 48px; line-height: 1.65; }
                    h1 { text-align: center; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
                    h2 { text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 28px; }
                    p { margin: 10px 0; }
                    .meta { border: 1px solid #9ca3af; padding: 14px; margin: 24px 0; }
                    .resolution { margin-top: 28px; }
                    .sign { margin-top: 60px; }
                </style>
            </head>
            <body>
                <h1>Certified True Copy of Board Resolution</h1>
                <h2>${valueOrBlank(formData.companyName)}</h2>
                <p>CIN: ${valueOrBlank(formData.cin, '________________')}</p>
                <p>Registered Office: ${valueOrBlank(formData.registeredOffice)}</p>

                <div class="meta">
                    <p>Extract of the resolution passed at the meeting of the Board of Directors of the Company held on ${escapeHtml(formatDate(formData.meetingDate))}${formData.meetingTime.trim() ? ` at ${valueOrBlank(formData.meetingTime)}` : ''} at ${valueOrBlank(formData.meetingPlace)}.</p>
                    <p>Chairperson: ${valueOrBlank(formData.chairperson)}</p>
                    <p>Purpose: ${valueOrBlank(selectedPurpose?.title || formData.customPurpose)}</p>
                </div>

                <div class="resolution">
                    ${resolutionText()}
                </div>

                ${formData.notes.trim() ? `<p><strong>Notes:</strong> ${valueOrBlank(formData.notes)}</p>` : ''}

                <div class="sign">
                    <p>For ${valueOrBlank(formData.companyName)}</p>
                    <br/><br/>
                    <p>__________________________</p>
                    <p>${valueOrBlank(formData.authorizedDirector)}</p>
                    <p>Authorized Director / Signatory</p>
                </div>
            </body>
        </html>
    `;

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!client || !selectedPurpose) {
            setError('Client context is missing. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const supportingDocuments: ProfileDocument[] = await Promise.all(supportingFiles.map(async (file, index) => ({
                type: `BoardResolutionSupport_${index + 1}`,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(file),
            })));

            const baseName = sanitizeFileName(`${client.name}_${selectedPurpose.title}`);
            const resolutionDoc: ProfileDocument = {
                type: 'BoardResolutionDraft',
                fileName: `${baseName}_Board_Resolution.doc`,
                uploadedAt: new Date().toISOString(),
                fileData: makeDataUrl(createResolutionHtml()),
            };

            const serviceName = `Board Resolution - ${selectedPurpose.title}`;
            const extractedData = {
                purpose: selectedPurpose.title,
                formData,
                expectedOutputs: ['Board Resolution Draft'],
            };

            const newProfile = processServiceApplication(client.id, null, serviceName, extractedData, [...supportingDocuments, resolutionDoc]);
            const existingSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
            const submissionId = Date.now();

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
                outputDocuments: [resolutionDoc],
                status: 'Board Resolution Draft Generated',
                submittedAt: new Date().toLocaleString(),
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setGeneratedDoc(resolutionDoc);
        } catch (err: any) {
            console.error('Board resolution generation failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to generate board resolution.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading board resolution workflow...</div>
            </div>
        );
    }

    if (generatedDoc) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-4xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Board resolution ready</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Draft generated successfully</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The board resolution draft has been saved to the dashboard output section.
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Output document</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">{generatedDoc.fileName}</h2>
                                <button onClick={() => downloadFile(generatedDoc.fileName, generatedDoc.fileData)} className="blue-glow-button mt-5">
                                    Download Board Resolution
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="soft-button bg-white text-slate-900">
                                Back to Dashboard
                            </button>
                            <button onClick={() => { setGeneratedDoc(null); setPurpose(null); }} className="soft-button bg-white text-slate-900">
                                Create Another Resolution
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (!purpose) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                                Back to workspace
                            </button>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Board Resolutions</p>
                            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Choose resolution purpose</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Generate company board resolution drafts for banking, GST, director authorization, ROC and finance actions.
                            </p>
                        </div>
                    </section>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {PURPOSES.map((item, index) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                whileHover={{ y: -6 }}
                                onClick={() => setPurpose(item.id)}
                                className="glass-card flex min-h-[230px] flex-col p-5 text-left transition hover:border-ease-electric/30 hover:shadow-2xl"
                            >
                                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">{item.badge}</span>
                                <h2 className="mt-5 text-xl font-black text-slate-950">{item.title}</h2>
                                <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{item.description}</p>
                                <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ease-green px-4 py-3 text-sm font-black text-white">
                                    Get Started <ArrowIcon />
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setPurpose(null)} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to purposes
                        </button>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Board Resolution Draft</p>
                        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{selectedPurpose?.title}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">{selectedPurpose?.description}</p>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <main className="glass-card p-5 md:p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                ['companyName', 'Company Name'],
                                ['cin', 'CIN'],
                                ['registeredOffice', 'Registered Office'],
                                ['meetingDate', 'Board Meeting Date'],
                                ['meetingTime', 'Meeting Time'],
                                ['meetingPlace', 'Meeting Place'],
                                ['chairperson', 'Chairperson'],
                                ['authorizedDirector', 'Authorized Director / Signatory'],
                                ['authorizedDirectorDin', 'Director DIN'],
                            ].map(([key, label]) => (
                                <label key={key} className={key === 'registeredOffice' ? 'md:col-span-2' : ''}>
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                    <input
                                        type={key === 'meetingDate' ? 'date' : 'text'}
                                        value={formData[key as keyof typeof formData]}
                                        onChange={(event) => updateField(key as keyof typeof formData, event.target.value)}
                                        className="input"
                                        placeholder={label}
                                    />
                                </label>
                            ))}

                            {purpose === 'bank-account' && (
                                <>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Bank Name</span>
                                        <input value={formData.bankName} onChange={(event) => updateField('bankName', event.target.value)} className="input" placeholder="Bank name" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Branch</span>
                                        <input value={formData.branchName} onChange={(event) => updateField('branchName', event.target.value)} className="input" placeholder="Branch name" />
                                    </label>
                                </>
                            )}

                            {purpose === 'loan-approval' && (
                                <>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Lender / Bank Name</span>
                                        <input value={formData.lenderName} onChange={(event) => updateField('lenderName', event.target.value)} className="input" placeholder="Lender name" />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Loan Amount</span>
                                        <input value={formData.loanAmount} onChange={(event) => updateField('loanAmount', event.target.value)} className="input" placeholder="Amount" />
                                    </label>
                                </>
                            )}

                            {purpose === 'share-allotment' && (
                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Share Allotment Details</span>
                                    <textarea value={formData.shareDetails} onChange={(event) => updateField('shareDetails', event.target.value)} className="input min-h-[110px]" placeholder="Number of shares, allottees, face value, premium, consideration..." />
                                </label>
                            )}

                            {purpose === 'registered-office' && (
                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">New Registered Office Address</span>
                                    <textarea value={formData.newOfficeAddress} onChange={(event) => updateField('newOfficeAddress', event.target.value)} className="input min-h-[110px]" placeholder="New office address" />
                                </label>
                            )}

                            {purpose === 'auditor-appointment' && (
                                <label className="md:col-span-2">
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Auditor Name</span>
                                    <input value={formData.auditorName} onChange={(event) => updateField('auditorName', event.target.value)} className="input" placeholder="Auditor / firm name" />
                                </label>
                            )}

                            {purpose === 'custom' && (
                                <>
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Custom Purpose</span>
                                        <input value={formData.customPurpose} onChange={(event) => updateField('customPurpose', event.target.value)} className="input" placeholder="Purpose of resolution" />
                                    </label>
                                    <label className="md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Resolution Text</span>
                                        <textarea value={formData.customResolutionText} onChange={(event) => updateField('customResolutionText', event.target.value)} className="input min-h-[130px]" placeholder="Enter the main resolution text." />
                                    </label>
                                </>
                            )}

                            <label className="md:col-span-2">
                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notes / Additional Instructions</span>
                                <textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} className="input min-h-[110px]" placeholder="Any additional details to include or review." />
                            </label>

                            <div className="md:col-span-2 rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-black text-slate-950">Supporting Documents</p>
                                        <p className="mt-1 text-sm text-slate-500">Optional: upload bank letter, GST details, auditor consent, finance papers or internal notes.</p>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-ease-blue px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                                        Add Files
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx"
                                            onClick={(event) => { event.currentTarget.value = ''; }}
                                            onChange={(event) => setSupportingFiles(prev => [...prev, ...Array.from(event.target.files || [])])}
                                        />
                                    </label>
                                </div>
                                {supportingFiles.length > 0 && (
                                    <div className="mt-4 grid gap-2">
                                        {supportingFiles.map((file, index) => (
                                            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                                                <span className="truncate font-bold text-slate-700">{file.name}</span>
                                                <button type="button" onClick={() => setSupportingFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))} className="ml-3 text-xs font-black text-red-600">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                {isSubmitting ? <LoaderIcon /> : 'Generate Board Resolution'}
                            </button>
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Resolution Status</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Draft workflow</h2>
                                <div className="mt-5 space-y-3">
                                    {['Purpose selected', 'Details captured', 'Draft generated', 'Saved to dashboard'].map((item, index) => (
                                        <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-ease-blue text-white' : 'bg-white text-slate-400'}`}>{index + 1}</span>
                                            <p className="text-sm font-bold text-slate-600">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BoardResolutionPage;
