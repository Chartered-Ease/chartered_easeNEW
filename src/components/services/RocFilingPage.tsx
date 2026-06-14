import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import ServiceDocumentUpload from './ServiceDocumentUpload';

type RocFormId = 'aoc4' | 'mgt7' | 'mgt7a' | 'adt1' | 'inc20a' | 'dir12' | 'dir3' | 'dir3kyc' | 'pas3';

const FINANCIAL_YEAR_OPTIONS = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24', 'FY 2022-23'];

const ROC_FORMS: Array<{
    id: RocFormId;
    form: string;
    title: string;
    description: string;
    serviceId: string;
    serviceName: string;
    timeline: string;
    popular?: boolean;
}> = [
    {
        id: 'aoc4',
        form: 'AOC-4',
        title: 'Financial Statement Filing',
        description: 'Annual financial statements, audit report and board report filing.',
        serviceId: 'roc-aoc-4',
        serviceName: 'ROC Filing - AOC-4',
        timeline: '2-3 working days',
        popular: true,
    },
    {
        id: 'mgt7',
        form: 'MGT-7',
        title: 'Annual Return Filing',
        description: 'Annual return with shareholding, directors and meeting details.',
        serviceId: 'roc-mgt-7',
        serviceName: 'ROC Filing - MGT-7',
        timeline: '2-3 working days',
        popular: true,
    },
    {
        id: 'mgt7a',
        form: 'MGT-7A',
        title: 'OPC / Small Company Annual Return',
        description: 'Simplified annual return for OPCs and small companies.',
        serviceId: 'roc-mgt-7a',
        serviceName: 'ROC Filing - MGT-7A',
        timeline: '1-2 working days',
    },
    {
        id: 'adt1',
        form: 'ADT-1',
        title: 'Auditor Appointment',
        description: 'Auditor appointment or reappointment filing with MCA.',
        serviceId: 'roc-adt-1',
        serviceName: 'ROC Filing - ADT-1',
        timeline: '1-2 working days',
    },
    {
        id: 'inc20a',
        form: 'INC-20A',
        title: 'Commencement of Business',
        description: 'Declaration for commencement of business after incorporation.',
        serviceId: 'roc-inc-20a',
        serviceName: 'ROC Filing - INC-20A',
        timeline: '1-2 working days',
    },
    {
        id: 'dir12',
        form: 'DIR-12',
        title: 'Director Change Filing',
        description: 'Appointment, resignation or change in director details.',
        serviceId: 'roc-dir-12',
        serviceName: 'ROC Filing - DIR-12',
        timeline: '2-4 working days',
    },
    {
        id: 'dir3',
        form: 'DIR-3',
        title: 'DIN Application',
        description: 'Application for Director Identification Number with KYC documents.',
        serviceId: 'roc-dir-3',
        serviceName: 'ROC Filing - DIR-3',
        timeline: '2-4 working days',
    },
    {
        id: 'dir3kyc',
        form: 'DIR-3 KYC',
        title: 'Director KYC Filing',
        description: 'Annual DIN KYC filing with mobile/email verification and identity proof.',
        serviceId: 'roc-dir-3-kyc',
        serviceName: 'ROC Filing - DIR-3 KYC',
        timeline: '1-2 working days',
    },
    {
        id: 'pas3',
        form: 'PAS-3',
        title: 'Return of Allotment',
        description: 'Share allotment and capital issue filing.',
        serviceId: 'roc-pas-3',
        serviceName: 'ROC Filing - PAS-3',
        timeline: '2-4 working days',
    },
];

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);

const RocFilingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient } = useClientManager();
    const [selectedFormId, setSelectedFormId] = useState<RocFormId | null>(null);
    const [financialYear, setFinancialYear] = useState(FINANCIAL_YEAR_OPTIONS[0]);
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const selectedForm = ROC_FORMS.find(form => form.id === selectedFormId);

    useEffect(() => {
        if (!selectedClientId) setPage('user-dashboard');
    }, [selectedClientId, setPage]);

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
                        rocForm: selectedForm.form,
                        rocFormTitle: selectedForm.title,
                        financialYear,
                        expectedOutputs: ['ROC challan', 'SRN acknowledgement', 'Filed form copy'],
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
                        <button onClick={() => setPage('user-dashboard')} className="mb-5 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-50 transition hover:bg-white/20">
                            Back to dashboard
                        </button>
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">ROC Filing</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Choose MCA / ROC form</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                                    Start with the most used company filings like AOC-4 and MGT-7, then upload the required documents and track status from the dashboard.
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

                <div className="grid gap-5 lg:grid-cols-2">
                    {ROC_FORMS.map((form, index) => (
                        <motion.button
                            key={form.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            whileHover={{ y: -6 }}
                            onClick={() => setSelectedFormId(form.id)}
                            className={`glass-card flex min-h-[230px] flex-col p-6 text-left transition hover:border-ease-electric/30 hover:shadow-2xl ${form.popular ? 'border-blue-100' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-ease-blue">ROC Form</span>
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

export default RocFilingPage;
