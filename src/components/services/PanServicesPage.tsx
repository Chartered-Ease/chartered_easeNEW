import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type PanFlow = 'apply' | 'correction' | 'aadhaarLink';

interface DocumentRequirement {
    id: string;
    label: string;
    description: string;
    required: boolean;
}

interface PanFlowConfig {
    id: PanFlow;
    title: string;
    cardTitle: string;
    subtitle: string;
    serviceName: string;
    submittedStatus: string;
    estimatedTimeline: string;
    accent: string;
    documents: DocumentRequirement[];
    timeline: string[];
    outputs: string[];
}

const PAN_FLOWS: Record<PanFlow, PanFlowConfig> = {
    apply: {
        id: 'apply',
        title: 'Apply for PAN',
        cardTitle: 'Apply for PAN',
        subtitle: 'Create a new PAN application request with identity, address and applicant documents.',
        serviceName: 'PAN Application',
        submittedStatus: 'PAN Application Request Submitted',
        estimatedTimeline: '3-5 working days',
        accent: 'bg-blue-50 text-ease-blue',
        documents: [
            { id: 'aadhaarCard', label: 'Aadhaar Card', description: 'Aadhaar card or e-Aadhaar of the applicant.', required: true },
            { id: 'photo', label: 'Passport Size Photo', description: 'Recent passport size photo of the applicant.', required: true },
            { id: 'signature', label: 'Signature', description: 'Clear signature image or scanned signature.', required: true },
            { id: 'dobProof', label: 'Date of Birth Proof', description: 'Birth certificate, school certificate, passport or Aadhaar if DOB is complete.', required: true },
            { id: 'addressProof', label: 'Address Proof', description: 'Aadhaar, bank statement, electricity bill or other address proof.', required: true },
            { id: 'otherProof', label: 'Other Supporting Proof', description: 'Any other document relevant to the PAN application.', required: false },
        ],
        timeline: ['Details Captured', 'Documents Uploaded', 'Application Prepared', 'Submitted for PAN Processing', 'PAN Acknowledgement Available'],
        outputs: ['PAN application acknowledgement', 'Application summary', 'PAN status update'],
    },
    correction: {
        id: 'correction',
        title: 'Apply for PAN Correction',
        cardTitle: 'Apply for PAN correction',
        subtitle: 'Correct PAN name, date of birth, father name, address, photo, signature or other details.',
        serviceName: 'PAN Correction',
        submittedStatus: 'PAN Correction Request Submitted',
        estimatedTimeline: '5-7 working days',
        accent: 'bg-purple-50 text-ease-purple',
        documents: [
            { id: 'existingPan', label: 'Existing PAN Card', description: 'Copy of existing PAN card or PAN allotment letter.', required: true },
            { id: 'aadhaarOrIdProof', label: 'Aadhaar / Identity Proof', description: 'Aadhaar or other identity proof supporting the correction.', required: true },
            { id: 'correctionProof', label: 'Proof for Correction', description: 'Document proof for corrected name, DOB, address or other detail.', required: true },
            { id: 'photo', label: 'Passport Size Photo', description: 'Photo required if photo is being updated or application requires it.', required: false },
            { id: 'signature', label: 'Signature', description: 'Signature required if signature is being updated or application requires it.', required: false },
            { id: 'addressProof', label: 'Address Proof', description: 'Address proof required if address correction is requested.', required: false },
        ],
        timeline: ['Correction Details Captured', 'Documents Uploaded', 'Correction Application Prepared', 'Submitted for Processing', 'Correction Acknowledgement Available'],
        outputs: ['PAN correction acknowledgement', 'Correction summary', 'Updated PAN status'],
    },
    aadhaarLink: {
        id: 'aadhaarLink',
        title: 'Link PAN with Aadhaar',
        cardTitle: 'Link PAN with Aadhaar',
        subtitle: 'Submit PAN-Aadhaar link request details and documents for team review and processing.',
        serviceName: 'PAN Aadhaar Link',
        submittedStatus: 'PAN Aadhaar Link Request Submitted',
        estimatedTimeline: '1-2 working days',
        accent: 'bg-emerald-50 text-emerald-700',
        documents: [
            { id: 'panCard', label: 'PAN Card', description: 'Copy of PAN card or PAN details screenshot.', required: true },
            { id: 'aadhaarCard', label: 'Aadhaar Card', description: 'Copy of Aadhaar card or e-Aadhaar.', required: true },
            { id: 'portalScreenshot', label: 'Portal Screenshot', description: 'Screenshot of mismatch, payment or linking status if available.', required: false },
            { id: 'feeChallan', label: 'Fee Challan / Payment Receipt', description: 'Payment challan or receipt, if already paid.', required: false },
        ],
        timeline: ['PAN and Aadhaar Details Captured', 'Documents Uploaded', 'Mismatch Checked', 'Linking Request Processed', 'Confirmation Shared'],
        outputs: ['PAN-Aadhaar link confirmation', 'Status screenshot', 'Payment / linking note if applicable'],
    },
};

