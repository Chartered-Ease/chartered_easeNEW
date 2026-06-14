import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

type FileBucket = 'bankStatements' | 'salesInvoices' | 'purchaseInvoices' | 'salaryDetails' | 'expenseBills' | 'otherDocuments';

interface SubmittedAccountingCase {
    referenceId: string;
    submittedAt: string;
    uploadedCount: number;
}

const fileBucketOrder: FileBucket[] = [
    'bankStatements',
    'salesInvoices',
    'purchaseInvoices',
    'salaryDetails',
    'expenseBills',
    'otherDocuments',
];

const fileBucketMeta: Record<FileBucket, { label: string; description: string; required?: boolean; hint: string }> = {
    bankStatements: {
        label: 'Bank Statements',
        description: 'Upload all bank statements for the selected accounting period.',
        hint: 'PDF, Excel or CSV files accepted',
        required: true,
    },
    salesInvoices: {
        label: 'Sales Invoices',
        description: 'Upload sales invoices, sales register, receipts or billing exports.',
        hint: 'Multiple invoice files or one ZIP/register',
        required: true,
    },
    purchaseInvoices: {
        label: 'Purchase Invoices',
        description: 'Upload purchase bills, vendor invoices and expense invoices.',
        hint: 'Vendor-wise bills or monthly register',
        required: true,
    },
    salaryDetails: {
        label: 'Salary Details',
        description: 'Upload salary register, payroll report, employee payout sheet or PF/ESIC data.',
        hint: 'Needed only if salary/payroll exists',
    },
    expenseBills: {
        label: 'Expense Bills',
        description: 'Upload rent, electricity, internet, travel and other operating expense bills.',
        hint: 'Optional but improves review speed',
    },
    otherDocuments: {
        label: 'Other Documents',
        description: 'Upload loan statements, GST reports, fixed asset bills or supporting ledgers.',
        hint: 'Any extra supporting documents',
    },
};

const createEmptyFiles = (): Record<FileBucket, File[]> => ({
    bankStatements: [],
    salesInvoices: [],
    purchaseInvoices: [],
    salaryDetails: [],
    expenseBills: [],
    otherDocuments: [],
});

