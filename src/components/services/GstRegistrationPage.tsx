import React, { useState, useEffect, useMemo } from 'react';
import ServiceDocumentUpload from './ServiceDocumentUpload';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import { serviceDocuments } from '../../data/documentConfig';

const GstRegistrationPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient } = useClientManager();
    
    const client = selectedClientId ? getClient(selectedClientId) : null;
    const entityType = client?.entityType;

    const individualConfig = useMemo(() => {
        return entityType ? serviceDocuments['gst-registration'][entityType]?.individual : null;
    }, [entityType]);

    const [step, setStep] = useState(individualConfig ? 'individual_count' : 'document_upload');
    const [numberOfIndividuals, setNumberOfIndividuals] = useState(1);

    useEffect(() => {
        if (!client) {
            setPage('client-list');
        } else {
            setStep(individualConfig ? 'individual_count' : 'document_upload');
        }
    }, [client, individualConfig, setPage]);

    const handleBack = () => {
        if (step === 'document_upload' && individualConfig) {
            setStep('individual_count');
        } else {
            setPage('gst-service-selection');
        }
    };

    if (!client || !entityType) {
        return <div className="text-center p-12">Loading client data...</div>;
    }
    
    if (step === 'document_upload') {
        return (
            <div>
                 <div className="container mx-auto px-4 max-w-3xl pt-8">
                    <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back
                    </button>
                </div>
                <ServiceDocumentUpload 
                    serviceId="gst-registration" 
                    serviceName="GST Registration"
                    numberOfIndividuals={individualConfig ? numberOfIndividuals : undefined}
                />
            </div>
        )
    }

    if (step === 'individual_count' && individualConfig) {
        return (
             <div className="py-12 bg-gray-50 animate-fade-in">
                <div className="container mx-auto px-4 max-w-2xl">
                    <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to Service Selection
                    </button>
                    <h1 className="text-3xl font-bold text-center text-gray-800">GST Registration</h1>
                    <p className="text-center text-gray-600 mt-2 mb-8">Please specify the number of {individualConfig.label}s.</p>

                    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                        <label htmlFor="individual_count" className="block text-lg font-semibold text-gray-700">
                           Number of {individualConfig.label}s
                        </label>
                        <input
                            type="number"
                            id="individual_count"
                            value={numberOfIndividuals}
                            onChange={(e) => setNumberOfIndividuals(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            className="input w-full"
                        />
                         <button
                            onClick={() => setStep('document_upload')}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null; // Should not be reached
};

export default GstRegistrationPage;