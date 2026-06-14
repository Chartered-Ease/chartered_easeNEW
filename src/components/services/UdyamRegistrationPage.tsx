import React from 'react';
import ServiceDocumentUpload from './ServiceDocumentUpload';
import { useAppContext } from '../../hooks/useAppContext';

const UdyamRegistrationPage: React.FC = () => {
    const { setPage } = useAppContext();
    
    return (
        <div>
            <div className="container mx-auto px-4 max-w-3xl pt-8">
                 <button onClick={() => setPage('services')} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                    <span className="mr-2">&larr;</span>Back to Services
                </button>
            </div>
            <ServiceDocumentUpload 
                serviceId="udyam-registration" 
                serviceName="Udyam (MSME) Registration"
            />
        </div>
    );
};

export default UdyamRegistrationPage;