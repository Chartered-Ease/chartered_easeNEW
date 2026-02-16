
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useClientManager, Document as ProfileDocument, fileToDataURL } from '../../hooks/useProfile';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { serviceDocuments, DOCUMENT_MAP } from '../../data/documentConfig';
import { LoaderIcon } from '../icons/LoaderIcon';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ease-green" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

interface Props {
    serviceId: string;
    serviceName: string;
    numberOfIndividuals?: number;
    additionalData?: Record<string, any>;
    entityType?: string;
}

const ServiceDocumentUpload: React.FC<Props> = ({ serviceId, serviceName, numberOfIndividuals = 0, additionalData = {}, entityType: propEntityType }) => {
    const { selectedClientId, selectedProfileId, setPage } = useAppContext();
    const { getClient, processServiceApplication, isLoading: isClientManagerLoading } = useClientManager();
    const { user } = useAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [files, setFiles] = useState<Record<string, File>>({});

    // State for Existing DIN Logic (Company Incorporation)
    const [directorDinStatus, setDirectorDinStatus] = useState<Record<number, boolean>>({});
    const [directorDinValues, setDirectorDinValues] = useState<Record<number, string>>({});

    const client = selectedClientId ? getClient(selectedClientId) : null;
    const entityType = propEntityType || client?.entityType;
    const profile = client && selectedProfileId ? client.profiles.find(p => p.id === selectedProfileId) : null;

    useEffect(() => {
        if (!selectedClientId) {
            setPage('client-list');
        }
    }, [selectedClientId, setPage]);

    const documentConfig = useMemo(() => {
        const serviceConfig = serviceDocuments[serviceId];
        if (entityType && serviceConfig[entityType]) {
            return serviceConfig[entityType];
        }
        return serviceConfig;
    }, [serviceId, entityType]);

    const uploadedDocTypes = useMemo(() => 
        new Set(profile?.documents.map(d => d.type)),
        [profile]
    );

    const canSubmit = useMemo(() => {
        if (!documentConfig) return false;

        const checkRequirements = (reqs: string[], isGroup: boolean = false) => {
            const filteredReqs = reqs.filter(docType => !uploadedDocTypes.has(docType));
            return filteredReqs.every(docType => !!files[docType]);
        };

        if (documentConfig.groups) {
            return documentConfig.groups.every((group: any) => {
                let groupOk = true;
                if (group.required) {
                    groupOk = groupOk && checkRequirements(group.required, true);
                }
                if (group.individual && numberOfIndividuals > 0) {
                    for (let i = 1; i <= numberOfIndividuals; i++) {
                        // Logic for Existing DIN (Company Incorporation)
                        if (serviceId === 'company-incorporation' && directorDinStatus[i]) {
                            // If using existing DIN, DIN value is mandatory
                            if (!directorDinValues[i] || directorDinValues[i].trim() === '') {
                                groupOk = false;
                                break;
                            }
                            // Files are NOT required if DIN is provided
                            continue;
                        }

                        for (const docId of group.individual.documents) {
                            const compositeKey = `${group.individual.label}_${i}_${docId}`;
                            if (!files[compositeKey]) {
                                groupOk = false;
                                break;
                            }
                        }
                        if (!groupOk) break;
                    }
                }
                return groupOk;
            });
        }
        
        const commonDocsMet = checkRequirements(documentConfig.required || []);
        if (!commonDocsMet) return false;
        
        if (documentConfig.individual && numberOfIndividuals > 0) {
            for (let i = 1; i <= numberOfIndividuals; i++) {
                for (const docId of documentConfig.individual.documents) {
                    const compositeKey = `${documentConfig.individual.label}_${i}_${docId}`;
                    if (!files[compositeKey]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }, [files, documentConfig, numberOfIndividuals, uploadedDocTypes, directorDinStatus, directorDinValues, serviceId]);

    const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [docType]: e.target.files![0] }));
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit || !selectedClientId || !client) return;
        setIsSubmitting(true);
        setError('');

        if (!process.env.API_KEY) {
            setError("Configuration Error: API Key is missing.");
            setIsSubmitting(false);
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let combinedExtractedData: Record<string, any> = { ...additionalData };
        
        // Add DIN Info to extracted data
        if (serviceId === 'company-incorporation') {
             for (let i = 1; i <= numberOfIndividuals; i++) {
                 if (directorDinStatus[i]) {
                     combinedExtractedData[`Director ${i} DIN`] = directorDinValues[i];
                     combinedExtractedData[`Director ${i} Status`] = 'Existing DIN Provided';
                 } else {
                     combinedExtractedData[`Director ${i} Status`] = 'New DIN Required';
                 }
             }
        }

        const newProfileDocuments: ProfileDocument[] = [];

        try {
            for (const compositeKey in files) {
                const file = files[compositeKey];
                const keyParts = compositeKey.split('_');
                const docType = keyParts[keyParts.length - 1]; 
                const docInfo = DOCUMENT_MAP[docType];

                if (!docInfo) continue;
                
                // Convert file to Data URL for storage and download
                const dataUrl = await fileToDataURL(file);

                newProfileDocuments.push({
                    type: compositeKey, 
                    fileName: file.name,
                    uploadedAt: new Date().toISOString(),
                    fileData: dataUrl // Store binary data as Data URL
                });

                if (docInfo.prompt.includes("No data extraction needed")) continue;

                // Get raw base64 for Gemini (remove data:... prefix)
                const base64Data = dataUrl.split(',')[1];

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: {
                        parts: [
                            { text: docInfo.prompt },
                            { inlineData: { mimeType: file.type, data: base64Data } }
                        ]
                    },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: docInfo.schema,
                    }
                });

                const jsonStr = response.text.trim();
                const extracted = JSON.parse(jsonStr);
                combinedExtractedData = { ...combinedExtractedData, ...extracted };
            }

            const updatedProfile = processServiceApplication(selectedClientId, selectedProfileId, serviceName, combinedExtractedData, newProfileDocuments);
            
            const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");
            const newSubmission = {
                id: Date.now(),
                service: serviceName,
                clientName: client?.name || 'N/A',
                clientId: selectedClientId,
                profileName: updatedProfile.name,
                profileId: updatedProfile.id,
                mobile: user?.mobileNumber,
                entityType: client.entityType,
                extractedData: updatedProfile.extractedData,
                documents: updatedProfile.documents,
                status: "Pending",
                submittedAt: new Date().toLocaleString(),
            };
            existingSubmissions.push(newSubmission);
            localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));

            setIsSubmitted(true);
            setTimeout(() => setPage('client-dashboard'), 4000);

        } catch (err: any) {
            console.error("Error during document processing:", err);
            setError(`An error occurred: ${err.message || 'Please check the console for details.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderDocumentItem = (docType: string, isRequired: boolean, labelOverride?: string) => {
        const docInfo = DOCUMENT_MAP[docType.split('_').pop()!];
        if (!docInfo) {
            console.warn(`No document info found for type: ${docType}`);
            return null;
        }
        const isUploaded = uploadedDocTypes.has(docType);
        const file = files[docType];

        return (
            <div key={docType} className={`p-4 rounded-lg flex items-center justify-between ${isUploaded ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                    {isUploaded ? <CheckCircleIcon /> : <DocumentIcon />}
                    <div>
                        <p className="font-semibold text-gray-800">
                            {labelOverride || docInfo.label} {!isRequired && <span className="text-xs font-normal text-gray-500">(Optional)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{docInfo.description}</p>
                    </div>
                </div>
                <div>
                    {isUploaded ? (
                        <span className="text-sm font-medium text-ease-green">Completed</span>
                    ) : file ? (
                         <div className="text-right">
                            <p className="text-sm font-medium text-ease-blue truncate max-w-[120px]">{file.name}</p>
                            <button onClick={() => setFiles(p => { const newP = {...p}; delete newP[docType]; return newP;})} className="text-xs text-red-500 hover:underline">Remove</button>
                         </div>
                    ) : (
                        <label className="cursor-pointer bg-ease-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-ease-blue/90 transition-colors">
                            Upload
                            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(docType, e)} />
                        </label>
                    )}
                </div>
            </div>
        );
    };
    
    const renderDocumentList = (docTypes: string[], isRequired: boolean) => (
        <div className="space-y-3">
            {docTypes.map((docType: string) => renderDocumentItem(docType, isRequired))}
        </div>
    );


    if (isClientManagerLoading || !documentConfig) return <div>Loading...</div>;
    
    if (!client) {
         return null;
    }

    if (isSubmitted) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
                 <svg className="w-16 h-16 text-ease-green mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold text-gray-800">Application Submitted Successfully!</h2>
                <p className="mt-2 text-gray-600 max-w-lg">The profile for {client.name} has been created/updated. Our AI has extracted the data.</p>
                <p className="mt-2 text-sm text-gray-500">Redirecting you to the client dashboard...</p>
            </div>
        )
    }

    return (
        <div className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-3xl">
                <h1 className="text-3xl font-bold text-center text-gray-800">{serviceName}</h1>
                <p className="text-center text-gray-600 mt-2 mb-8">Upload documents for <span className="font-semibold">{client.name}</span>. We'll handle the rest.</p>

                <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in space-y-6">
                    {documentConfig.groups ? (
                        documentConfig.groups.map((group: any, index: number) => (
                            <div key={index}>
                                <h3 className="font-semibold text-lg text-gray-800 mb-2 pt-4 border-t first:border-t-0 first:pt-0">{group.title}</h3>
                                {group.required && renderDocumentList(group.required, true)}
                                {group.optional && renderDocumentList(group.optional, false)}
                                {group.individual && numberOfIndividuals > 0 && Array.from({ length: numberOfIndividuals }, (_, i) => i + 1).map(num => (
                                    <div key={num} className="mt-4">
                                        <h4 className="font-semibold text-md text-gray-700 mb-2 pt-2 border-t">
                                            Details for {group.individual.label} #{num}
                                        </h4>
                                        
                                        {/* Existing DIN Checkbox for Company Incorporation */}
                                        {serviceId === 'company-incorporation' && (
                                            <div className="mb-4 bg-blue-50 p-4 rounded-md border border-blue-100">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!directorDinStatus[num]} 
                                                        onChange={(e) => setDirectorDinStatus(prev => ({...prev, [num]: e.target.checked}))}
                                                        className="form-checkbox h-4 w-4 text-ease-blue rounded focus:ring-ease-blue"
                                                    />
                                                    <span className="text-sm text-gray-800 font-medium">Director already has an existing DIN</span>
                                                </label>
                                                
                                                {directorDinStatus[num] && (
                                                    <div className="mt-3 ml-6 animate-fade-in">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                            DIN Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={directorDinValues[num] || ''} 
                                                            onChange={(e) => setDirectorDinValues(prev => ({...prev, [num]: e.target.value.replace(/\D/g,'').slice(0,8)}))}
                                                            placeholder="Enter 8-digit DIN"
                                                            className="input w-full md:w-64 text-sm py-2 border-blue-300 focus:ring-blue-200"
                                                            maxLength={8}
                                                        />
                                                        <p className="text-xs text-blue-600 mt-2 flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                            Basic KYC documents are not required for directors with an existing DIN.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Conditionally Render Document Uploads */}
                                        {(!directorDinStatus[num] || serviceId !== 'company-incorporation') && (
                                            <div className="space-y-3">
                                                {group.individual.documents.map((docId: string) => {
                                                    const compositeKey = `${group.individual.label}_${num}_${docId}`;
                                                    const docInfo = DOCUMENT_MAP[docId];
                                                    const label = `${docInfo.label}`;
                                                    return renderDocumentItem(compositeKey, true, label);
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <>
                            {documentConfig.required && (
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800 mb-2">Required Documents</h3>
                                    {renderDocumentList(documentConfig.required, true)}
                                </div>
                            )}

                            {documentConfig.individual && numberOfIndividuals > 0 && Array.from({ length: numberOfIndividuals }, (_, i) => i + 1).map(num => (
                                <div key={num}>
                                    <h3 className="font-semibold text-lg text-gray-800 mb-2 pt-4 border-t">
                                        Documents for {documentConfig.individual.label} #{num}
                                    </h3>
                                    <div className="space-y-3">
                                        {documentConfig.individual.documents.map((docId: string) => {
                                            const compositeKey = `${documentConfig.individual.label}_${num}_${docId}`;
                                            const docInfo = DOCUMENT_MAP[docId];
                                            const label = `${docInfo.label}`;
                                            return renderDocumentItem(compositeKey, true, label);
                                        })}
                                    </div>
                                </div>
                            ))}
                            
                            {documentConfig.optional && documentConfig.optional.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800 mb-2 pt-4 border-t">Optional Documents</h3>
                                    {renderDocumentList(documentConfig.optional, false)}
                                </div>
                            )}
                        </>
                    )}
                    
                    {error && <p className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-md">{error}</p>}

                    <div className="pt-6 border-t">
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-ease-green hover:bg-ease-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-green disabled:bg-ease-green/50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? <LoaderIcon /> : 'Analyze & Submit Documents'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDocumentUpload;