const PAN_FLOW_LIST: PanFlowConfig[] = [PAN_FLOWS.apply, PAN_FLOWS.correction, PAN_FLOWS.aadhaarLink];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const APPLICANT_CATEGORIES = ['Individual', 'Minor', 'Senior citizen', 'NRI / Foreign citizen'];
const CORRECTION_FIELDS = ['Name', 'Date of birth', 'Father name', 'Address', 'Photo', 'Signature', 'Other details'];

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const DocumentStatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Pending: 'border-slate-100 bg-slate-50 text-slate-500',
        Uploaded: 'border-blue-100 bg-blue-50 text-ease-blue',
        Optional: 'border-slate-100 bg-white text-slate-400',
    };

    return (
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status] || styles.Pending}`}>
            {status}
        </span>
    );
};

const PanDocumentUpload: React.FC<{
    doc: DocumentRequirement;
    files: File[];
    onChange: (docId: string, files: File[]) => void;
}> = ({ doc, files, onChange }) => {
    const status = files.length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional';

    return (
        <motion.div
            layout
            whileHover={{ y: -3 }}
            className={`rounded-[1.3rem] border p-4 shadow-sm transition ${
                files.length > 0 ? 'border-blue-100 bg-blue-50/50' : 'border-slate-100 bg-white'
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-950">
                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </h4>
                        <DocumentStatusBadge status={status} />
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{doc.description}</p>
                    {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {files.map((file, index) => (
                                <div key={`${doc.id}-${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                                    <span className="truncate font-bold text-slate-700">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => onChange(doc.id, files.filter((_, fileIndex) => fileIndex !== index))}
                                        className="ml-3 shrink-0 rounded-full px-2 py-1 text-xs font-black text-red-600 transition hover:bg-red-50"
                                    >
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
};

const Stepper = ({ steps, currentStep }: { steps: string[]; currentStep: number }) => (
    <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => (
            <div key={step} className={`rounded-2xl border p-3 transition ${index <= currentStep ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-400'}`}>
                <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index <= currentStep ? 'bg-ease-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {index + 1}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wide">{step}</span>
                </div>
            </div>
        ))}
    </div>
);

const PanServicesPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [selectedFlow, setSelectedFlow] = useState<PanFlow | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ referenceId: string; status: string; submittedAt: string } | null>(null);

    const [applicantDetails, setApplicantDetails] = useState({
        applicantCategory: APPLICANT_CATEGORIES[0],
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        gender: GENDER_OPTIONS[0],
        mobile: '',
        email: '',
        address: '',
    });
    const [correctionDetails, setCorrectionDetails] = useState({
        existingPan: '',
        fullName: '',
        dateOfBirth: '',
        correctionFields: [] as string[],
        incorrectDetails: '',
        correctedDetails: '',
        mobile: '',
        email: '',
    });
    const [aadhaarLinkDetails, setAadhaarLinkDetails] = useState({
        panNumber: '',
        aadhaarNumber: '',
        nameAsPerPan: '',
        nameAsPerAadhaar: '',
        dateOfBirth: '',
        mobile: '',
        email: '',
        mismatchType: 'No mismatch known',
        feePaid: 'Not yet paid',
    });

    const config = selectedFlow ? PAN_FLOWS[selectedFlow] : null;
    const steps = selectedFlow === 'apply'
        ? ['Applicant', 'Address', 'Documents', 'Review']
        : selectedFlow === 'correction'
            ? ['PAN Details', 'Correction', 'Documents', 'Review']
            : ['PAN & Aadhaar', 'Contact', 'Documents', 'Review'];

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setApplicantDetails(prev => ({
            ...prev,
            fullName: prev.fullName || client.name,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
        setCorrectionDetails(prev => ({
            ...prev,
            fullName: prev.fullName || client.name,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
        setAadhaarLinkDetails(prev => ({
            ...prev,
            nameAsPerPan: prev.nameAsPerPan || client.name,
            nameAsPerAadhaar: prev.nameAsPerAadhaar || client.name,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
    }, [client]);

    const requiredDocsReady = useMemo(() => {
        if (!config) return false;
        return config.documents.filter(doc => doc.required).every(doc => (files[doc.id] || []).length > 0);
    }, [config, files]);

    const uploadStats = useMemo(() => {
        if (!config) return { total: 0, uploaded: 0, completion: 0 };
        const uploaded = config.documents.filter(doc => (files[doc.id] || []).length > 0).length;
        return {
            total: config.documents.length,
            uploaded,
            completion: config.documents.length ? Math.round((uploaded / config.documents.length) * 100) : 0,
        };
    }, [config, files]);

    const updateFiles = (docId: string, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const startFlow = (flow: PanFlow) => {
        setSelectedFlow(flow);
        setCurrentStep(0);
        setFiles({});
        setError('');
        setSubmitted(null);
    };

    const toggleCorrectionField = (field: string) => {
        setCorrectionDetails(prev => ({
            ...prev,
            correctionFields: prev.correctionFields.includes(field)
                ? prev.correctionFields.filter(item => item !== field)
                : [...prev.correctionFields, field],
        }));
    };

    const validateStep = () => {
        if (!selectedFlow) return '';

        if (selectedFlow === 'apply') {
            if (currentStep === 0 && (!applicantDetails.fullName.trim() || !applicantDetails.fatherName.trim() || !applicantDetails.dateOfBirth || !applicantDetails.mobile.trim() || !applicantDetails.email.trim())) {
                return 'Please complete applicant name, father name, DOB, mobile and email.';
            }
            if (currentStep === 1 && !applicantDetails.address.trim()) return 'Please enter communication address.';
            if (currentStep === 2 && !requiredDocsReady) return 'Please upload all required PAN application documents.';
        }

        if (selectedFlow === 'correction') {
            if (currentStep === 0 && (!correctionDetails.existingPan.trim() || !correctionDetails.fullName.trim() || !correctionDetails.dateOfBirth)) {
                return 'Please enter existing PAN, name and date of birth.';
            }
            if (currentStep === 1 && (correctionDetails.correctionFields.length === 0 || !correctionDetails.correctedDetails.trim())) {
                return 'Please select correction type and enter corrected details.';
            }
            if (currentStep === 2 && !requiredDocsReady) return 'Please upload all required PAN correction documents.';
        }

        if (selectedFlow === 'aadhaarLink') {
            if (currentStep === 0 && (!aadhaarLinkDetails.panNumber.trim() || !aadhaarLinkDetails.aadhaarNumber.trim() || !aadhaarLinkDetails.nameAsPerPan.trim() || !aadhaarLinkDetails.nameAsPerAadhaar.trim() || !aadhaarLinkDetails.dateOfBirth)) {
                return 'Please enter PAN, Aadhaar, names and date of birth.';
            }
            if (currentStep === 1 && !aadhaarLinkDetails.mobile.trim()) return 'Please enter mobile number for contact.';
            if (currentStep === 2 && !requiredDocsReady) return 'Please upload PAN card and Aadhaar card.';
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
        setCurrentStep(step => Math.min(step + 1, steps.length - 1));
    };

    const handleSubmit = async () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        if (!client || !config || !selectedFlow) {
            setError('Client context is missing. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const uploadQueue: Array<{ doc: DocumentRequirement; file: File; index: number }> = [];
            config.documents.forEach(doc => {
                (files[doc.id] || []).forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `pan_${selectedFlow}_${item.doc.id}_${item.index + 1}` : `pan_${selectedFlow}_${item.doc.id}`,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                panWorkflow: config.title,
                applicantDetails: selectedFlow === 'apply' ? applicantDetails : undefined,
                correctionDetails: selectedFlow === 'correction' ? correctionDetails : undefined,
                aadhaarLinkDetails: selectedFlow === 'aadhaarLink' ? aadhaarLinkDetails : undefined,
                documentStatuses: config.documents.map(doc => ({
                    document: doc.label,
                    status: (files[doc.id] || []).length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: config.outputs,
                timeline: config.timeline,
            };

            const newProfile = processServiceApplication(client.id, null, config.serviceName, extractedData, profileDocuments);
            const existingSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
            const submissionId = Date.now();
            const submittedAt = new Date().toLocaleString();

            existingSubmissions.push({
                id: submissionId,
                service: config.serviceName,
                clientName: client.name,
                clientId: client.id,
                profileName: newProfile.name,
                profileId: newProfile.id,
                mobile: client.mobileNumber,
                entityType: client.entityType,
                extractedData: newProfile.extractedData,
                documents: newProfile.documents,
                outputDocuments: [],
                status: config.submittedStatus,
                submittedAt,
                createdByType: isAgentAuthenticated ? 'agent' : 'customer',
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                status: config.submittedStatus,
                submittedAt,
            });
        } catch (err: any) {
            console.error('PAN service submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit PAN service request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFlowFields = () => {
        if (!selectedFlow || !config) return null;

        if (selectedFlow === 'apply') {
            if (currentStep === 0) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Applicant Category</span>
                            <select value={applicantDetails.applicantCategory} onChange={(event) => setApplicantDetails(prev => ({ ...prev, applicantCategory: event.target.value }))} className="input">
                                {APPLICANT_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Full Name</span>
                            <input value={applicantDetails.fullName} onChange={(event) => setApplicantDetails(prev => ({ ...prev, fullName: event.target.value }))} className="input" placeholder="Name as per Aadhaar" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Father Name</span>
                            <input value={applicantDetails.fatherName} onChange={(event) => setApplicantDetails(prev => ({ ...prev, fatherName: event.target.value }))} className="input" placeholder="Father name" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Date of Birth</span>
                            <input type="date" value={applicantDetails.dateOfBirth} onChange={(event) => setApplicantDetails(prev => ({ ...prev, dateOfBirth: event.target.value }))} className="input" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Gender</span>
                            <select value={applicantDetails.gender} onChange={(event) => setApplicantDetails(prev => ({ ...prev, gender: event.target.value }))} className="input">
                                {GENDER_OPTIONS.map(gender => <option key={gender}>{gender}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mobile</span>
                            <input value={applicantDetails.mobile} onChange={(event) => setApplicantDetails(prev => ({ ...prev, mobile: event.target.value }))} className="input" placeholder="Mobile number" />
                        </label>
                        <label className="md:col-span-2">
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Email</span>
                            <input value={applicantDetails.email} onChange={(event) => setApplicantDetails(prev => ({ ...prev, email: event.target.value }))} className="input" placeholder="Email ID" />
                        </label>
                    </div>
                );
            }

            if (currentStep === 1) {
                return (
                    <label>
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Communication Address</span>
                        <textarea value={applicantDetails.address} onChange={(event) => setApplicantDetails(prev => ({ ...prev, address: event.target.value }))} className="input min-h-[160px]" placeholder="Full address with PIN code" />
                    </label>
                );
            }
        }

        if (selectedFlow === 'correction') {
            if (currentStep === 0) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Existing PAN</span>
                            <input value={correctionDetails.existingPan} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, existingPan: event.target.value.toUpperCase() }))} className="input" placeholder="ABCDE1234F" maxLength={10} />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Full Name</span>
                            <input value={correctionDetails.fullName} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, fullName: event.target.value }))} className="input" placeholder="Current applicant name" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Date of Birth</span>
                            <input type="date" value={correctionDetails.dateOfBirth} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, dateOfBirth: event.target.value }))} className="input" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mobile</span>
                            <input value={correctionDetails.mobile} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, mobile: event.target.value }))} className="input" placeholder="Mobile number" />
                        </label>
                        <label className="md:col-span-2">
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Email</span>
                            <input value={correctionDetails.email} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, email: event.target.value }))} className="input" placeholder="Email ID" />
                        </label>
                    </div>
                );
            }

            if (currentStep === 1) {
                return (
                    <div className="space-y-5">
                        <div>
                            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">What needs correction?</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                {CORRECTION_FIELDS.map(field => (
                                    <button
                                        key={field}
                                        type="button"
                                        onClick={() => toggleCorrectionField(field)}
                                        className={`rounded-[1.15rem] border p-4 text-left text-sm font-black transition ${correctionDetails.correctionFields.includes(field) ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50/50'}`}
                                    >
                                        {field}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Incorrect / Existing Details</span>
                            <textarea value={correctionDetails.incorrectDetails} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, incorrectDetails: event.target.value }))} className="input min-h-[110px]" placeholder="Mention current incorrect details appearing in PAN." />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Correct Details</span>
                            <textarea value={correctionDetails.correctedDetails} onChange={(event) => setCorrectionDetails(prev => ({ ...prev, correctedDetails: event.target.value }))} className="input min-h-[110px]" placeholder="Mention exact corrected details to be updated." />
                        </label>
                    </div>
                );
            }
        }

        if (selectedFlow === 'aadhaarLink') {
            if (currentStep === 0) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">PAN Number</span>
                            <input value={aadhaarLinkDetails.panNumber} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, panNumber: event.target.value.toUpperCase() }))} className="input" placeholder="ABCDE1234F" maxLength={10} />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Aadhaar Number</span>
                            <input value={aadhaarLinkDetails.aadhaarNumber} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, aadhaarNumber: event.target.value.replace(/\D/g, '').slice(0, 12) }))} className="input" placeholder="12 digit Aadhaar number" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Name as per PAN</span>
                            <input value={aadhaarLinkDetails.nameAsPerPan} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, nameAsPerPan: event.target.value }))} className="input" placeholder="Name on PAN" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Name as per Aadhaar</span>
                            <input value={aadhaarLinkDetails.nameAsPerAadhaar} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, nameAsPerAadhaar: event.target.value }))} className="input" placeholder="Name on Aadhaar" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Date of Birth</span>
                            <input type="date" value={aadhaarLinkDetails.dateOfBirth} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, dateOfBirth: event.target.value }))} className="input" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Known Mismatch</span>
                            <select value={aadhaarLinkDetails.mismatchType} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, mismatchType: event.target.value }))} className="input">
                                <option>No mismatch known</option>
                                <option>Name mismatch</option>
                                <option>Date of birth mismatch</option>
                                <option>Gender mismatch</option>
                                <option>Not sure</option>
                            </select>
                        </label>
                    </div>
                );
            }

            if (currentStep === 1) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Mobile</span>
                            <input value={aadhaarLinkDetails.mobile} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, mobile: event.target.value }))} className="input" placeholder="Mobile number" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Email</span>
                            <input value={aadhaarLinkDetails.email} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, email: event.target.value }))} className="input" placeholder="Email ID" />
                        </label>
                        <label className="md:col-span-2">
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">PAN-Aadhaar Link Fee Status</span>
                            <select value={aadhaarLinkDetails.feePaid} onChange={(event) => setAadhaarLinkDetails(prev => ({ ...prev, feePaid: event.target.value }))} className="input">
                                <option>Not yet paid</option>
                                <option>Already paid</option>
                                <option>Not sure</option>
                            </select>
                        </label>
                    </div>
                );
            }
        }

        if (currentStep === 2) {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    {config.documents.map(doc => (
                        <PanDocumentUpload key={doc.id} doc={doc} files={files[doc.id] || []} onChange={updateFiles} />
                    ))}
                </div>
            );
        }

        return (
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{config.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Review the details and submit the PAN service request. Uploaded documents will also be stored with the client profile.
                    </p>
                    <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredDocsReady ? 'text-ease-green' : 'text-orange-700'}>{requiredDocsReady ? 'Ready' : 'Pending'}</span></div>
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Uploaded sections</span><span>{uploadStats.uploaded}/{uploadStats.total}</span></div>
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>{config.submittedStatus}</span></div>
                    </div>
                </div>

                <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-ease-blue">After submission</p>
                    <div className="mt-4 space-y-3">
                        {config.timeline.map((item, index) => (
                            <div key={item} className="flex gap-3">
                                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-ease-blue text-white' : 'bg-white text-slate-500'}`}>{index + 1}</span>
                                <p className="text-sm font-bold text-slate-700">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading PAN services...</div>
            </div>
        );
    }

    if (submitted && config) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">PAN Services</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">{submitted.status}</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Your PAN request is now with the Chartered Ease team. Status and output documents will appear in the dashboard.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submitted.referenceId}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Service</p>
                                <p className="mt-2 text-xl font-black text-slate-950">{config.serviceName}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Submitted</p>
                                <p className="mt-2 text-base font-black text-slate-950">{submitted.submittedAt}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {config.timeline.map((item, index) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index === 0 ? 'bg-emerald-100 text-emerald-700' : index === 1 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'}`}>
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

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="blue-glow-button">
                                Back to Dashboard
                            </button>
                            <button onClick={() => { setSubmitted(null); setSelectedFlow(null); }} className="soft-button bg-white text-slate-900">
                                Submit Another PAN Request
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (!selectedFlow) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                                Back to workspace
                            </button>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">PAN Services</p>
                            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Choose your PAN workflow</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Start a new PAN application, correct existing PAN details, or link PAN with Aadhaar from one clean workspace.
                            </p>
                        </div>
                    </section>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {PAN_FLOW_LIST.map((flow, index) => (
                            <motion.button
                                key={flow.id}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                whileHover={{ y: -6 }}
                                onClick={() => startFlow(flow.id)}
                                className="glass-card flex min-h-[260px] flex-col p-6 text-left transition hover:border-ease-electric/30 hover:shadow-2xl"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${flow.accent}`}>PAN Service</span>
                                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{flow.estimatedTimeline}</span>
                                </div>
                                <h2 className="mt-5 font-display text-2xl font-bold text-slate-950">{flow.cardTitle}</h2>
                                <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{flow.subtitle}</p>
                                <span className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ease-green px-4 py-3 text-sm font-black text-white transition hover:bg-green-700">
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
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setSelectedFlow(null)} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to PAN services
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">PAN workflow</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">{config?.title}</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">{config?.subtitle}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">{getEntityLabel(client.entityType)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <Stepper steps={steps} currentStep={currentStep} />

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <main className="glass-card p-5 md:p-6">
                        <div className="mb-5">
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Step {currentStep + 1} of {steps.length}</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-950">{steps[currentStep]}</h2>
                        </div>

                        {renderFlowFields()}

                        {error && <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(step => Math.max(step - 1, 0))}
                                disabled={currentStep === 0}
                                className="soft-button bg-white text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {currentStep < steps.length - 1 ? (
                                <button type="button" onClick={goNext} className="blue-glow-button">
                                    Continue
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                    {isSubmitting ? <LoaderIcon /> : 'Submit PAN Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Workflow status</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">{config?.title}</h2>
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Document progress</span>
                                        <span>{uploadStats.completion}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-ease-electric transition-all duration-500" style={{ width: `${uploadStats.completion}%` }} />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {config?.timeline.map((item, index) => (
                                        <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-ease-blue text-white' : 'bg-white text-slate-400'}`}>
                                                {index + 1}
                                            </span>
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

export default PanServicesPage;
