import React from 'react';
import ServiceDocumentUpload from './ServiceDocumentUpload';
import { useAppContext } from '../../hooks/useAppContext';

const ShopActRegistrationPage: React.FC = () => {
    const { setPage } = useAppContext();
    
    return (
        <div>
            <div className="container mx-auto px-4 max-w-3xl pt-8">
                <button onClick={() => setPage('services')} className="text-sm text-gray-600 hover:text-ease-blue mb-4 inline-flex items-center">
                    <span className="mr-2">&larr;</span>Back to Services
                </button>
            </div>
            <ServiceDocumentUpload 
                serviceId="shop-act" 
                serviceName="Shop Act License"
            />
        </div>
    );
};

export default ShopActRegistrationPage;