import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, downloadFile, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

interface PartnerDetails {
    fullName: string;
    parentName: string;
    residentialAddress: string;
    panFile: File | null;
    aadhaarFile: File | null;
    profitShare: string;
    capitalContribution: string;
}

interface GeneratedDeed {
    fileName: string;
    fileData: string;
}

const MIN_PARTNERS = 2;
const MAX_PARTNERS = 10;

const emptyPartner = (): PartnerDetails => ({
    fullName: '',
    parentName: '',
    residentialAddress: '',
    panFile: null,
    aadhaarFile: null,
    profitShare: '',
    capitalContribution: '',
});

const ordinalLabels = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const valueOrBlank = (value: string, fallback = '__________________________') => escapeHtml(value.trim() || fallback);

const sanitizeFileName = (value: string) => value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Partnership_Firm';

const formatDateForDeed = (dateValue: string) => {
    if (!dateValue) return '___ day of ______, 20__';
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '___ day of ______, 20__';
    return `${date.getDate()} day of ${date.toLocaleString('en-IN', { month: 'long' })}, ${date.getFullYear()}`;
};

const makeDataUrl = (html: string) => {
    const encoded = window.btoa(unescape(encodeURIComponent(html)));
    return `data:application/msword;charset=utf-8;base64,${encoded}`;
};

