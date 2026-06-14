import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import ServiceDocumentUpload from './ServiceDocumentUpload';

type TdsFlow = '24q' | '26q' | '27q' | '27eq';

const FINANCIAL_YEAR_OPTIONS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25', 'FY 2023-24'];

const QUARTER_OPTIONS = [
    'Q1 (Apr - Jun)',
    'Q2 (Jul - Sep)',
    'Q3 (Oct - Dec)',
    'Q4 (Jan - Mar)',
];

const TDS_RETURN_FORMS: Array<{
    id: TdsFlow;
    form: string;
    title: string;
    serviceId: string;
    serviceName: string;
}> = [
    {
        id: '24q',
        form: 'Form 24Q',
        title: 'Salary TDS Return',
        serviceId: 'tds-form-24q',
        serviceName: 'TDS Filing - Form 24Q',
    },
    {
        id: '26q',
        form: 'Form 26Q',
        title: 'Non-Salary Resident TDS Return',
        serviceId: 'tds-form-26q',
        serviceName: 'TDS Filing - Form 26Q',
    },
    {
        id: '27q',
        form: 'Form 27Q',
        title: 'Non-Resident / NRI TDS Return',
        serviceId: 'tds-form-27q',
        serviceName: 'TDS Filing - Form 27Q',
    },
    {
        id: '27eq',
        form: 'Form 27EQ',
        title: 'TCS Return',
        serviceId: 'tds-form-27eq',
        serviceName: 'TDS/TCS Filing - Form 27EQ',
    },
];

const TdsFilingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient } = useClientManager();
    const [selectedFlow, setSelectedFlow] = useState<TdsFlow | null>(null);
    const [financialYear, setFinancialYear] = useState(FINANCIAL_YEAR_OPTIONS[0]);
    const [filingQuarter, setFilingQuarter] = useState(QUARTER_OPTIONS[0]);
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const selectedForm = TDS_RETURN_FORMS.find(form => form.id === selectedFlow);

    useEffect(() => {
        if (!selectedClientId) setPage('user-dashboard');
    }, [selectedClientId, setPage]);

    if (selectedForm) {
        return (
            <div>
                <div className="container mx-auto px-4 max-w-3xl pt-8">
                    <button onClick={() => setSelectedFlow(null)} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to TDS Return Forms
                    </button>
                </div>
                <ServiceDocumentUpload
                    serviceId={selectedForm.serviceId}
                    serviceName={selectedForm.serviceName}
                    additionalData={{
                        tdsReturnForm: selectedForm.form,
                        tdsReturnType: selectedForm.title,
                        financialYear,
                        filingQuarter,
                    }}
                    entityType={client?.entityType}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <button onClick={() => setPage('services')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                    <span className="mr-2">&larr;</span>Back to Services
                </button>

                <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
                    <div className="text-center lg:pl-32">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">TDS Filing</h1>
                        <p className="text-gray-600 mt-2">
                            {client ? `Select the TDS return form for ${client.name}.` : 'Select the TDS return form to continue.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-ease-blue">Filing Period</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Financial Year</span>
                                <select
                                    value={financialYear}
                                    onChange={(event) => setFinancialYear(event.target.value)}
                                    className="input w-full text-sm"
                                >
                                    {FINANCIAL_YEAR_OPTIONS.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Quarter of Filing</span>
                                <select
                                    value={filingQuarter}
                                    onChange={(event) => setFilingQuarter(event.target.value)}
                                    className="input w-full text-sm"
                                >
                                    {QUARTER_OPTIONS.map(quarter => (
                                        <option key={quarter} value={quarter}>{quarter}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {TDS_RETURN_FORMS.map(form => (
                        <button
                            key={form.id}
                            onClick={() => setSelectedFlow(form.id)}
                            className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-ease-blue/30 transition-all p-6 text-left flex flex-col min-h-44"
                        >
                            <div className="flex-grow">
                                <p className="text-xs font-bold uppercase tracking-wide text-ease-blue">TDS Return Form</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">{form.form}</h3>
                                <p className="text-sm text-gray-500 mt-2">{form.title}</p>
                            </div>
                            <span className="mt-6 inline-flex justify-center rounded-md bg-ease-green px-4 py-2 text-sm font-semibold text-white">
                                Start Workflow
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TdsFilingPage;
