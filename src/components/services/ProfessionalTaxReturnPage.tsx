import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import ServiceDocumentUpload from './ServiceDocumentUpload';

type PtFlow = 'employer-return' | 'self-employed-enrollment';

const FlowCard = ({
    title,
    subtitle,
    onClick,
}: {
    title: string;
    subtitle?: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-ease-blue/30 transition-all p-6 text-left flex flex-col h-full min-h-48"
    >
        <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <span className="mt-6 inline-flex justify-center rounded-md bg-ease-green px-4 py-2 text-sm font-semibold text-white">
            Start Workflow
        </span>
    </button>
);

const ProfessionalTaxReturnPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient } = useClientManager();
    const [flow, setFlow] = useState<PtFlow | null>(null);
    const client = selectedClientId ? getClient(selectedClientId) : null;

    if (flow === 'employer-return') {
        return (
            <div>
                <div className="container mx-auto px-4 max-w-3xl pt-8">
                    <button onClick={() => setFlow(null)} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to Professional Tax Options
                    </button>
                </div>
                <ServiceDocumentUpload
                    serviceId="pt-return-filing"
                    serviceName="Professional Tax Return Filing (Employer)"
                    additionalData={{
                        professionalTaxFlow: 'Employer Return',
                        systemGenerated: ['PT Return Acknowledgement', 'Challan Receipt', 'Working Sheet'],
                    }}
                />
            </div>
        );
    }

    if (flow === 'self-employed-enrollment') {
        return (
            <div>
                <div className="container mx-auto px-4 max-w-3xl pt-8">
                    <button onClick={() => setFlow(null)} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to Professional Tax Options
                    </button>
                </div>
                <ServiceDocumentUpload
                    serviceId="pt-enrollment"
                    serviceName="Professional Tax Enrollment (Self Employed)"
                    additionalData={{
                        professionalTaxFlow: 'Self Employed Enrollment',
                        mobileNumber: client?.mobileNumber || '',
                        email: client?.email || '',
                        systemGenerated: ['PTEC Certificate'],
                    }}
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

                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Professional Tax Return</h1>
                    <p className="text-gray-600 mt-2">Select the professional tax workflow you want to start.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <FlowCard
                        title="PTRC Return Filing"
                        subtitle="Employer Return"
                        onClick={() => setFlow('employer-return')}
                    />

                    <FlowCard
                        title="Professional Tax Enrollment"
                        onClick={() => setFlow('self-employed-enrollment')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfessionalTaxReturnPage;
