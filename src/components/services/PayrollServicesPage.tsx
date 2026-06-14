import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type PayrollFlow = 'registration' | 'return' | 'support';

interface DocumentRequirement {
    id: string;
    label: string;
    description: string;
    required: boolean;
}

interface FlowConfig {
    id: PayrollFlow;
    title: string;
    cardTitle: string;
    subtitle: string;
    serviceName: string;
    submittedStatus: string;
    timeline: string[];
    timelineHint: string;
    timelineText: string;
    estimatedTimeline: string;
    documents: DocumentRequirement[];
}

const PF_FLOWS: Record<PayrollFlow, FlowConfig> = {
    registration: {
        id: 'registration',
        title: 'PF Registration',
        cardTitle: 'New PF Registration',
        subtitle: 'Register your establishment with EPFO and start PF compliance.',
        serviceName: 'PF Registration',
        submittedStatus: 'PF Registration Request Submitted',
        timeline: ['Documents Uploaded', 'Under Review', 'Application Preparation', 'Submitted to EPFO', 'PF Registration Completed'],
        timelineHint: 'Registration journey',
        timelineText: 'Our team will verify documents, prepare the EPFO application and update the status after submission.',
        estimatedTimeline: '5-7 working days',
        documents: [
            { id: 'businessPan', label: 'PAN of Business / Proprietor', description: 'Business PAN or proprietor PAN as applicable.', required: true },
            { id: 'authorizedAadhaar', label: 'Aadhaar of Proprietor / Authorized Signatory', description: 'Aadhaar of the person authorized to register the establishment.', required: true },
            { id: 'businessAddressProof', label: 'Address Proof of Business', description: 'Registered business address proof.', required: true },
            { id: 'electricityBill', label: 'Electricity Bill', description: 'Latest utility bill for the business premises.', required: true },
            { id: 'rentOrOwnershipProof', label: 'Rent Agreement / Ownership Proof', description: 'Premises ownership proof or rent agreement.', required: true },
            { id: 'bankProof', label: 'Bank Statement / Cancelled Cheque', description: 'Bank account proof of the establishment.', required: true },
            { id: 'employeeList', label: 'Employee List', description: 'List of employees covered under PF.', required: true },
            { id: 'digitalSignature', label: 'Digital Signature Certificate if applicable', description: 'DSC of authorized signatory if available/applicable.', required: true },
            { id: 'gstCertificate', label: 'GST Certificate', description: 'Optional GST registration certificate.', required: false },
            { id: 'shopActCertificate', label: 'Shop Act Certificate', description: 'Optional Shop and Establishment certificate.', required: false },
            { id: 'udyamCertificate', label: 'Udyam Certificate', description: 'Optional Udyam/MSME certificate.', required: false },
            { id: 'labourLicense', label: 'Existing Labour License if any', description: 'Optional labour license or registration document.', required: false },
        ],
    },
    return: {
        id: 'return',
        title: 'PF Monthly Return Filing',
        cardTitle: 'Existing PF Return Filing',
        subtitle: 'Upload payroll records and request monthly PF/ECR filing.',
        serviceName: 'PF Return Filing',
        submittedStatus: 'PF Return Filing Request Submitted',
        timeline: ['Salary Data Uploaded', 'Data Under Review', 'ECR Preparation', 'Challan Generated', 'PF Return Filed', 'Acknowledgement Available'],
        timelineHint: 'Monthly return workflow',
        timelineText: 'The team will review salary data, prepare ECR, generate challan and share acknowledgement after filing.',
        estimatedTimeline: '1-2 working days',
        documents: [
            { id: 'employeeSalarySheet', label: 'Employee salary sheet', description: 'Monthly employee salary sheet.', required: true },
            { id: 'employeePfWages', label: 'Employee PF wages', description: 'PF wage breakup for employees.', required: true },
            { id: 'uanList', label: 'UAN list', description: 'Employee-wise UAN details.', required: true },
            { id: 'newJoineeList', label: 'New joinee list', description: 'New employees added during the month.', required: true },
            { id: 'exitEmployeeList', label: 'Exit employee list', description: 'Employees exited during the month.', required: true },
            { id: 'previousMonthEcr', label: 'Previous month ECR if available', description: 'Previous ECR or filing record.', required: true },
            { id: 'attendanceSheet', label: 'Attendance sheet', description: 'Optional attendance data for cross-checking.', required: false },
            { id: 'challanCopy', label: 'Challan copy', description: 'Optional challan copy.', required: false },
            { id: 'pfPaymentReceipt', label: 'PF payment receipt', description: 'Optional PF payment proof.', required: false },
            { id: 'previousAcknowledgement', label: 'Previous filing acknowledgement', description: 'Optional prior filing acknowledgement.', required: false },
        ],
    },
    support: {
        id: 'support',
        title: 'PF Compliance Support',
        cardTitle: 'PF Compliance Support / Notice Assistance',
        subtitle: 'Upload PF notice or compliance issue details for expert review.',
        serviceName: 'PF Compliance Support',
        submittedStatus: 'PF Compliance Support Request Submitted',
        timeline: ['Notice Uploaded', 'Expert Review', 'Reply Drafted', 'Response Submitted', 'Case Closed'],
        timelineHint: 'Notice support workflow',
        timelineText: 'The team will review the issue, draft the response and track closure with EPFO.',
        estimatedTimeline: 'Case based',
        documents: [
            { id: 'pfNotice', label: 'PF Notice', description: 'Notice or communication received from EPFO.', required: true },
            { id: 'previousEcr', label: 'Previous ECR', description: 'Previous ECR records relevant to the issue.', required: false },
            { id: 'challans', label: 'Challans', description: 'PF challans or payment records.', required: false },
            { id: 'employeeRecords', label: 'Employee records', description: 'Employee data relevant to the notice.', required: false },
            { id: 'epfoCorrespondence', label: 'Any correspondence with EPFO', description: 'Emails, letters or portal screenshots.', required: false },
        ],
    },
};