const FileListUpload: React.FC<{
    bucket: FileBucket;
    files: File[];
    onChange: (bucket: FileBucket, files: File[]) => void;
}> = ({ bucket, files, onChange }) => {
    const meta = fileBucketMeta[bucket];

    const handleAdd = (fileList: FileList | null) => {
        if (!fileList) return;
        onChange(bucket, [...files, ...Array.from(fileList)]);
    };

    const removeFile = (index: number) => {
        onChange(bucket, files.filter((_, fileIndex) => fileIndex !== index));
    };

    return (
        <motion.div
            whileHover={{ y: -3 }}
            className={`rounded-[1.35rem] border p-4 shadow-sm transition ${
                files.length > 0 ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-100 bg-white'
            }`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">
                            {meta.label} {meta.required && <span className="text-red-500">*</span>}
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                            files.length > 0 ? 'bg-emerald-100 text-emerald-700' : meta.required ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {files.length > 0 ? `${files.length} uploaded` : meta.required ? 'required' : 'optional'}
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{meta.description}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">{meta.hint}</p>
                </div>

                <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-ease-blue px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                    Add Files
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.zip"
                        onChange={(event) => handleAdd(event.target.files)}
                        onClick={(event) => { event.currentTarget.value = ''; }}
                    />
                </label>
            </div>

            {files.length > 0 && (
                <div className="mt-4 grid gap-2">
                    {files.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm">
                            <span className="truncate font-bold text-slate-700">{file.name}</span>
                            <button type="button" onClick={() => removeFile(index)} className="ml-3 shrink-0 rounded-full px-2 py-1 text-xs font-black text-red-600 transition hover:bg-red-50">
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const AccountingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [period, setPeriod] = useState({ from: '', to: '' });
    const [files, setFiles] = useState<Record<FileBucket, File[]>>(() => createEmptyFiles());
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submittedCase, setSubmittedCase] = useState<SubmittedAccountingCase | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    const uploadedCount = useMemo(
        () => fileBucketOrder.reduce((count, bucket) => count + files[bucket].length, 0),
        [files]
    );

    const requiredBuckets = fileBucketOrder.filter(bucket => fileBucketMeta[bucket].required);
    const completedRequired = requiredBuckets.filter(bucket => files[bucket].length > 0).length;
    const requiredReady = completedRequired === requiredBuckets.length;
    const readiness = Math.round((completedRequired / requiredBuckets.length) * 100);

    const updateFiles = (bucket: FileBucket, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [bucket]: nextFiles }));
    };

    const validate = () => {
        if (!period.from || !period.to) return 'Please select the accounting period.';
        if (new Date(period.from) > new Date(period.to)) return 'Period start date cannot be after end date.';
        if (files.bankStatements.length === 0) return 'Please upload at least one bank statement.';
        if (files.salesInvoices.length === 0) return 'Please upload sales invoices or a sales register.';
        if (files.purchaseInvoices.length === 0) return 'Please upload purchase invoices or a purchase register.';
        return '';
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!client) {
            setError('Client context is missing. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const uploadedFiles: Array<{ type: FileBucket; file: File }> = [];
            fileBucketOrder.forEach(bucket => {
                files[bucket].forEach(file => uploadedFiles.push({ type: bucket, file }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadedFiles.map(async item => ({
                type: item.type,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                workflow: 'Accounting document review',
                period,
                notes,
                documentCounts: Object.fromEntries(fileBucketOrder.map(bucket => [bucket, files[bucket].length])),
                backendNextSteps: [
                    'Verify uploaded records',
                    'Prepare ledgers and bank reconciliation',
                    'Review sales, purchases, salary and expense classification',
                    'Prepare Profit and Loss statement',
                    'Prepare Balance Sheet',
                    'Share financials back to the user dashboard',
                ],
                expectedOutputs: ['Profit and Loss Statement', 'Balance Sheet'],
            };

            const serviceName = 'Accounting';
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
                status: 'Under Accounting Review',
                submittedAt,
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmittedCase({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
                uploadedCount,
            });
        } catch (err: any) {
            console.error('Accounting submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit accounting documents.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading accounting workflow...</div>
            </div>
        );
    }

    if (submittedCase) {
        const timeline = [
            ['Documents Uploaded', 'Completed'],
            ['Backend Accounting Review', 'In Progress'],
            ['Ledger & Reconciliation', 'Queued'],
            ['P&L and Balance Sheet', 'Queued'],
            ['Financials Shared', 'Queued'],
        ];

        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Accounting submitted</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Your accounting records are under review</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The backend accounting team will verify the records, prepare ledgers, and share the P&L and Balance Sheet from the dashboard once ready.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submittedCase.referenceId}</p>
                            </div>
                            <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Files uploaded</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submittedCase.uploadedCount}</p>
                            </div>
                            <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Submitted</p>
                                <p className="mt-2 text-base font-black text-slate-950">{submittedCase.submittedAt}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {timeline.map(([label, status], index) => (
                                    <div key={label} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                            index === 0 ? 'bg-emerald-100 text-emerald-700' : index === 1 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-950">{label}</p>
                                            <p className="text-sm font-bold text-slate-500">{status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 bg-purple-50 p-6">
                            <p className="text-xs font-black uppercase tracking-wide text-ease-purple">Expected output</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                Profit and Loss Statement and Balance Sheet will be shared after backend ledger preparation, bank reconciliation, and accountant review.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="blue-glow-button">
                                Back to Dashboard
                            </button>
                            <button onClick={() => setSubmittedCase(null)} className="soft-button bg-white text-slate-900">
                                Upload More Documents
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
                        <button
                            onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')}
                            className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20"
                        >
                            Back to workspace
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Accounting workflow</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Upload records for accounting review</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Submit bank statements, invoices and salary details. The accounting team will prepare ledgers, P&L and Balance Sheet after review.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">{uploadedCount} document files staged</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <main className="space-y-6">
                        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 md:p-6">
                            <div className="mb-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Period</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">Select accounting period</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">From</span>
                                    <input type="date" value={period.from} onChange={(event) => setPeriod(prev => ({ ...prev, from: event.target.value }))} className="input" />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">To</span>
                                    <input type="date" value={period.to} onChange={(event) => setPeriod(prev => ({ ...prev, to: event.target.value }))} className="input" />
                                </label>
                            </div>
                        </motion.section>

                        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 md:p-6">
                            <div className="mb-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Documents</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">Upload accounting records</h2>
                                <p className="mt-1 text-sm text-slate-500">Multiple files are allowed in every section.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {fileBucketOrder.map(bucket => (
                                    <FileListUpload key={bucket} bucket={bucket} files={files[bucket]} onChange={updateFiles} />
                                ))}
                            </div>
                        </motion.section>

                        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 md:p-6">
                            <div className="mb-4">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Handoff notes</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">Anything the accountant should know?</h2>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                className="input min-h-[130px]"
                                placeholder="Example: sales register is from Zoho, April bank statement is pending, cash sales are included separately..."
                            />
                        </motion.section>

                        <div className="flex justify-end">
                            <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                {isSubmitting ? <LoaderIcon /> : 'Submit for Accounting Review'}
                            </button>
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Accounting cockpit</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Upload readiness</h2>
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Required records</span>
                                        <span>{readiness}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-ease-electric transition-all duration-500" style={{ width: `${readiness}%` }} />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Total files</span><span>{uploadedCount}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>Review</span></div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 bg-purple-50 p-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-wide text-ease-purple">Status after upload</p>
                                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-ease-purple">
                                        Review queue
                                    </span>
                                </div>
                                <div className="mt-5 space-y-4">
                                    {[
                                        ['Documents submitted', requiredReady],
                                        ['Accounting review', false],
                                        ['P&L preparation', false],
                                        ['Balance Sheet preparation', false],
                                        ['Financials shared', false],
                                    ].map(([label, done], index) => (
                                        <div key={String(label)} className="relative flex gap-3">
                                            {index < 4 && <div className="absolute left-[11px] top-6 h-8 w-0.5 bg-purple-100" />}
                                            <div className={`relative z-10 mt-0.5 h-6 w-6 rounded-full border-4 ${
                                                done ? 'border-emerald-100 bg-emerald-500' : index === 1 ? 'border-blue-100 bg-ease-electric' : 'border-slate-100 bg-slate-300'
                                            }`} />
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{label}</p>
                                                <p className="text-xs font-bold text-slate-500">
                                                    {done ? 'Ready' : index === 1 ? 'Starts after submit' : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

export default AccountingPage;