const DocumentUploadBox: React.FC<{
    label: string;
    description: string;
    file: File | null;
    onChange: (file: File | null) => void;
    required?: boolean;
}> = ({ label, description, file, onChange, required = true }) => (
    <div className={`rounded-[1.25rem] border p-4 shadow-sm transition ${file ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-black text-slate-950">
                    {label} {required && <span className="text-red-500">*</span>}
                </p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
                {file && <p className="mt-2 max-w-xs truncate text-xs font-black text-emerald-700">{file.name}</p>}
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-ease-blue px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                {file ? 'Replace' : 'Upload'}
                <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => onChange(event.target.files?.[0] || null)}
                    onClick={(event) => { event.currentTarget.value = ''; }}
                />
            </label>
        </div>
    </div>
);

const PartnershipRegistrationPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [partnerCount, setPartnerCount] = useState(2);
    const [partners, setPartners] = useState<PartnerDetails[]>([emptyPartner(), emptyPartner()]);
    const [firmData, setFirmData] = useState({
        firmName: '',
        deedDate: new Date().toISOString().slice(0, 10),
        deedPlace: '',
        businessActivity: '',
        businessAddress: '',
        commencementDate: '',
        durationType: 'At Will',
        fixedYears: '',
        bankOperation: 'Any two partners jointly',
        remuneration: 'As mutually agreed by all partners from time to time.',
        interestOnCapital: '12',
        notes: '',
    });
    const [businessAddressProof, setBusinessAddressProof] = useState<File | null>(null);
    const [additionalDocument, setAdditionalDocument] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [generatedDeed, setGeneratedDeed] = useState<GeneratedDeed | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    const profitTotal = useMemo(
        () => partners.reduce((total, partner) => total + Number(partner.profitShare || 0), 0),
        [partners]
    );

    const updatePartnerCount = (count: number) => {
        const safeCount = Math.min(MAX_PARTNERS, Math.max(MIN_PARTNERS, count));
        setPartnerCount(safeCount);
        setPartners(prev => {
            const next = [...prev];
            while (next.length < safeCount) next.push(emptyPartner());
            return next.slice(0, safeCount);
        });
    };

    const updateFirmField = (field: keyof typeof firmData, value: string) => {
        setFirmData(prev => ({ ...prev, [field]: value }));
    };

    const updatePartnerField = (index: number, field: keyof PartnerDetails, value: string | File | null) => {
        setPartners(prev => prev.map((partner, partnerIndex) => (
            partnerIndex === index ? { ...partner, [field]: value } : partner
        )));
    };

    const validate = () => {
        if (!firmData.firmName.trim()) return 'Please enter the partnership firm name.';
        if (!firmData.deedPlace.trim()) return 'Please enter the place where the deed is made.';
        if (!firmData.businessActivity.trim()) return 'Please enter the business activity of the firm.';
        if (!firmData.businessAddress.trim()) return 'Please enter the principal business address.';
        if (!firmData.commencementDate) return 'Please enter the commencement date.';
        if (!businessAddressProof) return 'Please upload business address proof.';

        for (let index = 0; index < partners.length; index++) {
            const partner = partners[index];
            const label = `Partner ${index + 1}`;
            if (!partner.fullName.trim()) return `${label}: Please enter full name.`;
            if (!partner.parentName.trim()) return `${label}: Please enter father/mother name.`;
            if (!partner.residentialAddress.trim()) return `${label}: Please enter residential address.`;
            if (!partner.profitShare.trim()) return `${label}: Please enter profit sharing ratio.`;
            if (Number(partner.profitShare) <= 0) return `${label}: Profit sharing ratio must be above 0.`;
            if (!partner.capitalContribution.trim()) return `${label}: Please enter capital contribution.`;
            if (!partner.panFile) return `${label}: Please upload PAN card.`;
            if (!partner.aadhaarFile) return `${label}: Please upload Aadhaar card.`;
        }

        if (Math.round(profitTotal * 100) / 100 !== 100) {
            return 'Total profit sharing ratio must be exactly 100%.';
        }

        return '';
    };

    const generateDeedHtml = () => {
        const partnerBlocks = partners.map((partner, index) => `
            <p>
                <strong>${index + 1}. Mr./Ms. ${valueOrBlank(partner.fullName)}</strong>,<br/>
                S/o / D/o ${valueOrBlank(partner.parentName)},<br/>
                Residing at ${valueOrBlank(partner.residentialAddress)},<br/>
                hereinafter referred to as the <strong>${ordinalLabels[index] || `${index + 1}th`} Partner</strong>;
            </p>
        `).join(indexSeparator());

        const capitalRows = partners.map(partner => `
            <tr>
                <td>${valueOrBlank(partner.fullName)}</td>
                <td>Rs. ${valueOrBlank(partner.capitalContribution, '__________')}</td>
            </tr>
        `).join('');

        const profitRows = partners.map(partner => `
            <tr>
                <td>${valueOrBlank(partner.fullName)}</td>
                <td>${valueOrBlank(partner.profitShare, '____')}%</td>
            </tr>
        `).join('');

        const signatureRows = partners.map(partner => `
            <tr>
                <td>${valueOrBlank(partner.fullName)}</td>
                <td>__________________________</td>
            </tr>
        `).join('');

        return `
            <!doctype html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Partnership Deed - ${valueOrBlank(firmData.firmName)}</title>
                    <style>
                        body { font-family: Georgia, 'Times New Roman', serif; color: #111827; line-height: 1.65; padding: 48px; }
                        h1 { text-align: center; font-size: 28px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 28px; }
                        h2 { font-size: 17px; margin-top: 26px; text-transform: uppercase; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
                        p { margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #9ca3af; padding: 9px 10px; text-align: left; vertical-align: top; }
                        th { background: #f3f4f6; }
                        .center { text-align: center; }
                        .muted { color: #4b5563; }
                        .note { margin-top: 24px; padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; }
                    </style>
                </head>
                <body>
                    <h1>Partnership Deed</h1>
                    <p>This Partnership Deed is made on this ${formatDateForDeed(firmData.deedDate)} at ${valueOrBlank(firmData.deedPlace)}.</p>

                    <h2>Between</h2>
                    ${partnerBlocks}
                    <p>The parties above shall collectively be referred to as the <strong>Partners</strong>.</p>

                    <h2>1. Name of the Firm</h2>
                    <p>The partnership business shall be carried on under the name and style of <strong>M/s ${valueOrBlank(firmData.firmName)}</strong>.</p>

                    <h2>2. Business of the Firm</h2>
                    <p>The business of the partnership shall be: ${valueOrBlank(firmData.businessActivity)}.</p>
                    <p>The partners may mutually agree to add or modify the business activities.</p>

                    <h2>3. Place of Business</h2>
                    <p>The principal place of business shall be situated at: ${valueOrBlank(firmData.businessAddress)}.</p>
                    <p>Branches may be opened at other places with mutual consent of all partners.</p>

                    <h2>4. Date of Commencement</h2>
                    <p>The partnership shall commence from ${valueOrBlank(firmData.commencementDate)}.</p>

                    <h2>5. Duration</h2>
                    <p>The partnership shall be ${firmData.durationType === 'Fixed Period' ? `for a fixed period of ${valueOrBlank(firmData.fixedYears, '__________')} years` : 'At Will'}.</p>

                    <h2>6. Capital Contribution</h2>
                    <p>The capital of the firm shall be contributed by the partners as follows:</p>
                    <table>
                        <thead><tr><th>Partner Name</th><th>Capital Contribution</th></tr></thead>
                        <tbody>${capitalRows}</tbody>
                    </table>
                    <p>Any additional capital required shall be contributed mutually as agreed.</p>

                    <h2>7. Profit and Loss Sharing</h2>
                    <p>The net profits and losses of the firm shall be shared among the partners in the following ratio:</p>
                    <table>
                        <thead><tr><th>Partner Name</th><th>Share Ratio</th></tr></thead>
                        <tbody>${profitRows}</tbody>
                    </table>

                    <h2>8. Management of Business</h2>
                    <ul>
                        <li>All partners shall actively participate in the business.</li>
                        <li>No partner shall transfer their share without consent of the other partners.</li>
                        <li>Major decisions shall be taken mutually.</li>
                    </ul>

                    <h2>9. Bank Account</h2>
                    <p>The bank account of the firm shall be operated by: ${valueOrBlank(firmData.bankOperation)}.</p>

                    <h2>10. Books of Accounts</h2>
                    <p>Proper books of accounts shall be maintained at the principal office of the firm and shall be open for inspection by all partners.</p>

                    <h2>11. Salary / Remuneration</h2>
                    <p>The working partners shall be entitled to salary/remuneration as mutually agreed: ${valueOrBlank(firmData.remuneration)}.</p>

                    <h2>12. Interest on Capital</h2>
                    <p>Interest on capital, if any, shall be paid at the rate of ${valueOrBlank(firmData.interestOnCapital, '____')}% per annum subject to the provisions of the Income Tax Act.</p>

                    <h2>13. Retirement / Death of Partner</h2>
                    <p>In the event of retirement or death of a partner, the remaining partners may continue the business as per mutually agreed terms.</p>

                    <h2>14. Dissolution</h2>
                    <ul>
                        <li>The firm may be dissolved by mutual consent of all partners.</li>
                        <li>The firm may be dissolved as per provisions of the Indian Partnership Act, 1932.</li>
                    </ul>

                    <h2>15. Arbitration</h2>
                    <p>Any dispute arising among the partners shall be referred to arbitration under the Arbitration and Conciliation Act.</p>

                    <h2>16. Governing Law</h2>
                    <p>This deed shall be governed by the laws of India.</p>

                    ${firmData.notes.trim() ? `<h2>17. Additional Terms</h2><p>${valueOrBlank(firmData.notes)}</p>` : ''}

                    <h2>In Witness Whereof</h2>
                    <p>The partners have signed this Partnership Deed on the date first mentioned above.</p>
                    <table>
                        <thead><tr><th>Partner Name</th><th>Signature</th></tr></thead>
                        <tbody>${signatureRows}</tbody>
                    </table>

                    <h2>Witnesses</h2>
                    <p>1. Name: __________________________ Signature: __________________________</p>
                    <p>2. Name: __________________________ Signature: __________________________</p>

                    <div class="note">
                        <strong>Next Step:</strong> This is a system-generated draft. Please take it to an advocate, print it on appropriate stamp paper as applicable in your state, and get it signed and notarized before using it for PAN, GST, bank account or registration work.
                    </div>
                </body>
            </html>
        `;
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!client) {
            setError('Client context is missing. Please go back to the dashboard and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const uploadedDocuments: Array<{ type: string; file: File }> = [];
            partners.forEach((partner, index) => {
                if (partner.panFile) uploadedDocuments.push({ type: `Partner_${index + 1}_PAN`, file: partner.panFile });
                if (partner.aadhaarFile) uploadedDocuments.push({ type: `Partner_${index + 1}_Aadhaar`, file: partner.aadhaarFile });
            });
            if (businessAddressProof) uploadedDocuments.push({ type: 'Business_Address_Proof', file: businessAddressProof });
            if (additionalDocument) uploadedDocuments.push({ type: 'Additional_Document', file: additionalDocument });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadedDocuments.map(async item => ({
                type: item.type,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const deedHtml = generateDeedHtml();
            const deedDoc: ProfileDocument = {
                type: 'Partnership_Deed_Draft',
                fileName: `${sanitizeFileName(firmData.firmName)}_Partnership_Deed_Draft.doc`,
                uploadedAt: new Date().toISOString(),
                fileData: makeDataUrl(deedHtml),
            };

            const extractedData = {
                ...firmData,
                partnerCount,
                partners: partners.map(partner => ({
                    fullName: partner.fullName,
                    parentName: partner.parentName,
                    residentialAddress: partner.residentialAddress,
                    profitShare: partner.profitShare,
                    capitalContribution: partner.capitalContribution,
                })),
                profitTotal,
                nextStep: 'Take the generated partnership deed draft to an advocate, print on applicable stamp paper, sign with all partners and witnesses, and get it notarized.',
            };

            const serviceName = 'Partnership Registration';
            const newProfile = processServiceApplication(client.id, null, serviceName, extractedData, [...profileDocuments, deedDoc]);
            const submissionId = Date.now();
            const existingSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');

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
                outputDocuments: [deedDoc],
                status: 'Pending Notarization',
                submittedAt: new Date().toLocaleString(),
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setGeneratedDeed({ fileName: deedDoc.fileName, fileData: deedDoc.fileData || '' });
            setStep(3);
        } catch (err: any) {
            console.error('Partnership deed generation failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to generate partnership deed.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading partnership workflow...</div>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <div className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Draft generated</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Partnership deed is ready</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The deed draft for M/s {firmData.firmName} has been generated and attached to this application.
                            </p>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.85fr]">
                            <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <h2 className="text-xl font-black text-slate-950">Download draft</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Download the system-generated deed, review all details, then take it to an advocate for final legal review and notarization.
                                </p>
                                <button
                                    onClick={() => generatedDeed && downloadFile(generatedDeed.fileName, generatedDeed.fileData)}
                                    className="blue-glow-button mt-5"
                                >
                                    Download Partnership Deed
                                </button>
                            </div>

                            <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-amber-700">Next step required</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Advocate and notarization</h2>
                                <ol className="mt-4 space-y-3 text-sm font-bold leading-6 text-slate-700">
                                    <li>1. Review the draft with all partners.</li>
                                    <li>2. Take it to an advocate for final legal review.</li>
                                    <li>3. Print on applicable stamp paper as per state rules.</li>
                                    <li>4. Sign with all partners and two witnesses.</li>
                                    <li>5. Get the deed notarized before using it for PAN, GST, bank account or registration work.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="soft-button bg-white text-slate-900">
                                Back to Dashboard
                            </button>
                            <button onClick={() => setStep(1)} className="soft-button bg-white text-slate-900">
                                Edit Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button
                            onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')}
                            className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20"
                        >
                            Back to workspace
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Digital deed workflow</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Partnership Registration</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Capture partner details, upload KYC documents, generate a partnership deed draft, and guide the user to notarization.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">Profit ratio total: {profitTotal || 0}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 bg-white/70 p-5 md:grid-cols-3">
                        {['Firm Setup', 'Partner Documents', 'Generate Deed'].map((label, index) => (
                            <div key={label} className={`rounded-3xl border p-3 ${step === index + 1 ? 'border-ease-electric bg-blue-50 shadow-lg shadow-ease-electric/10' : step > index + 1 ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${step > index + 1 ? 'bg-ease-green text-white' : step === index + 1 ? 'bg-ease-blue text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}</span>
                                    <p className="text-sm font-black text-slate-900">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <main className="space-y-6">
                        {step === 1 && (
                            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 md:p-6">
                                <div className="mb-5">
                                    <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Firm setup</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-950">Partnership deed inputs</h2>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Number of partners</span>
                                        <input type="number" min={MIN_PARTNERS} max={MAX_PARTNERS} value={partnerCount} onChange={(event) => updatePartnerCount(Number(event.target.value))} className="input" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Firm name</span>
                                        <input value={firmData.firmName} onChange={(event) => updateFirmField('firmName', event.target.value)} className="input" placeholder="M/s Aashray & Co." />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Deed date</span>
                                        <input type="date" value={firmData.deedDate} onChange={(event) => updateFirmField('deedDate', event.target.value)} className="input" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Place of execution</span>
                                        <input value={firmData.deedPlace} onChange={(event) => updateFirmField('deedPlace', event.target.value)} className="input" placeholder="Pune, Maharashtra" />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Business activity</span>
                                        <textarea value={firmData.businessActivity} onChange={(event) => updateFirmField('businessActivity', event.target.value)} className="input min-h-24" placeholder="Describe the nature of business carried on by the firm." />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Principal place of business</span>
                                        <textarea value={firmData.businessAddress} onChange={(event) => updateFirmField('businessAddress', event.target.value)} className="input min-h-24" placeholder="Complete business address of partnership firm." />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Commencement date</span>
                                        <input type="date" value={firmData.commencementDate} onChange={(event) => updateFirmField('commencementDate', event.target.value)} className="input" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Duration</span>
                                        <select value={firmData.durationType} onChange={(event) => updateFirmField('durationType', event.target.value)} className="input">
                                            <option>At Will</option>
                                            <option>Fixed Period</option>
                                        </select>
                                    </label>
                                    {firmData.durationType === 'Fixed Period' && (
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Fixed period years</span>
                                            <input value={firmData.fixedYears} onChange={(event) => updateFirmField('fixedYears', event.target.value)} className="input" placeholder="5" />
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Bank account operation</span>
                                        <input value={firmData.bankOperation} onChange={(event) => updateFirmField('bankOperation', event.target.value)} className="input" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Interest on capital (%)</span>
                                        <input type="number" value={firmData.interestOnCapital} onChange={(event) => updateFirmField('interestOnCapital', event.target.value)} className="input" />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Partner remuneration clause</span>
                                        <textarea value={firmData.remuneration} onChange={(event) => updateFirmField('remuneration', event.target.value)} className="input min-h-20" />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Additional terms (optional)</span>
                                        <textarea value={firmData.notes} onChange={(event) => updateFirmField('notes', event.target.value)} className="input min-h-20" placeholder="Any special terms to include in the deed draft." />
                                    </label>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => setStep(2)} className="blue-glow-button">Continue to Partner Details</button>
                                </div>
                            </motion.section>
                        )}

                        {step === 2 && (
                            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                                {partners.map((partner, index) => (
                                    <div key={index} className="glass-card p-5 md:p-6">
                                        <div className="mb-5 flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Partner {index + 1}</p>
                                                <h2 className="mt-2 text-2xl font-black text-slate-950">{ordinalLabels[index] || `Partner ${index + 1}`} Partner Details</h2>
                                            </div>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-ease-blue">KYC required</span>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="block">
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Full name</span>
                                                <input value={partner.fullName} onChange={(event) => updatePartnerField(index, 'fullName', event.target.value)} className="input" placeholder="Partner full name" />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Father / Mother name</span>
                                                <input value={partner.parentName} onChange={(event) => updatePartnerField(index, 'parentName', event.target.value)} className="input" placeholder="S/o or D/o details" />
                                            </label>
                                            <label className="block md:col-span-2">
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Residential address</span>
                                                <textarea value={partner.residentialAddress} onChange={(event) => updatePartnerField(index, 'residentialAddress', event.target.value)} className="input min-h-20" placeholder="Complete residential address" />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Profit sharing ratio (%)</span>
                                                <input type="number" value={partner.profitShare} onChange={(event) => updatePartnerField(index, 'profitShare', event.target.value)} className="input" placeholder="50" />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Capital contribution (Rs.)</span>
                                                <input type="number" value={partner.capitalContribution} onChange={(event) => updatePartnerField(index, 'capitalContribution', event.target.value)} className="input" placeholder="50000" />
                                            </label>
                                            <DocumentUploadBox label="PAN Card" description="Upload partner PAN card." file={partner.panFile} onChange={(file) => updatePartnerField(index, 'panFile', file)} />
                                            <DocumentUploadBox label="Aadhaar Card" description="Upload partner Aadhaar card." file={partner.aadhaarFile} onChange={(file) => updatePartnerField(index, 'aadhaarFile', file)} />
                                        </div>
                                    </div>
                                ))}

                                <div className="glass-card p-5 md:p-6">
                                    <div className="mb-5">
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Firm documents</p>
                                        <h2 className="mt-2 text-2xl font-black text-slate-950">Business address proof</h2>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <DocumentUploadBox label="Business Address Proof" description="Rent agreement, electricity bill, NOC, property tax receipt or ownership proof." file={businessAddressProof} onChange={setBusinessAddressProof} />
                                        <DocumentUploadBox label="Additional Document" description="Optional supporting document, if any." file={additionalDocument} onChange={setAdditionalDocument} required={false} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                    <button onClick={() => setStep(1)} className="soft-button bg-white text-slate-900">Back</button>
                                    <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                        {isSubmitting ? <LoaderIcon /> : 'Generate Partnership Deed'}
                                    </button>
                                </div>
                            </motion.section>
                        )}
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Readiness</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Deed generation checklist</h2>
                                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Partners</span><span>{partnerCount}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Profit ratio</span><span className={profitTotal === 100 ? 'text-ease-green' : 'text-orange-700'}>{profitTotal || 0}%</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Business proof</span><span>{businessAddressProof ? 'Uploaded' : 'Pending'}</span></div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 bg-amber-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-amber-700">Important</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                    This system creates a deed draft. The final deed should be reviewed by an advocate, printed on applicable stamp paper, signed by all partners and witnesses, and notarized.
                                </p>
                            </div>

                            {error && (
                                <div className="border-t border-slate-100 p-5">
                                    <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

const indexSeparator = () => '<p class="center muted">AND</p>';

export default PartnershipRegistrationPage;
