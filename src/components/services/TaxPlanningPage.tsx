import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { Document as ProfileDocument, fileToDataURL, useClientManager } from '../../hooks/useProfile';
import { getEntityLabel } from '../../data/entityServiceCatalog';
import { LoaderIcon } from '../icons/LoaderIcon';

type TaxPlanningDocId =
    | 'salaryBreakup'
    | 'form16OrPayslips'
    | 'investmentProofs'
    | 'rentHraProof'
    | 'homeLoanCertificate'
    | 'insuranceMedicalProof'
    | 'npsDonationProof'
    | 'ais26as'
    | 'previousItr'
    | 'otherDocs';

interface TaxPlanningDocument {
    id: TaxPlanningDocId;
    label: string;
    description: string;
    required: boolean;
}

const TAX_PLANNING_DOCS: TaxPlanningDocument[] = [
    {
        id: 'salaryBreakup',
        label: 'Salary / CTC Breakup',
        description: 'Salary structure, CTC breakup, offer letter or latest compensation sheet.',
        required: true,
    },
    {
        id: 'form16OrPayslips',
        label: 'Form 16 / Salary Slips',
        description: 'Form 16, monthly payslips or employer tax projection, if available.',
        required: false,
    },
    {
        id: 'investmentProofs',
        label: 'Current Investment Proofs',
        description: '80C investments, ELSS, PPF, life insurance, tuition fee or other proofs.',
        required: false,
    },
    {
        id: 'rentHraProof',
        label: 'Rent / HRA Proof',
        description: 'Rent agreement, rent receipts, landlord PAN or HRA declaration.',
        required: false,
    },
    {
        id: 'homeLoanCertificate',
        label: 'Home Loan Certificate',
        description: 'Interest certificate, principal repayment and property details.',
        required: false,
    },
    {
        id: 'insuranceMedicalProof',
        label: 'Insurance / Medical Proofs',
        description: 'Health insurance, medical expenditure or preventive health check-up proofs.',
        required: false,
    },
    {
        id: 'npsDonationProof',
        label: 'NPS / Donation Proofs',
        description: 'NPS contribution, donation receipts, education loan or other deduction proofs.',
        required: false,
    },
    {
        id: 'ais26as',
        label: 'AIS / Form 26AS',
        description: 'Tax credit statement or AIS/TIS for cross-checking TDS and income.',
        required: false,
    },
    {
        id: 'previousItr',
        label: 'Previous Year ITR',
        description: 'Prior year ITR acknowledgement or computation, if available.',
        required: false,
    },
    {
        id: 'otherDocs',
        label: 'Other Documents',
        description: 'Any notice, RSU/ESOP statement, capital gain report or special document.',
        required: false,
    },
];

const ASSESSMENT_YEARS = ['AY 2027-28', 'AY 2026-27', 'AY 2025-26'];
const PLANNING_GOALS = [
    'Tax regime comparison',
    'Reduce TDS / monthly tax burden',
    'Plan deductions and investments',
    'HRA / rent planning',
    'Home loan tax planning',
    'Capital gain / ESOP planning',
    'Refund estimate / mismatch review',
];
const TAX_PLANNING_TIMELINE = [
    'Requirement Captured',
    'Documents Uploaded',
    'Income and Deduction Review',
    'Regime Comparison',
    'Planning Recommendations',
    'Tax Planning Summary Available',
];

const UploadCard: React.FC<{
    doc: TaxPlanningDocument;
    files: File[];
    onChange: (docId: TaxPlanningDocId, files: File[]) => void;
}> = ({ doc, files, onChange }) => (
    <motion.div
        layout
        whileHover={{ y: -3 }}
        className={`rounded-[1.35rem] border p-4 shadow-sm transition ${files.length > 0 ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${files.length > 0 ? 'bg-emerald-100 text-emerald-700' : doc.required ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {files.length > 0 ? `${files.length} uploaded` : doc.required ? 'required' : 'optional'}
                    </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">{doc.description}</p>
                {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {files.map((file, index) => (
                            <div key={`${doc.id}-${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                                <span className="truncate font-bold text-slate-700">{file.name}</span>
                                <button type="button" onClick={() => onChange(doc.id, files.filter((_, fileIndex) => fileIndex !== index))} className="ml-3 shrink-0 text-xs font-black text-red-600">
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

const TaxPlanningPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState({
        fullName: '',
        pan: '',
        ageCategory: 'Below 60',
        city: '',
        employerName: '',
        residentialStatus: 'Resident',
        mobile: '',
        email: '',
    });
    const [requirementData, setRequirementData] = useState({
        assessmentYear: ASSESSMENT_YEARS[0],
        planningGoals: [] as string[],
        urgency: 'This month',
        taxRegimePreference: 'Compare both regimes',
        notes: '',
    });
    const [salaryData, setSalaryData] = useState({
        annualSalary: '',
        basicSalary: '',
        hraReceived: '',
        bonusVariable: '',
        professionalTax: '',
        tdsDeducted: '',
        otherIncome: '',
        rsuEsopIncome: '',
    });
    const [deductionData, setDeductionData] = useState({
        section80C: '',
        section80D: '',
        npsContribution: '',
        homeLoanInterest: '',
        rentPaid: '',
        donationOrOther: '',
        currentMonthlyInvestment: '',
        plannedInvestmentBudget: '',
    });
    const [files, setFiles] = useState<Record<TaxPlanningDocId, File[]>>({
        salaryBreakup: [],
        form16OrPayslips: [],
        investmentProofs: [],
        rentHraProof: [],
        homeLoanCertificate: [],
        insuranceMedicalProof: [],
        npsDonationProof: [],
        ais26as: [],
        previousItr: [],
        otherDocs: [],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ referenceId: string; submittedAt: string } | null>(null);

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    useEffect(() => {
        if (!client) return;
        setProfileData(prev => ({
            ...prev,
            fullName: prev.fullName || client.name,
            mobile: prev.mobile || client.mobileNumber || '',
            email: prev.email || client.email || '',
        }));
    }, [client]);

    const requiredReady = TAX_PLANNING_DOCS.filter(doc => doc.required).every(doc => files[doc.id].length > 0);
    const uploadedCount = useMemo(() => (Object.values(files) as File[][]).reduce((count, fileList) => count + fileList.length, 0), [files]);
    const completion = Math.round((TAX_PLANNING_DOCS.filter(doc => files[doc.id].length > 0).length / TAX_PLANNING_DOCS.length) * 100);

    const numericSalary = Number(salaryData.annualSalary || 0);
    const totalDeclaredDeductions = [
        deductionData.section80C,
        deductionData.section80D,
        deductionData.npsContribution,
        deductionData.homeLoanInterest,
        deductionData.rentPaid,
        deductionData.donationOrOther,
    ].reduce((sum, value) => sum + Number(value || 0), 0);

    const updateFiles = (docId: TaxPlanningDocId, nextFiles: File[]) => {
        setFiles(prev => ({ ...prev, [docId]: nextFiles }));
    };

    const toggleGoal = (goal: string) => {
        setRequirementData(prev => ({
            ...prev,
            planningGoals: prev.planningGoals.includes(goal)
                ? prev.planningGoals.filter(item => item !== goal)
                : [...prev.planningGoals, goal],
        }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!profileData.fullName.trim()) return 'Please enter full name.';
            if (!profileData.mobile.trim() || !profileData.email.trim()) return 'Please enter mobile and email.';
        }
        if (step === 2) {
            if (requirementData.planningGoals.length === 0) return 'Please select at least one tax planning requirement.';
        }
        if (step === 3) {
            if (!salaryData.annualSalary.trim() || Number(salaryData.annualSalary) <= 0) return 'Please enter salary amount for the year.';
            if (!salaryData.tdsDeducted.trim()) return 'Please enter TDS deducted so far. Use 0 if none.';
        }
        if (step === 4 && !requiredReady) return 'Please upload salary / CTC breakup.';
        return '';
    };

    const goNext = () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }
        setError('');
        setStep(current => Math.min(current + 1, 5));
    };

    const handleSubmit = async () => {
        const validationMessage = validateStep();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        if (!client) {
            setError('Client context is missing. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const uploadQueue: Array<{ doc: TaxPlanningDocument; file: File; index: number }> = [];
            TAX_PLANNING_DOCS.forEach(doc => {
                files[doc.id].forEach((file, index) => uploadQueue.push({ doc, file, index }));
            });

            const profileDocuments: ProfileDocument[] = await Promise.all(uploadQueue.map(async item => ({
                type: item.index > 0 ? `tax_planning_${item.doc.id}_${item.index + 1}` : `tax_planning_${item.doc.id}`,
                fileName: item.file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(item.file),
            })));

            const extractedData = {
                profileData,
                requirementData,
                salaryData,
                deductionData,
                summary: {
                    annualSalary: numericSalary,
                    totalDeclaredDeductions,
                    needsRegimeComparison: requirementData.taxRegimePreference === 'Compare both regimes',
                },
                documentStatuses: TAX_PLANNING_DOCS.map(doc => ({
                    document: doc.label,
                    status: files[doc.id].length > 0 ? 'Uploaded' : doc.required ? 'Pending' : 'Optional',
                })),
                expectedOutputs: ['Tax planning summary', 'Old vs new regime comparison', 'Recommended deduction action list'],
                timeline: TAX_PLANNING_TIMELINE,
            };

            const serviceName = 'Tax Planning';
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
                status: 'Tax Planning Request Submitted',
                submittedAt,
                createdByType: isAgentAuthenticated ? 'agent' : 'customer',
            });

            localStorage.setItem('charteredease_submissions', JSON.stringify(existingSubmissions));
            setSubmitted({
                referenceId: `REF-${submissionId.toString().slice(-6)}`,
                submittedAt,
            });
        } catch (err: any) {
            console.error('Tax planning submission failed:', err);
            setError(`An error occurred: ${err.message || 'Unable to submit tax planning request.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading tax planning workflow...</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <section className="glass-card overflow-hidden">
                        <div className="mesh-surface p-8 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Tax Planning</p>
                            <h1 className="mt-3 font-display text-4xl font-bold">Request submitted</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                Your tax planning request is now in review. The team will prepare a regime comparison and action summary.
                            </p>
                        </div>

                        <div className="grid gap-5 p-6 md:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{submitted.referenceId}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Annual Salary</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">Rs. {numericSalary.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Files Uploaded</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{uploadedCount}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-6">
                            <h2 className="text-xl font-black text-slate-950">Status timeline</h2>
                            <div className="mt-5 grid gap-3">
                                {TAX_PLANNING_TIMELINE.map((item, index) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${index <= 1 ? 'bg-emerald-100 text-emerald-700' : index === 2 ? 'bg-blue-100 text-ease-blue' : 'bg-slate-100 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-950">{item}</p>
                                            <p className="text-sm font-bold text-slate-500">{index <= 1 ? 'Completed' : index === 2 ? 'Next step' : 'Pending'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white/70 p-6 sm:flex-row">
                            <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="blue-glow-button">
                                Back to Dashboard
                            </button>
                            <button onClick={() => { setSubmitted(null); setStep(1); }} className="soft-button bg-white text-slate-900">
                                Edit Planning Details
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
                        <button onClick={() => setPage(isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to workspace
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Tax Planning</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Plan salary tax before the year closes</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Capture income, deductions, TDS and planning goals so the team can prepare a practical old-vs-new-regime and deduction action summary.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Current profile</p>
                                <p className="mt-2 text-2xl font-bold text-white">{client.name}</p>
                                <p className="mt-1 text-xs text-blue-100">{getEntityLabel(client.entityType)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-3 sm:grid-cols-5">
                    {['Profile', 'Need', 'Income', 'Documents', 'Review'].map((label, index) => (
                        <div key={label} className={`rounded-2xl border p-3 transition ${index + 1 <= step ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-400'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${index + 1 <= step ? 'bg-ease-blue text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}</span>
                                <span className="text-xs font-black uppercase tracking-wide">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <main className="glass-card p-5 md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Step {step} of 5</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">
                            {step === 1 && 'Profile and employment details'}
                            {step === 2 && 'Planning requirement'}
                            {step === 3 && 'Salary, TDS and deductions'}
                            {step === 4 && 'Upload tax planning documents'}
                            {step === 5 && 'Review and submit'}
                        </h2>

                        <div className="mt-6">
                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        ['fullName', 'Full Name'],
                                        ['pan', 'PAN'],
                                        ['city', 'City'],
                                        ['employerName', 'Employer Name'],
                                        ['mobile', 'Mobile Number'],
                                        ['email', 'Email ID'],
                                    ].map(([key, label]) => (
                                        <label key={key}>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                            <input
                                                value={profileData[key as keyof typeof profileData]}
                                                onChange={(event) => setProfileData(prev => ({ ...prev, [key]: key === 'pan' ? event.target.value.toUpperCase() : event.target.value }))}
                                                className="input"
                                                placeholder={label}
                                                maxLength={key === 'pan' ? 10 : undefined}
                                            />
                                        </label>
                                    ))}
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Age Category</span>
                                        <select value={profileData.ageCategory} onChange={(event) => setProfileData(prev => ({ ...prev, ageCategory: event.target.value }))} className="input">
                                            <option>Below 60</option>
                                            <option>60 to 79</option>
                                            <option>80 and above</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Residential Status</span>
                                        <select value={profileData.residentialStatus} onChange={(event) => setProfileData(prev => ({ ...prev, residentialStatus: event.target.value }))} className="input">
                                            <option>Resident</option>
                                            <option>Non-resident</option>
                                            <option>Not sure</option>
                                        </select>
                                    </label>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Assessment Year</span>
                                            <select value={requirementData.assessmentYear} onChange={(event) => setRequirementData(prev => ({ ...prev, assessmentYear: event.target.value }))} className="input">
                                                {ASSESSMENT_YEARS.map(year => <option key={year}>{year}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Urgency</span>
                                            <select value={requirementData.urgency} onChange={(event) => setRequirementData(prev => ({ ...prev, urgency: event.target.value }))} className="input">
                                                <option>This week</option>
                                                <option>This month</option>
                                                <option>Before employer proof submission</option>
                                                <option>Before return filing</option>
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Tax Regime Preference</span>
                                            <select value={requirementData.taxRegimePreference} onChange={(event) => setRequirementData(prev => ({ ...prev, taxRegimePreference: event.target.value }))} className="input">
                                                <option>Compare both regimes</option>
                                                <option>New regime preferred</option>
                                                <option>Old regime preferred</option>
                                                <option>Not sure</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div>
                                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">What do you need help with?</p>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {PLANNING_GOALS.map(goal => (
                                                <button
                                                    key={goal}
                                                    type="button"
                                                    onClick={() => toggleGoal(goal)}
                                                    className={`rounded-[1.15rem] border p-4 text-left text-sm font-black transition ${requirementData.planningGoals.includes(goal) ? 'border-blue-100 bg-blue-50 text-ease-blue' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50/50'}`}
                                                >
                                                    {goal}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label>
                                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Specific Requirement / Notes</span>
                                        <textarea value={requirementData.notes} onChange={(event) => setRequirementData(prev => ({ ...prev, notes: event.target.value }))} className="input min-h-[110px]" placeholder="Example: Employer proof submission is due soon, want to reduce TDS, compare old vs new regime, etc." />
                                    </label>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {[
                                            ['annualSalary', 'Salary Amount for the Year'],
                                            ['basicSalary', 'Basic Salary'],
                                            ['hraReceived', 'HRA Received'],
                                            ['bonusVariable', 'Bonus / Variable Pay'],
                                            ['professionalTax', 'Professional Tax'],
                                            ['tdsDeducted', 'TDS Deducted So Far'],
                                            ['otherIncome', 'Other Income'],
                                            ['rsuEsopIncome', 'RSU / ESOP Income'],
                                        ].map(([key, label]) => (
                                            <label key={key}>
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                                <input type="number" min="0" value={salaryData[key as keyof typeof salaryData]} onChange={(event) => setSalaryData(prev => ({ ...prev, [key]: event.target.value }))} className="input" placeholder="Amount in Rs." />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {[
                                            ['section80C', 'Current 80C Deductions'],
                                            ['section80D', 'Current 80D / Health Insurance'],
                                            ['npsContribution', 'NPS Contribution'],
                                            ['homeLoanInterest', 'Home Loan Interest'],
                                            ['rentPaid', 'Annual Rent Paid'],
                                            ['donationOrOther', 'Donation / Other Deductions'],
                                            ['currentMonthlyInvestment', 'Current Monthly Investment'],
                                            ['plannedInvestmentBudget', 'Additional Investment Budget'],
                                        ].map(([key, label]) => (
                                            <label key={key}>
                                                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                                                <input type="number" min="0" value={deductionData[key as keyof typeof deductionData]} onChange={(event) => setDeductionData(prev => ({ ...prev, [key]: event.target.value }))} className="input" placeholder="Amount in Rs." />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {TAX_PLANNING_DOCS.map(doc => (
                                        <UploadCard key={doc.id} doc={doc} files={files[doc.id]} onChange={updateFiles} />
                                    ))}
                                </div>
                            )}

                            {step === 5 && (
                                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                                    <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-electric">Review</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-950">{profileData.fullName}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{requirementData.assessmentYear} | {requirementData.taxRegimePreference}</p>
                                        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Annual salary</span><span>Rs. {numericSalary.toLocaleString('en-IN')}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Current deductions</span><span>Rs. {totalDeclaredDeductions.toLocaleString('en-IN')}</span></div>
                                            <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Required docs</span><span className={requiredReady ? 'text-ease-green' : 'text-orange-700'}>{requiredReady ? 'Ready' : 'Pending'}</span></div>
                                        </div>
                                    </div>
                                    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-wide text-ease-blue">After submission</p>
                                        <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                                            {TAX_PLANNING_TIMELINE.map((item, index) => (
                                                <div key={item} className="flex gap-3">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-ease-blue">{index + 1}</span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <button onClick={() => setStep(current => Math.max(current - 1, 1))} disabled={step === 1} className="soft-button bg-white text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                                Previous
                            </button>
                            {step < 5 ? (
                                <button onClick={goNext} className="blue-glow-button">Continue</button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="blue-glow-button disabled:cursor-not-allowed disabled:opacity-60">
                                    {isSubmitting ? <LoaderIcon /> : 'Submit Tax Planning Request'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Planning Snapshot</p>
                                <h2 className="mt-2 text-xl font-black text-slate-950">Tax planning cockpit</h2>
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                                        <span>Document progress</span>
                                        <span>{completion}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-ease-electric transition-all duration-500" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Annual salary</span><span>Rs. {numericSalary.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Deductions entered</span><span>Rs. {totalDeclaredDeductions.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Files uploaded</span><span>{uploadedCount}</span></div>
                                    <div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span>Status after submit</span><span>Review</span></div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 bg-purple-50 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-ease-purple">Important</p>
                                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                                    This workflow collects information for expert review and planning. Final recommendations depend on documents, law updates and user-specific facts.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default TaxPlanningPage;
