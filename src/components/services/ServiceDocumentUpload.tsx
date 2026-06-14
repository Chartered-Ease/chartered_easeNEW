
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { useClientManager, Document as ProfileDocument, fileToDataURL } from '../../hooks/useProfile';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { serviceDocuments, DOCUMENT_MAP } from '../../data/documentConfig';
import { LoaderIcon } from '../icons/LoaderIcon';

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ease-green" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M16 8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SparkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3zM19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6L19 15z" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.5-2.9 8.6-7 10-4.1-1.4-7-5.5-7-10V6l7-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
);

const isUsableGeminiKey = (key?: string) => Boolean(key && !/PLACEHOLDER|your_/i.test(key));
const TYPED_CREDENTIAL_DOCUMENTS = new Set(['PTRCLoginCredentials']);

const uploadSteps = [
    'Service',
    'Documents',
    'AI Check',
    'Review',
    'Tracking',
];

const getBadgeClass = (status: string) => {
    if (status === 'Verified') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Uploaded' || status === 'Secured') return 'bg-blue-50 text-ease-blue border-blue-100';
    if (status === 'Needs Attention') return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${getBadgeClass(status)}`}>
        {status}
    </span>
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
    const { isAgentAuthenticated } = useAgentAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [files, setFiles] = useState<Record<string, File>>({});
    const [typedCredentials, setTypedCredentials] = useState<Record<string, { userName: string; password: string }>>({});

    // State for Existing DIN Logic (Company Incorporation)
    const [directorDinStatus, setDirectorDinStatus] = useState<Record<number, boolean>>({});
    const [directorDinValues, setDirectorDinValues] = useState<Record<number, string>>({});
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

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

    const uploadedDocTypes = useMemo(() => {
        const reusableClientDocs = client?.documents?.map(d => d.type) || [];
        const profileDocs = profile?.documents?.map(d => d.type) || [];
        return new Set([...reusableClientDocs, ...profileDocs]);
    }, [client, profile]);

    const isTypedCredentialComplete = (docType: string) => {
        const documentKey = docType.split('_').pop() || docType;
        if (!TYPED_CREDENTIAL_DOCUMENTS.has(documentKey)) return false;

        const credentials = typedCredentials[docType];
        return Boolean(credentials?.userName.trim() && credentials?.password.trim());
    };

    const canSubmit = useMemo(() => {
        if (!documentConfig) return false;

        const checkRequirements = (reqs: string[], isGroup: boolean = false) => {
            const filteredReqs = reqs.filter(docType => !uploadedDocTypes.has(docType));
            return filteredReqs.every(docType => isTypedCredentialComplete(docType) || !!files[docType]);
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
    }, [files, typedCredentials, documentConfig, numberOfIndividuals, uploadedDocTypes, directorDinStatus, directorDinValues, serviceId]);

    const documentStats = useMemo(() => {
        if (!documentConfig) return { total: 0, required: 0, completed: 0, requiredCompleted: 0, completion: 0 };

        const entries: Array<{ key: string; required: boolean }> = [];

        const pushDocs = (docTypes: string[] = [], required: boolean) => {
            docTypes.forEach(docType => entries.push({ key: docType, required }));
        };

        const pushIndividualDocs = (label: string, docIds: string[]) => {
            if (!numberOfIndividuals) return;

            for (let i = 1; i <= numberOfIndividuals; i++) {
                if (serviceId === 'company-incorporation' && directorDinStatus[i]) continue;
                docIds.forEach(docId => entries.push({ key: `${label}_${i}_${docId}`, required: true }));
            }
        };

        if (documentConfig.groups) {
            documentConfig.groups.forEach((group: any) => {
                pushDocs(group.required || [], true);
                pushDocs(group.optional || [], false);
                if (group.individual) pushIndividualDocs(group.individual.label, group.individual.documents);
            });
        } else {
            pushDocs(documentConfig.required || [], true);
            pushDocs(documentConfig.optional || [], false);
            if (documentConfig.individual) pushIndividualDocs(documentConfig.individual.label, documentConfig.individual.documents);
        }

        const completed = entries.filter(entry => uploadedDocTypes.has(entry.key) || Boolean(files[entry.key]) || isTypedCredentialComplete(entry.key)).length;
        const required = entries.filter(entry => entry.required).length;
        const requiredCompleted = entries.filter(entry => entry.required && (uploadedDocTypes.has(entry.key) || Boolean(files[entry.key]) || isTypedCredentialComplete(entry.key))).length;

        return {
            total: entries.length,
            required,
            completed,
            requiredCompleted,
            completion: entries.length ? Math.round((completed / entries.length) * 100) : 0,
        };
    }, [documentConfig, numberOfIndividuals, serviceId, directorDinStatus, uploadedDocTypes, files, typedCredentials]);

    const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [docType]: e.target.files![0] }));
        }
    };

    const getReusableDocumentTypes = () => {
        const docTypes = new Set<string>();
        if (!documentConfig) return docTypes;

        const pushDocs = (docs: string[] = []) => docs.forEach(docType => docTypes.add(docType));

        if (documentConfig.groups) {
            documentConfig.groups.forEach((group: any) => {
                pushDocs(group.required || []);
                pushDocs(group.optional || []);
            });
        } else {
            pushDocs(documentConfig.required || []);
            pushDocs(documentConfig.optional || []);
        }

        return docTypes;
    };

    const handleSubmit = async () => {
        if (!canSubmit || !selectedClientId || !client) return;
        setIsSubmitting(true);
        setError('');
        setWarning('');

        const canUseGemini = isUsableGeminiKey(geminiApiKey);
        const ai = canUseGemini ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
        let combinedExtractedData: Record<string, any> = { ...additionalData };
        let aiExtractionSkipped = !canUseGemini;
        let aiExtractionError = '';
        
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

        (Object.entries(typedCredentials) as Array<[string, { userName: string; password: string }]>).forEach(([docType, credentials]) => {
            if (!credentials.userName.trim() || !credentials.password.trim()) return;

            const documentKey = docType.split('_').pop() || docType;
            const fieldLabel = DOCUMENT_MAP[documentKey]?.label || docType;
            combinedExtractedData[`${fieldLabel} User Name`] = credentials.userName.trim();
            combinedExtractedData[`${fieldLabel} Password`] = credentials.password;
        });

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

                if (docInfo.prompt.includes("No data extraction needed") || !ai) continue;

                // Get raw base64 for Gemini (remove data:... prefix)
                const base64Data = dataUrl.split(',')[1];

                try {
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
                } catch (aiError: any) {
                    aiExtractionSkipped = true;
                    aiExtractionError = aiError?.message || 'AI document extraction failed.';
                    console.error("AI document extraction failed:", aiError);
                    break;
                }
            }

            const reusableDocumentTypes = getReusableDocumentTypes();
            const existingKeys = new Set(newProfileDocuments.map(doc => `${doc.type}::${doc.fileName}`));
            (client.documents || []).forEach(doc => {
                const key = `${doc.type}::${doc.fileName}`;
                if (!reusableDocumentTypes.has(doc.type) || existingKeys.has(key)) return;
                newProfileDocuments.push(doc);
                existingKeys.add(key);
            });

            if (aiExtractionSkipped) {
                combinedExtractedData.aiExtractionStatus = 'Skipped';
                combinedExtractedData.aiExtractionNote = aiExtractionError || 'Gemini API key is missing or invalid. Documents were submitted without AI extraction.';
                setWarning('Documents submitted. AI extraction was skipped because the Gemini API key is missing or invalid.');
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
                aiExtractionStatus: aiExtractionSkipped ? "Skipped" : "Completed",
                submittedAt: new Date().toLocaleString(),
            };
            existingSubmissions.push(newSubmission);
            localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));

            setIsSubmitted(true);
            setTimeout(() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard'), 4000);

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
        const documentKey = docType.split('_').pop() || docType;
        const isTypedCredential = TYPED_CREDENTIAL_DOCUMENTS.has(documentKey);
        const isUploaded = uploadedDocTypes.has(docType);
        const file = files[docType];
        const label = labelOverride || docInfo.label;
        const itemStatus = isUploaded
            ? 'Verified'
            : file
                ? 'Uploaded'
                : isTypedCredentialComplete(docType)
                    ? 'Secured'
                    : isRequired
                        ? 'Needs Attention'
                        : 'Optional';

        if (isTypedCredential) {
            const credentials = typedCredentials[docType] || { userName: '', password: '' };

            return (
                <motion.div
                    key={docType}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3 }}
                    className="rounded-[1.35rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:border-ease-electric/30 hover:shadow-xl"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-ease-purple">
                                <ShieldIcon />
                            </span>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black text-slate-950">
                                        {label} {!isRequired && <span className="text-xs font-bold text-slate-400">(Optional)</span>}
                                    </p>
                                    <StatusBadge status={itemStatus} />
                                </div>
                                <p className="mt-1 text-sm leading-5 text-slate-500">{docInfo.description}</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-ease-purple">Encrypted fields</span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                                User Name {isRequired && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={credentials.userName}
                                onChange={(event) => setTypedCredentials(prev => ({
                                    ...prev,
                                    [docType]: {
                                        userName: event.target.value,
                                        password: prev[docType]?.password || '',
                                    },
                                }))}
                                placeholder="Enter PTRC user name"
                                className="input w-full text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                                Password {isRequired && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(event) => setTypedCredentials(prev => ({
                                    ...prev,
                                    [docType]: {
                                        userName: prev[docType]?.userName || '',
                                        password: event.target.value,
                                    },
                                }))}
                                placeholder="Enter PTRC password"
                                className="input w-full text-sm"
                            />
                        </div>
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div
                key={docType}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className={`group rounded-[1.35rem] border p-4 shadow-sm transition duration-300 hover:border-ease-electric/30 hover:shadow-xl ${isUploaded || file ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isUploaded || file ? 'bg-emerald-100 text-ease-green' : 'bg-blue-50 text-ease-blue'}`}>
                            {isUploaded ? <CheckCircleIcon /> : <DocumentIcon />}
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-slate-950">
                                    {label} {!isRequired && <span className="text-xs font-bold text-slate-400">(Optional)</span>}
                                </p>
                                <StatusBadge status={itemStatus} />
                            </div>
                            <p className="mt-1 text-sm leading-5 text-slate-500">{docInfo.description}</p>
                            {file && (
                                <div className="mt-3 flex max-w-full items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-700">
                                    <span className="truncate">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFiles(p => { const newP = { ...p }; delete newP[docType]; return newP; })}
                                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-black text-red-600 transition hover:bg-red-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end">
                        {isUploaded ? (
                            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-ease-green shadow-sm">Already uploaded</span>
                        ) : file ? (
                            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-ease-blue shadow-sm">Ready for AI scan</span>
                        ) : (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ease-blue px-5 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition duration-300 hover:-translate-y-0.5 hover:bg-ease-electric hover:shadow-ease-electric/30">
                                <UploadIcon />
                                Add File
                                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(docType, e)} />
                            </label>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };
    
    const renderDocumentList = (docTypes: string[], isRequired: boolean) => (
        <div className="space-y-3">
            {docTypes.map((docType: string) => renderDocumentItem(docType, isRequired))}
        </div>
    );


    if (isClientManagerLoading || !documentConfig) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-12">
                <div className="glass-card mx-auto max-w-md p-8 text-center">
                    <LoaderIcon />
                    <p className="mt-4 font-bold text-slate-600">Preparing your document workspace...</p>
                </div>
            </div>
        );
    }
    
    if (!client) {
         return null;
    }

    if (isSubmitted) {
         return (
            <div className="min-h-screen bg-ease-bg px-4 py-10">
                <div className="mx-auto max-w-4xl">
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden text-center">
                        <div className="mesh-surface px-6 py-10 text-white">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-white/15 text-white shadow-2xl">
                                <CheckCircleIcon />
                            </div>
                            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-blue-100">Tracking activated</p>
                            <h2 className="mt-3 font-display text-3xl font-bold">Application submitted successfully</h2>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                The workspace for {client.name} is now live. Your documents have moved into review and the filing timeline is being prepared.
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid gap-3 md:grid-cols-5">
                                {uploadSteps.map((step, index) => (
                                    <div key={step} className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3">
                                        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-ease-green text-xs font-black text-white">{index + 1}</div>
                                        <p className="mt-2 text-xs font-black text-emerald-800">{step}</p>
                                    </div>
                                ))}
                            </div>
                            {warning && <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{warning}</p>}
                            <p className="mt-5 text-sm font-bold text-slate-500">Redirecting you to the dashboard...</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    const activeStep = isSubmitting ? 2 : canSubmit ? 3 : documentStats.completed > 0 ? 1 : 0;
    const backTarget = isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard';
    const aiReady = isUsableGeminiKey(geminiApiKey);
    const requiredReady = documentStats.required === 0 || documentStats.requiredCompleted === documentStats.required;

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setPage(backTarget)}
                                    className="mb-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20"
                                >
                                    Back to workspace
                                </button>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Guided upload workspace</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{serviceName}</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Filing for <span className="font-black text-white">{client.name}</span>. Upload the documents below and Chartered Ease will move the application into review.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                                {[
                                    ['Completion', `${documentStats.completion}%`],
                                    ['Required Ready', `${documentStats.requiredCompleted}/${documentStats.required}`],
                                    ['AI Mode', aiReady ? 'Live' : 'Manual'],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">{label}</p>
                                        <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/70 p-5">
                        <div className="grid gap-3 md:grid-cols-5">
                            {uploadSteps.map((step, index) => {
                                const isActive = index === activeStep;
                                const isDone = index < activeStep || (index === 3 && canSubmit);

                                return (
                                    <div key={step} className={`rounded-3xl border p-3 transition ${isActive ? 'border-ease-electric bg-blue-50 shadow-lg shadow-ease-electric/10' : isDone ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${isDone ? 'bg-ease-green text-white' : isActive ? 'bg-ease-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Step {index + 1}</p>
                                                <p className="text-sm font-black text-slate-900">{step}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-5">
                    {documentConfig.groups ? (
                        documentConfig.groups.map((group: any, index: number) => (
                            <section key={index} className="glass-card p-5 md:p-6">
                                <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Document set</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-950">{group.title}</h3>
                                    </div>
                                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">Secure upload</span>
                                </div>
                                {group.required && renderDocumentList(group.required, true)}
                                {group.optional && <div className="mt-3">{renderDocumentList(group.optional, false)}</div>}
                                {group.individual && numberOfIndividuals > 0 && Array.from({ length: numberOfIndividuals }, (_, i) => i + 1).map(num => (
                                    <div key={num} className="mt-5 rounded-[1.35rem] border border-slate-100 bg-slate-50/70 p-4">
                                        <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">
                                            Details for {group.individual.label} #{num}
                                        </h4>
                                        
                                        {/* Existing DIN Checkbox for Company Incorporation */}
                                        {serviceId === 'company-incorporation' && (
                                            <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!directorDinStatus[num]} 
                                                        onChange={(e) => setDirectorDinStatus(prev => ({...prev, [num]: e.target.checked}))}
                                                        className="h-4 w-4 rounded text-ease-blue focus:ring-ease-blue"
                                                    />
                                                    <span className="text-sm font-bold text-slate-800">Director already has an existing DIN</span>
                                                </label>
                                                
                                                {directorDinStatus[num] && (
                                                    <div className="ml-6 mt-3 animate-fade-in">
                                                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                                                            DIN Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={directorDinValues[num] || ''} 
                                                            onChange={(e) => setDirectorDinValues(prev => ({...prev, [num]: e.target.value.replace(/\D/g,'').slice(0,8)}))}
                                                            placeholder="Enter 8-digit DIN"
                                                            className="input w-full text-sm md:w-64"
                                                            maxLength={8}
                                                        />
                                                        <p className="mt-2 text-xs font-bold text-blue-700">
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
                            </section>
                        ))
                    ) : (
                        <>
                            {documentConfig.required && (
                                <section className="glass-card p-5 md:p-6">
                                    <div className="mb-4 border-b border-slate-100 pb-4">
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Document set</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-950">Required Documents</h3>
                                    </div>
                                    {renderDocumentList(documentConfig.required, true)}
                                </section>
                            )}

                            {documentConfig.individual && numberOfIndividuals > 0 && Array.from({ length: numberOfIndividuals }, (_, i) => i + 1).map(num => (
                                <section key={num} className="glass-card p-5 md:p-6">
                                    <h3 className="mb-4 border-b border-slate-100 pb-4 text-xl font-black text-slate-950">
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
                                </section>
                            ))}
                            
                            {documentConfig.optional && documentConfig.optional.length > 0 && (
                                <section className="glass-card p-5 md:p-6">
                                    <div className="mb-4 border-b border-slate-100 pb-4">
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Enhance review</p>
                                        <h3 className="mt-1 text-xl font-black text-slate-950">Optional Documents</h3>
                                    </div>
                                    {renderDocumentList(documentConfig.optional, false)}
                                </section>
                            )}
                        </>
                    )}
                    </motion.div>

                    <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Upload progress</p>
                                        <h2 className="mt-1 text-xl font-black text-slate-950">Submission cockpit</h2>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${requiredReady ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {requiredReady ? 'Ready' : 'Action needed'}
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Completion</span>
                                        <span>{documentStats.completion}%</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: documentStats.completion / 100 }}
                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full origin-left rounded-full bg-ease-electric"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        ['Uploaded', `${documentStats.completed}/${documentStats.total}`],
                                        ['Required', `${documentStats.requiredCompleted}/${documentStats.required}`],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-3xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                                            <p className="mt-2 font-display text-2xl font-bold text-slate-950">{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-[1.25rem] border border-purple-100 bg-purple-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ease-purple shadow-sm"><SparkIcon /></span>
                                        <div>
                                            <p className="text-sm font-black text-slate-950">AI verification</p>
                                            <p className="text-xs font-bold text-purple-700">{aiReady ? 'Smart extraction is enabled.' : 'Manual fallback will be used.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(error || warning) && (
                                <div className="border-t border-slate-100 p-5">
                                    {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
                                    {warning && <p className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-700">{warning}</p>}
                                </div>
                            )}

                            <div className="border-t border-slate-100 bg-white/80 p-5">
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                                    className="flex w-full items-center justify-center rounded-2xl bg-ease-green px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        >
                                    {isSubmitting ? <LoaderIcon /> : 'Analyze Documents & Submit'}
                        </button>
                                <p className="mt-3 text-center text-xs font-bold text-slate-400">After submission, tracking starts automatically.</p>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </div>
    );
};

export default ServiceDocumentUpload;