const VISIBLE_PF_FLOWS: FlowConfig[] = [PF_FLOWS.registration, PF_FLOWS.return];

const MONTH_OPTIONS = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March',
];

const YEAR_OPTIONS = ['2026-27', '2025-26', '2024-25', '2023-24'];

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const DocumentStatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Pending: 'border-slate-100 bg-slate-50 text-slate-500',
        Uploaded: 'border-blue-100 bg-blue-50 text-ease-blue',
        'Under Review': 'border-purple-100 bg-purple-50 text-ease-purple',
        Verified: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        'Re-upload Required': 'border-red-100 bg-red-50 text-red-700',
    };

    return (
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status] || styles.Pending}`}>
            {status}
        </span>
    );
};

const PayrollDocumentUpload: React.FC<{
    doc: DocumentRequirement;
    files: File[];
    onChange: (docId: string, files: File[]) => void;
}> = ({ doc, files, onChange }) => {
    const status = files.length > 0 ? 'Uploaded' : 'Pending';

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
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.zip"
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

const PayrollServicesPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [selectedFlow, setSelectedFlow] = useState<PayrollFlow | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ referenceId: string; status: string; submittedAt: string } | null>(null);

    const [businessDetails, setBusinessDetails] = useState({
        businessName: '',
        entityType: '',
        pan: '',
        address: '',
        mobile: '',
        email: '',
    });
    const [employeeDetails, setEmployeeDetails] = useState({
        employeeCount: '',
        pfApplicableFrom: '',
        employeesHaveUan: 'Yes',
    });
    const [pfCredentials, setPfCredentials] = useState({
        establishmentId: '',
        epfoUserId: '',
        epfoPassword: '',
        registeredContact: '',
    });
    const [returnPeriod, setReturnPeriod] = useState({
        month: MONTH_OPTIONS[0],
        year: YEAR_OPTIONS[0],
    });
    const [supportDetails, setSupportDetails] = useState({
        establishmentId: '',
        noticeType: '',
        noticeDate: '',
        remarks: '',
    });

    const config = selectedFlow ? PF_FLOWS[selectedFlow] : null;
    const steps = selectedFlow === 'registration'
        ? ['Business', 'Employees', 'Documents', 'Review']
        : selectedFlow === 'return'
            ? ['Credentials', 'Period', 'Documents', 'Submit']
            : ['Notice', 'Documents', 'Review', 'Submit'];

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setBusinessDetails(prev => ({
            ...prev,
            businessName: prev.businessName || client.name,
            entityType: prev.entityType || getEntityLabel(client.entityType),
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

    const startFlow = (flow: PayrollFlow) => {
        setSelectedFlow(flow);
        setCurrentStep(0);
        setFiles({});
        setError('');
        setSubmitted(null);
    };

    const validateStep = () => {
        if (!selectedFlow) return '';
        if (selectedFlow === 'registration') {
            if (currentStep === 0 && (!businessDetails.businessName.trim() || !businessDetails.pan.trim() || !businessDetails.address.trim() || !businessDetails.mobile.trim() || !businessDetails.email.trim())) {
                return 'Please complete business name, PAN, address, mobile and email.';
            }
            if (currentStep === 1 && (!employeeDetails.employeeCount.trim() || !employeeDetails.pfApplicableFrom)) {
                return 'Please enter employee count and PF applicability date.';
            }
            if (currentStep === 2 && !requiredDocsReady) return 'Please upload all required PF registration documents.';
        }

        if (selectedFlow === 'return') {
            if (currentStep === 0 && (!pfCredentials.establishmentId.trim() || !pfCredentials.epfoUserId.trim() || !pfCredentials.epfoPassword.trim())) {
                return 'Please enter Establishment ID, EPFO User ID and EPFO password.';
            }
            if (currentStep === 2 && !requiredDocsReady) return 'Please upload all required PF return documents.';
        }

        if (selectedFlow === 'support') {
            if (currentStep === 0 && (!supportDetails.establishmentId.trim() || !supportDetails.noticeType.trim() || !supportDetails.noticeDate)) {
                return 'Please enter PF Establishment ID, notice type and notice date.';
            }
            if (currentStep === 1 && !requiredDocsReady) return 'Please upload the PF notice copy.';
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

        if (!client || !config) {
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
                type: item.index > 0 ? `${item.doc.id}_${item.index + 1}` : item.doc.id,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                payrollWorkflow: config.title,
                businessDetails,
                employeeDetails: selectedFlow === 'registration' ? employeeDetails : undefined,
                pfCredentials: selectedFlow === 'return' ? pfCredentials : undefined,
                returnPeriod: selectedFlow === 'return' ? returnPeriod : undefined,
                supportDetails: selectedFlow === 'support' ? supportDetails : undefined,
                documentStatuses: config.documents.map(doc => ({
                    document: doc.label,
                    status: (files[doc.id] || []).length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: selectedFlow === 'registration'
                    ? ['PF Registration Certificate', 'Establishment ID', 'Login Details']
                    : selectedFlow === 'return'
                        ? ['ECR acknowledgement', 'PF challan', 'Payment receipt', 'Filing summary']
                        : ['Reply copy', 'Submission acknowledgement'],
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
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                status: config.submittedStatus,
                submittedAt,
            });
        } catch (err: any) {
            console.error('PF payroll service submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit PF service request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFlowFields = () => {
        if (!selectedFlow || !config) return null;

        if (selectedFlow === 'registration') {
            if (currentStep === 0) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            ['businessName', 'Business Name'],
                            ['entityType', 'Entity Type'],
                            ['pan', 'PAN'],
                            ['address', 'Address'],
                            ['mobile', 'Mobile'],
                            ['email', 'Email'],
                        ].map(([key, label]) => (
                            <label key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                <input
                                    value={businessDetails[key as keyof typeof businessDetails]}
                                    onChange={(event) => setBusinessDetails(prev => ({ ...prev, [key]: event.target.value }))}
                                    className="input"
                                    placeholder={label}
                                />
                            </label>
                        ))}
                    </div>
                );
            }

            if (currentStep === 1) {
                return (
                    <div className="grid gap-4 md:grid-cols-3">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Number of employees</span>
                            <input type="number" value={employeeDetails.employeeCount} onChange={(event) => setEmployeeDetails(prev => ({ ...prev, employeeCount: event.target.value }))} className="input" placeholder="20" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">PF applicable from</span>
                            <input type="date" value={employeeDetails.pfApplicableFrom} onChange={(event) => setEmployeeDetails(prev => ({ ...prev, pfApplicableFrom: event.target.value }))} className="input" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Employees have UAN?</span>
                            <select value={employeeDetails.employeesHaveUan} onChange={(event) => setEmployeeDetails(prev => ({ ...prev, employeesHaveUan: event.target.value }))} className="input">
                                <option>Yes</option>
                                <option>No</option>
                                <option>Mixed</option>
                            </select>
                        </label>
                    </div>
                );
            }
        }

        if (selectedFlow === 'return') {
            if (currentStep === 0) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Establishment ID</span>
                            <input value={pfCredentials.establishmentId} onChange={(event) => setPfCredentials(prev => ({ ...prev, establishmentId: event.target.value }))} className="input" placeholder="EPFO Establishment ID" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">EPFO User ID</span>
                            <input value={pfCredentials.epfoUserId} onChange={(event) => setPfCredentials(prev => ({ ...prev, epfoUserId: event.target.value }))} className="input" placeholder="User ID" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">EPFO Password</span>
                            <input type="password" value={pfCredentials.epfoPassword} onChange={(event) => setPfCredentials(prev => ({ ...prev, epfoPassword: event.target.value }))} className="input" placeholder="Password" />
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Registered mobile/email</span>
                            <input value={pfCredentials.registeredContact} onChange={(event) => setPfCredentials(prev => ({ ...prev, registeredContact: event.target.value }))} className="input" placeholder="Optional" />
                        </label>
                    </div>
                );
            }

            if (currentStep === 1) {
                return (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Return month</span>
                            <select value={returnPeriod.month} onChange={(event) => setReturnPeriod(prev => ({ ...prev, month: event.target.value }))} className="input">
                                {MONTH_OPTIONS.map(month => <option key={month}>{month}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Financial year</span>
                            <select value={returnPeriod.year} onChange={(event) => setReturnPeriod(prev => ({ ...prev, year: event.target.value }))} className="input">
                                {YEAR_OPTIONS.map(year => <option key={year}>{year}</option>)}
                            </select>
                        </label>
                    </div>
                );
            }
        }

        if (selectedFlow === 'support' && currentStep === 0) {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    <label>
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">PF Establishment ID</span>
                        <input value={supportDetails.establishmentId} onChange={(event) => setSupportDetails(prev => ({ ...prev, establishmentId: event.target.value }))} className="input" placeholder="Establishment ID" />
                    </label>
                    <label>
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notice Type</span>
                        <input value={supportDetails.noticeType} onChange={(event) => setSupportDetails(prev => ({ ...prev, noticeType: event.target.value }))} className="input" placeholder="Inspection / Demand / Clarification" />
                    </label>
                    <label>
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Notice Date</span>
                        <input type="date" value={supportDetails.noticeDate} onChange={(event) => setSupportDetails(prev => ({ ...prev, noticeDate: event.target.value }))} className="input" />
                    </label>
                    <label className="md:col-span-2">
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Remarks</span>
                        <textarea value={supportDetails.remarks} onChange={(event) => setSupportDetails(prev => ({ ...prev, remarks: event.target.value }))} className="input min-h-[120px]" placeholder="Briefly describe the issue." />
                    </label>
                </div>
            );
        }

        if ((selectedFlow === 'registration' && currentStep === 2) || (selectedFlow === 'return' && currentStep === 2) || (selectedFlow === 'support' && currentStep === 1)) {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    {config.documents.map(doc => (
                        <PayrollDocumentUpload key={doc.id} doc={doc} files={files[doc.id] || []} onChange={updateFiles} />
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
                        Review the details and submit the PF service request. Uploaded documents will be visible in the dashboard status section.
                    </p>
                    <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredDocsReady ? 'text-ease-green' : 'text-orange-700'}>{requiredDocsReady ? 'Ready' : 'Pending'}</span></div>
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Uploaded sections</span><span>{uploadStats.uploaded}/{uploadStats.total}</span></div>
                        <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>{config.submittedStatus}</span></div>
                    </div>
                </div>

                <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-ease-blue">{config.timelineHint}</p>
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
                <div className="glass-card mx-auto max-w-md p-8">Loading payroll workflow...</div>
            </div>
        );
    }

    if (submitted && config) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">PF compliance workflow</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">{submitted.status}</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">{config.timelineText}</p>
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
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                            index === 0 ? 'bg-emerald-100 text-emerald-700' : index === 1 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'
                                        }`}>
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
                            <button onClick={() => setSubmitted(null)} className="soft-button bg-white text-slate-900">
                                Submit Another PF Request
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
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Payroll Services</p>
                            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">PF Compliance Workflow</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                V1 supports only PF registration and monthly PF return filing for business entities.
                            </p>
                        </div>
                    </section>

                    <div className="grid gap-5 lg:grid-cols-2">
                        {VISIBLE_PF_FLOWS.map((flow, index) => (
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
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">PF Service</span>
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
                            Back to PF services
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">PF compliance workflow</p>
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
                                    {isSubmitting ? <LoaderIcon /> : 'Submit PF Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Workflow status</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">{config?.timelineHint}</h2>
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

export default PayrollServicesPage;
