import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager, Document } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

// --- DOCUMENT TYPE CONFIGURATION ---

const CORE_KYC = ["PAN Card", "Aadhaar Card", "Photograph", "Signature", "Bank Passbook / Cancelled Cheque"];
const ADDRESS_PROOF = ["Electricity Bill", "Rent Agreement", "NOC", "Shop Act License"];
const OTHER_DOCS = ["Loan Documents", "ITR Documents", "Project Report Supporting Documents", "Other Document"];

const ENTITY_DOCS: Record<string, string[]> = {
    proprietorship: ["Shop Act License"],
    partnership: ["Partnership Deed"],
    llp: ["LLP Agreement", "Certificate of Incorporation"],
    private_limited: ["MOA", "AOA", "Certificate of Incorporation", "Board Resolution"],
    huf: ["HUF Declaration"],
    trust: ["Trust Deed", "Registration Certificate", "80G", "12AA"],
    society: ["Society Registration Certificate"],
};


interface StagedFile {
    file: File;
    id: string; // Unique ID for the staged file for easy removal
}

interface DocumentRow {
    id: number;
    docType: string;
    files: StagedFile[];
}

// --- ICONS ---
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


const DocumentUploadPage: React.FC = () => {
    const { selectedClientId, setPage } = useAppContext();
    const { getClient, addDocumentsToClient } = useClientManager();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [draggingRowId, setDraggingRowId] = useState<number | null>(null);

    const client = useMemo(() => selectedClientId ? getClient(selectedClientId) : null, [selectedClientId, getClient]);

    const [docRows, setDocRows] = useState<DocumentRow[]>([
        { id: Date.now(), docType: '', files: [] }
    ]);
    
    // --- DOCUMENT TYPE OPTIONS LOGIC ---
    const availableDocTypes = useMemo(() => {
        /* Fix: Ensure consistent object structure when client is missing */
        if (!client) return { core: [], address: [], entity: [], other: [] };
        const entitySpecificDocs = ENTITY_DOCS[client.entityType] || [];
        return {
            core: CORE_KYC,
            address: ADDRESS_PROOF,
            entity: [...new Set(entitySpecificDocs)], // Ensure unique values
            other: OTHER_DOCS,
        };
    }, [client]);

    // --- ROW & FILE MANAGEMENT ---

    const handleAddRow = () => {
        setDocRows(prev => [...prev, { id: Date.now(), docType: '', files: [] }]);
    };

    const handleRemoveRow = (id: number) => {
        setDocRows(prev => prev.filter(row => row.id !== id));
    };
    
    const handleDocTypeChange = (id: number, type: string) => {
        setDocRows(prev => prev.map(row => row.id === id ? { ...row, docType: type } : row));
        setIsSuccess(false);
        setError('');
    };
    
    const handleFilesAdded = (id: number, addedFiles: FileList | null) => {
        if (!addedFiles) return;
        const newFiles = Array.from(addedFiles).map(file => ({
            file,
            id: `${file.name}-${file.lastModified}-${Math.random()}`
        }));
        setDocRows(prev => prev.map(row => 
            row.id === id ? { ...row, files: [...row.files, ...newFiles] } : row
        ));
        setIsSuccess(false);
    };

    const handleRemoveFile = (rowId: number, fileId: string) => {
        setDocRows(prev => prev.map(row => 
            row.id === rowId ? { ...row, files: row.files.filter(f => f.id !== fileId) } : row
        ));
    };

    // --- DRAG & DROP ---

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, rowId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const row = docRows.find(r => r.id === rowId);
        if (!row || !row.docType) return;
        
        if (e.type === "dragenter" || e.type === "dragover") {
            setDraggingRowId(rowId);
        } else if (e.type === "dragleave") {
            setDraggingRowId(null);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, rowId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingRowId(null);
        const row = docRows.find(r => r.id === rowId);
        if (!row || !row.docType) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(rowId, e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    // --- SUBMISSION LOGIC ---

    const handleSaveAll = async () => {
        setError('');
        if (!client) {
            setError('Client not found.');
            return;
        }

        // Validation
        for (const row of docRows) {
            if (!row.docType) {
                setError('Please select a document type for all rows.');
                return;
            }
            if (row.files.length === 0) {
                setError(`Please upload at least one file for "${row.docType}".`);
                return;
            }
        }
        
        setIsSubmitting(true);
        try {
            const allNewDocuments: Document[] = docRows.flatMap(row => 
                row.files.map(sf => ({
                    type: row.docType,
                    fileName: sf.file.name,
                    uploadedAt: new Date().toISOString()
                }))
            );

            await new Promise(res => setTimeout(res, 1500)); // Simulate upload time
            addDocumentsToClient(client.id, allNewDocuments);

            setIsSuccess(true);
            setDocRows([{ id: Date.now(), docType: '', files: [] }]); // Reset form
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during upload.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!client) {
        return <div className="p-8 text-center">Loading client details...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <button onClick={() => setPage('client-list')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                <span className="mr-2">&larr;</span>Back to Client List
            </button>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800">Multi-Document Upload for {client.name}</h1>
                <p className="text-gray-500 mt-1">Add rows for each document type and upload multiple files at once.</p>
                
                <div className="mt-6 space-y-4">
                    {docRows.map((row, index) => (
                        <div key={row.id} className="p-4 border rounded-lg bg-gray-50/50 relative animate-fade-in">
                            <button 
                                onClick={() => handleRemoveRow(row.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                                title="Remove this document row"
                            >
                                &times;
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Side: Controls */}
                                <div>
                                    <label htmlFor={`doc-type-${row.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Document Type
                                    </label>
                                    <select
                                        id={`doc-type-${row.id}`}
                                        value={row.docType}
                                        onChange={(e) => handleDocTypeChange(row.id, e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="">Select a type...</option>
                                        <optgroup label="-- Core KYC --">{availableDocTypes.core.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                                        <optgroup label="-- Address Proof --">{availableDocTypes.address.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                                        {availableDocTypes.entity.length > 0 && <optgroup label="-- Entity-wise Documents --">{availableDocTypes.entity.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>}
                                        <optgroup label="-- Loan / Tax / Other --">{availableDocTypes.other.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                                    </select>

                                    <div 
                                        onDragEnter={(e) => handleDragEvents(e, row.id)}
                                        onDragOver={(e) => handleDragEvents(e, row.id)}
                                        onDragLeave={(e) => handleDragEvents(e, row.id)}
                                        onDrop={(e) => handleDrop(e, row.id)}
                                        className={`mt-3 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                            !row.docType ? 'bg-gray-100 border-gray-200 cursor-not-allowed' :
                                            draggingRowId === row.id ? 'border-ease-blue bg-ease-blue/10' : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        <label htmlFor={`file-upload-${row.id}`} className={!row.docType ? 'cursor-not-allowed' : 'cursor-pointer'}>
                                            <p className="font-semibold text-gray-600">Drag & drop files here</p>
                                            <p className="text-xs text-gray-500">or click to browse</p>
                                        </label>
                                        <input 
                                            id={`file-upload-${row.id}`}
                                            type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png" 
                                            onChange={(e) => handleFilesAdded(row.id, e.target.files)}
                                            disabled={!row.docType}
                                            onClick={(e) => (e.currentTarget.value = '')}
                                        />
                                    </div>
                                </div>
                                
                                {/* Right Side: File Previews */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-700">
                                        Uploaded Files ({row.files.length})
                                    </h3>
                                    {row.files.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">No files added yet.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {row.files.map(sf => (
                                                <div key={sf.id} className="flex items-center justify-between p-2 bg-white rounded-md border text-sm">
                                                    <div className="flex items-center space-x-2 overflow-hidden">
                                                        <FileIcon />
                                                        <span className="font-medium text-gray-700 truncate" title={sf.file.name}>{sf.file.name}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveFile(row.id, sf.id)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-2" title="Remove file">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <button 
                        onClick={handleAddRow}
                        className="w-full text-sm text-ease-blue font-semibold border-2 border-dashed border-gray-300 rounded-lg py-3 hover:bg-ease-blue/5 hover:border-ease-blue transition-all"
                    >
                        + Add Another Document Type
                    </button>
                </div>
                
                {error && <p className="text-sm text-red-600 mt-4 text-center p-2 bg-red-50 rounded-md">{error}</p>}
                {isSuccess && <p className="text-sm text-green-600 mt-4 text-center font-semibold">All documents uploaded successfully!</p>}

                <div className="mt-6 border-t pt-6">
                    <button
                        onClick={handleSaveAll}
                        disabled={isSubmitting || docRows.length === 0 || docRows.some(r => r.files.length === 0)}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-ease-green hover:bg-ease-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-green disabled:bg-ease-green/50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <LoaderIcon /> : 'Save All Documents'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadPage;