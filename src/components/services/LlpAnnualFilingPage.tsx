import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { useClientManager } from '../../hooks/useProfile';
import ServiceDocumentUpload from './ServiceDocumentUpload';

type LlpAnnualFormId = 'package' | 'form11' | 'form8';

const FINANCIAL_YEAR_OPTIONS = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24', 'FY 2022-23'];

const LLP_ANNUAL_FORMS: Array<{
    id: LlpAnnualFormId;
    form: string;
    title: string;
    description: string;
    serviceId: string;
    serviceName: string;
    timeline: string;
    popular?: boolean;
    expectedOutputs: string[];
}> = [
    {
        id: 'package',
        form: 'Form 11 + Form 8',
        title: 'Complete LLP ROC Compliance',
        description: 'Combined annual return, statement of account and solvency filing workflow for LLPs.',
        serviceId: 'llp-annual-package',
        serviceName: 'LLP ROC Compliance - Form 11 and Form 8',
        timeline: '3-5 working days',
        popular: true,
        expectedOutputs: ['Form 11 acknowledgement', 'Form 8 acknowledgement', 'MCA challan / SRN'],
    },
    {
        id: 'form11',
        form: 'Form 11',
        title: 'LLP Annual Return',
        description: 'Annual return filing with partner, contribution and designated partner details.',
        serviceId: 'llp-form-11',
        serviceName: 'LLP Form 11 Annual Return',
        timeline: '2-3 working days',
        popular: true,
        expectedOutputs: ['Form 11 SRN acknowledgement', 'Filed Form 11 copy', 'MCA challan'],
    },
    {
        id: 'form8',
        form: 'Form 8',
        title: 'Statement of Account and Solvency',
        description: 'Financial statements, balance sheet, profit and loss and solvency statement filing.',
        serviceId: 'llp-form-8',
        serviceName: 'LLP Form 8 Statement of Account and Solvency',
        timeline: '2-4 working days',
        popular: true,
        expectedOutputs: ['Form 8 SRN acknowledgement', 'Filed Form 8 copy', 'MCA challan'],
    },
];

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const LlpAnnualFilingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { isAgentAuthenticated } = useAgentAuth();
    const { getClient } = useClientManager();
    const [selectedFormId, setSelectedFormId] = useState<LlpAnnualFormId | null>(null);
    const [financialYear, setFinancialYear] = useState(FINANCIAL_YEAR_OPTIONS[0]);
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const selectedForm = LLP_ANNUAL_FORMS.find(form => form.id === selectedFormId);
    const backPage = isAgentAuthenticated ? 'client-dashboard' : 'user-dashboard';

    useEffect(() => {
        if (!selectedClientId) setPage(isAgentAuthenticated ? 'client-list' : 'user-dashboard');
    }, [isAgentAuthenticated, selectedClientId, setPage]);

    if (selectedForm) {
        return (
            <div>
                <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
                    <button onClick={() => setSelectedFormId(null)} className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 shadow-sm transition hover:text-ease-blue">
                        Back to ROC forms
                    </button>
                </div>
                <ServiceDocumentUpload
                    serviceId={selectedForm.serviceId}
                    serviceName={selectedForm.serviceName}
                    additionalData={{
                        llpAnnualForm: selectedForm.form,
                        llpAnnualFormTitle: selectedForm.title,
                        financialYear,
                        expectedOutputs: selectedForm.expectedOutputs,
                        timeline: ['Documents Uploaded', 'Under Review', 'Form Preparation', 'Submitted on MCA', 'Acknowledgement Available'],
                    }}
                    entityType={client?.entityType}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface p-6 text-white md:p-8">
                        <button onClick={() => setPage(backPage)} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to dashboard
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">LLP ROC Compliance</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Choose LLP ROC compliance form</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Start with the most used LLP ROC filings, upload documents and track the filing status from the dashboard.
                                </p>
                            </div>
                            <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Filing year</p>
                                <select value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-sm font-black text-slate-900 outline-none">
                                    {FINANCIAL_YEAR_OPTIONS.map(year => <option key={year}>{year}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-3">
                    {LLP_ANNUAL_FORMS.map((form, index) => (
                        <motion.button
                            key={form.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -6 }}
                            onClick={() => setSelectedFormId(form.id)}
                            className={`glass-card flex min-h-[250px] flex-col p-6 text-left transition hover:border-ease-electric/30 hover:shadow-2xl ${form.popular ? 'border-blue-100' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">LLP Form</span>
                                {form.popular && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Most used</span>}
                            </div>
                            <h2 className="mt-5 font-display text-3xl font-bold text-slate-950">{form.form}</h2>
                            <p className="mt-1 text-base font-black text-slate-800">{form.title}</p>
                            <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{form.description}</p>
                            <div className="mt-6 flex items-center justify-between gap-3">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{form.timeline}</span>
                                <span className="inline-flex items-center justify-center gap-2 rounded-full bg-ease-green px-4 py-3 text-sm font-black text-white transition hover:bg-green-700">
                                    Get Started <ArrowIcon />
                                </span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LlpAnnualFilingPage;
