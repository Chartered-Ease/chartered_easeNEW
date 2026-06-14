import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager, Document as ProfileDocument, fileToDataURL } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

// Reusable MultiFileUpload component
interface MultiFileUploadProps {
    docType: string;
    files: File[];
    onFilesChange: (docType: string, files: File[]) => void;
    label: string;
    description: string;
}

const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ docType, files, onFilesChange, label, description }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onFilesChange(docType, [...files, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveFile = (fileToRemove: File) => {
        onFilesChange(docType, files.filter(file => file !== fileToRemove));
    };
    
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesChange(docType, [...files, ...Array.from(e.dataTransfer.files)]);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div>
            <label className="block text-md font-semibold text-gray-800">{label}</label>
            <p className="text-sm text-gray-500 mb-2">{description}</p>
            
            <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-ease-blue bg-ease-blue/10' : 'border-gray-300 bg-white'}`}
                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" onClick={(e) => (e.currentTarget.value = '')} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-ease-blue font-semibold">Click to upload</button>
                <p className="text-xs text-gray-500 mt-1">or drag and drop files here</p>
            </div>

            {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border text-sm">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <FileIcon />
                                <span className="font-medium text-gray-700 truncate" title={file.name}>{file.name}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile(file)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-2" aria-label={`Remove ${file.name}`}><TrashIcon /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const ProjectReportPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [formData, setFormData] = useState({ loanAmount: '', loanPurpose: '' });
    const [stagedFiles, setStagedFiles] = useState<Record<string, File[]>>({
        shopAct: [],
        pan: [],
        additional: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!client) {
            setPage('client-list');
        }
    }, [client, setPage]);

    const handleFilesChange = useCallback((docType: string, newFiles: File[]) => {
        setStagedFiles(prev => ({ ...prev, [docType]: newFiles }));
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (stagedFiles.shopAct.length === 0 || stagedFiles.pan.length === 0) {
            setError('Please upload Shop Act License and PAN Card.');
            return;
        }
        if (!formData.loanAmount || !formData.loanPurpose.trim()) {
            setError('Please provide the loan amount and purpose.');
            return;
        }
        if (!client) {
            setError("Client context is missing. Please go back and select the client again.");
            return;
        }

        setIsSubmitting(true);
        
        const allFiles: { docType: string, file: File }[] = [];
        for (const docType of Object.keys(stagedFiles)) {
            const files = stagedFiles[docType];
            for (const file of files) {
                allFiles.push({ docType, file });
            }
        }
        
        try {
             const newProfileDocuments: ProfileDocument[] = await Promise.all(allFiles.map(async f => {
                const dataUrl = await fileToDataURL(f.file);
                return {
                    type: f.docType,
                    fileName: f.file.name,
                    uploadedAt: new Date().toISOString(),
                    fileData: dataUrl
                };
            }));

            const extractedData = { ...formData };
        
            await new Promise(res => setTimeout(res, 1500)); // Simulate processing
            const serviceName = "Project Report for Loan";
            const newProfile = processServiceApplication(client.id, null, serviceName, extractedData, newProfileDocuments);

            const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");
            existingSubmissions.push({
                id: Date.now(),
                service: serviceName,
                clientName: client.name,
                clientId: client.id,
                profileName: newProfile.name,
                profileId: newProfile.id,
                mobile: client.mobileNumber,
                entityType: client.entityType,
                extractedData: newProfile.extractedData,
                documents: newProfile.documents,
                status: "Pending",
                submittedAt: new Date().toLocaleString(),
            });
            localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));

            setIsSuccess(true);
            setTimeout(() => setPage('agent-dashboard'), 4000);

        } catch (err: any) {
            console.error("Error during submission:", err);
            setError(`An error occurred: ${err.message || 'Please check the console.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) return <div className="p-8 text-center">Loading client data...</div>;

    if (isSuccess) {
        return (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
                <svg className="w-16 h-16 text-ease-green mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <h2 className="text-2xl font-bold text-gray-800">Project report documents submitted successfully.</h2>
               <p className="mt-2 text-gray-600 max-w-lg">The task has been created and our team will begin working on it shortly.</p>
               <p className="mt-2 text-sm text-gray-500">Redirecting you to the agent dashboard...</p>
           </div>
       );
    }

    return (
        <div className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-3xl">
                <button onClick={() => setPage('services')} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                    <span className="mr-2">&larr;</span>Back to Services
                </button>
                <h1 className="text-3xl font-bold text-center text-gray-800">Project Report for Loan</h1>
                <p className="text-center text-gray-600 mt-2 mb-8">Provide the following documents for <span className="font-semibold">{client.name}</span>.</p>
                
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
                    
                    <MultiFileUpload docType="shopAct" files={stagedFiles.shopAct} onFilesChange={handleFilesChange} label="A) Shop Act License (mandatory)" description="Upload the Shop and Establishment License." />
                    
                    <MultiFileUpload docType="pan" files={stagedFiles.pan} onFilesChange={handleFilesChange} label="B) PAN Card (mandatory)" description="Upload the business PAN card." />

                    <div>
                        <label htmlFor="loanAmount" className="block text-md font-semibold text-gray-800">C) Amount of Loan (mandatory)</label>
                        <input
                            type="number"
                            id="loanAmount"
                            name="loanAmount"
                            value={formData.loanAmount}
                            onChange={handleFormChange}
                            placeholder="e.g., 500000"
                            className="input w-full mt-1"
                        />
                    </div>

                    <div>
                        <label htmlFor="loanPurpose" className="block text-md font-semibold text-gray-800">D) Purpose of Loan (mandatory)</label>
                        <textarea
                            id="loanPurpose"
                            name="loanPurpose"
                            value={formData.loanPurpose}
                            onChange={handleFormChange}
                            rows={3}
                            placeholder="e.g., To purchase new machinery for the factory."
                            className="input w-full mt-1"
                        ></textarea>
                    </div>

                    <MultiFileUpload docType="additional" files={stagedFiles.additional} onFilesChange={handleFilesChange} label="E) Additional Documents (optional)" description="Upload any other supporting documents." />

                    {error && <p className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-md">{error}</p>}

                    <div className="pt-6 border-t">
                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-ease-green hover:bg-ease-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-green disabled:bg-ease-green/50 disabled:cursor-not-allowed">
                            {isSubmitting ? <LoaderIcon /> : 'Submit for Project Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectReportPage;