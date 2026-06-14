import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { Document, downloadFile, fileToDataURL, useClientManager } from '../hooks/useProfile';
import { DOCUMENT_MAP } from '../data/documentConfig';
import { getEntityLabel } from '../data/entityServiceCatalog';
import { LoaderIcon } from './icons/LoaderIcon';

const VAULT_CATEGORIES = [
    { id: 'PAN', label: 'PAN Card' },
    { id: 'Aadhaar', label: 'Aadhaar Card' },
    { id: 'GSTCertificate', label: 'GST Certificate' },
    { id: 'BankStatement', label: 'Bank Statement' },
    { id: 'BankProof', label: 'Bank Proof / Cancelled Cheque' },
    { id: 'ElectricityBill', label: 'Electricity Bill' },
    { id: 'RentAgreement', label: 'Rent Agreement' },
    { id: 'EmployeeList', label: 'Employee List' },
    { id: 'SalaryRegister', label: 'Salary Sheet / Register' },
    { id: 'SalesInvoices', label: 'Sales Invoices' },
    { id: 'PurchaseInvoices', label: 'Purchase Invoices' },
    { id: 'OtherDocument', label: 'Other Document' },
];

const getDocumentLabel = (type: string) => {
    const documentKey = type.split('_').pop() || type;
    const mapped = DOCUMENT_MAP[documentKey]?.label || VAULT_CATEGORIES.find(category => category.id === documentKey)?.label;
    if (mapped) return mapped;

    return documentKey
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
};

const ClientDocumentVaultPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { user } = useAuth();
    const { getClient, addDocumentsToClient } = useClientManager();
    const clientId = user?.clientId || selectedClientId || '';
    const client = clientId ? getClient(clientId) : null;

    const [selectedCategory, setSelectedCategory] = useState(VAULT_CATEGORIES[0].id);
    const [files, setFiles] = useState<File[]>([]);
    const [query, setQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const storedDocuments = client?.documents || [];
    const filteredDocuments = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return storedDocuments;
        return storedDocuments.filter(doc =>
            doc.fileName.toLowerCase().includes(normalizedQuery) ||
            getDocumentLabel(doc.type).toLowerCase().includes(normalizedQuery)
        );
    }, [query, storedDocuments]);

    const documentGroups = useMemo(() => {
        return filteredDocuments.reduce((groups, doc) => {
            const label = getDocumentLabel(doc.type);
            groups[label] = groups[label] || [];
            groups[label].push(doc);
            return groups;
        }, {} as Record<string, Document[]>);
    }, [filteredDocuments]);

    const handleUpload = async () => {
        if (!client) {
            setError('Client profile is missing. Please go back to dashboard and try again.');
            return;
        }

        if (files.length === 0) {
            setError('Please select at least one document to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        setMessage('');

        try {
            const documents: Document[] = await Promise.all(files.map(async file => ({
                type: selectedCategory,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(file),
            })));

            addDocumentsToClient(client.id, documents);
            setFiles([]);
            setMessage('Documents saved to the client vault. Future services will check here first.');
        } catch (err: any) {
            setError(err?.message || 'Unable to upload documents.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading document vault...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setPage('user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to dashboard
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Document Vault</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Upload once. Reuse everywhere.</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Store PAN, Aadhaar, GST, bank statements and business proofs here. Service workflows will check this vault before asking for the same document again.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current entity</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">{getEntityLabel(client.entityType)} · {storedDocuments.length} stored documents</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Add Documents</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">Save reusable files</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Choose the document type and upload one or more files.</p>

                        <div className="mt-5 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Document type</span>
                                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="input">
                                    {VAULT_CATEGORIES.map(category => (
                                        <option key={category.id} value={category.id}>{category.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[1.4rem] border-2 border-dashed border-blue-100 bg-blue-50/50 p-6 text-center transition hover:border-ease-electric hover:bg-blue-50">
                                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-ease-blue shadow-sm">Select Files</span>
                                <span className="mt-3 text-sm font-bold text-slate-500">PDF, images, Excel, CSV and ZIP files supported</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.zip"
                                    onClick={(event) => { event.currentTarget.value = ''; }}
                                    onChange={(event) => setFiles(event.target.files ? Array.from(event.target.files) : [])}
                                />
                            </label>

                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                                            <span className="truncate font-bold text-slate-700">{file.name}</span>
                                            <button type="button" onClick={() => setFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))} className="ml-3 text-xs font-black text-red-600">Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
                            {message && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}

                            <button onClick={handleUpload} disabled={isUploading} className="blue-glow-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                                {isUploading ? <LoaderIcon /> : 'Save to Document Vault'}
                            </button>
                        </div>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Stored Documents</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">Client document locker</h2>
                            </div>
                            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input md:max-w-xs" placeholder="Search documents..." />
                        </div>

                        {filteredDocuments.length === 0 ? (
                            <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                                <p className="text-lg font-black text-slate-950">No documents stored yet</p>
                                <p className="mt-2 text-sm text-slate-500">Upload documents once and they will appear here for reuse.</p>
                            </div>
                        ) : (
                            <div className="mt-6 space-y-5">
                                {(Object.entries(documentGroups) as Array<[string, Document[]]>).map(([label, docs]) => (
                                    <div key={label} className="rounded-[1.4rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="font-black text-slate-950">{label}</h3>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-ease-blue">{docs.length} file{docs.length === 1 ? '' : 's'}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            {docs.map((doc, index) => (
                                                <button
                                                    key={`${doc.type}-${doc.fileName}-${index}`}
                                                    onClick={() => downloadFile(doc.fileName, doc.fileData)}
                                                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-blue-50"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-slate-800">{doc.fileName}</p>
                                                        <p className="mt-1 text-xs font-bold text-slate-400">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className="ml-3 shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-ease-blue shadow-sm">Download</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default ClientDocumentVaultPage;
