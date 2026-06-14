import React, { useState, useMemo } from 'react';
import ServiceDocumentUpload from './ServiceDocumentUpload';
import { useAppContext } from '../../hooks/useAppContext';

const CompanyIncorporationPage: React.FC = () => {
    const { setPage } = useAppContext();
    const [step, setStep] = useState('incorporation_type'); // incorporation_type, individual_count, company_details, document_upload
    const [incorporationType, setIncorporationType] = useState(''); // llp, opc, private_limited, section_8
    const [numberOfIndividuals, setNumberOfIndividuals] = useState(1);
    const [proposedName1, setProposedName1] = useState('');
    const [proposedName2, setProposedName2] = useState('');
    const [companyObjectives, setCompanyObjectives] = useState('');
    const [error, setError] = useState('');

    const minIndividuals = useMemo(() => {
        return (incorporationType === 'private_limited' || incorporationType === 'llp') ? 2 : 1;
    }, [incorporationType]);

    const handleBack = () => {
        if (step === 'document_upload') {
            setStep('company_details');
        } else if (step === 'company_details') {
            backFromCompanyDetails();
        } else if (step === 'individual_count') {
            setStep('incorporation_type');
        } else {
            setPage('services');
        }
    };

    const handleIncorporationTypeSubmit = () => {
        if (incorporationType === 'opc') {
            setNumberOfIndividuals(1);
            setStep('company_details');
        } else {
            setNumberOfIndividuals(minIndividuals);
            setStep('individual_count');
        }
    };

    const handleIndividualCountSubmit = () => {
        if (numberOfIndividuals >= minIndividuals) {
            setStep('company_details');
        }
    };
    
    const handleCompanyDetailsSubmit = () => {
        if (!proposedName1.trim() || !proposedName2.trim() || !companyObjectives.trim()) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setStep('document_upload');
    };

    const backFromCompanyDetails = () => {
        if (incorporationType === 'opc') {
            setStep('incorporation_type');
        } else {
            setStep('individual_count');
        }
    }

    const individualLabel = useMemo(() => {
        switch(incorporationType) {
            case 'llp': return 'Partners';
            case 'section_8': return 'Promoters/Directors';
            case 'private_limited':
            case 'opc':
            default: return 'Directors';
        }
    }, [incorporationType]);
    
    if (step === 'incorporation_type') {
        return (
            <div className="py-12 bg-gray-50 animate-fade-in">
                <div className="container mx-auto px-4 max-w-2xl">
                    <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to Services
                    </button>
                    <h1 className="text-3xl font-bold text-center text-gray-800">Company Incorporation</h1>
                    <p className="text-center text-gray-600 mt-2 mb-8">What type of entity would you like to incorporate?</p>
                    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                        <label htmlFor="incorporationType" className="block text-lg font-semibold text-gray-700">
                            Type of Company
                        </label>
                        <select
                            id="incorporationType"
                            value={incorporationType}
                            onChange={(e) => setIncorporationType(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">Select an option...</option>
                            <option value="private_limited">Private Limited Company</option>
                            <option value="llp">Limited Liability Partnership (LLP)</option>
                            <option value="opc">One Person Company (OPC)</option>
                            <option value="section_8">Section 8 Company (NPO)</option>
                        </select>
                        <button
                            onClick={handleIncorporationTypeSubmit}
                            disabled={!incorporationType}
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 disabled:bg-ease-blue/50"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (step === 'document_upload') {
        return (
             <div>
                 <div className="container mx-auto px-4 max-w-3xl pt-8">
                    <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back to Company Details
                    </button>
                </div>
                <ServiceDocumentUpload 
                    serviceId="company-incorporation" 
                    serviceName="Company / LLP Incorporation"
                    numberOfIndividuals={numberOfIndividuals}
                    additionalData={{
                        incorporationType,
                        proposedName1,
                        proposedName2,
                        companyObjectives
                    }}
                />
            </div>
        )
    }

    if (step === 'company_details') {
        return (
            <div className="py-12 bg-gray-50 animate-fade-in">
                <div className="container mx-auto px-4 max-w-2xl">
                    <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                        <span className="mr-2">&larr;</span>Back
                    </button>
                    <h1 className="text-3xl font-bold text-center text-gray-800">Company / LLP Incorporation</h1>
                    <p className="text-center text-gray-600 mt-2 mb-8">Provide the proposed names and objectives for your new company.</p>
                    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                        <div>
                            <label htmlFor="proposedName1" className="block text-lg font-semibold text-gray-700">Proposed Name 1</label>
                            <p className="text-xs text-gray-500 mb-1">Your first preference for the company name.</p>
                            <input type="text" id="proposedName1" value={proposedName1} onChange={e => setProposedName1(e.target.value)} className="input w-full"/>
                        </div>
                        <div>
                            <label htmlFor="proposedName2" className="block text-lg font-semibold text-gray-700">Proposed Name 2</label>
                            <p className="text-xs text-gray-500 mb-1">Your second preference, in case the first is not available.</p>
                            <input type="text" id="proposedName2" value={proposedName2} onChange={e => setProposedName2(e.target.value)} className="input w-full"/>
                        </div>
                        <div>
                            <label htmlFor="companyObjectives" className="block text-lg font-semibold text-gray-700">Company Objectives</label>
                            <p className="text-xs text-gray-500 mb-1">Briefly describe the main business activities of the company.</p>
                            <textarea id="companyObjectives" value={companyObjectives} onChange={e => setCompanyObjectives(e.target.value)} rows={4} className="input w-full" placeholder="e.g., To carry on the business of software development, consultancy..."></textarea>
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <button onClick={handleCompanyDetailsSubmit} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90">
                            Continue to Document Upload
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // This is the individual_count step
    return (
         <div className="py-12 bg-gray-50 animate-fade-in">
            <div className="container mx-auto px-4 max-w-2xl">
                <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                    <span className="mr-2">&larr;</span>Back to Entity Type
                </button>
                <h1 className="text-3xl font-bold text-center text-gray-800">Company / LLP Incorporation</h1>
                <p className="text-center text-gray-600 mt-2 mb-8">Please specify the number of {individualLabel.toLowerCase()}.</p>

                <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                    <label htmlFor="individual_count" className="block text-lg font-semibold text-gray-700">
                       Number of {individualLabel}
                    </label>
                    <input
                        type="number"
                        id="individual_count"
                        value={numberOfIndividuals}
                        onChange={(e) => setNumberOfIndividuals(Math.max(minIndividuals, parseInt(e.target.value) || minIndividuals))}
                        min={minIndividuals}
                        className="input w-full"
                    />
                     <button
                        onClick={handleIndividualCountSubmit}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyIncorporationPage;