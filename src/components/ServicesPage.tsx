
import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useClientManager } from '../hooks/useProfile';

// Service Definitions with Category tags for easier filtering
const allServices = [
    { id: 'gst-service-selection', name: 'GST Registration & Returns', description: 'End-to-end GST registration, monthly/quarterly returns, and compliance.', categories: ['business', 'proprietorship', 'partnership', 'company', 'llp'] },
    { id: 'company-incorporation', name: 'Company / LLP Incorporation', description: 'Start your business with guided incorporation and documentation support.', categories: ['company', 'llp', 'partnership'] },
    { id: 'mca-compliances', name: 'MCA Compliances', description: 'Annual and event-based ROC compliances handled professionally.', categories: ['company', 'llp'] },
    { id: 'pf-esic', name: 'PF & ESIC Registration and Returns', description: 'Employee-related statutory registrations and periodic filings.', categories: ['business', 'company', 'llp', 'partnership', 'proprietorship'] },
    { id: 'itr-filing', name: 'Income Tax Return (Business)', description: 'Tax filing for proprietorships, firms, and companies.', categories: ['business', 'proprietorship', 'partnership', 'company', 'llp'] },
    { id: 'itr-filing-salaried', name: 'Income Tax Return (Salaried)', description: 'Upload salary documents (Form 16), investment proofs, and file your return.', categories: ['individual'] },
    { id: 'shop-act', name: 'Shop Act Registration', description: 'State-specific Shop & Establishment license.', categories: ['proprietorship', 'partnership', 'company', 'llp', 'business'] },
    { id: 'udyam-registration', name: 'Udyam Registration (MSME)', description: 'Get MSME certificate to avail government benefits.', categories: ['proprietorship', 'partnership', 'company', 'llp', 'business'] },
    { id: 'project-report-for-loan', name: 'Project Report for Loan', description: 'Detailed project reports for bank loans and funding.', categories: ['proprietorship', 'partnership', 'company', 'llp', 'business'] },
];

const ServicesPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isAgentAuthenticated } = useAgentAuth();
  const { setPage, selectedClientId, setSelectedClientId, selectedProfileId } = useAppContext();
  const { getClient } = useClientManager();

  // Ensure client context is set for direct customers
  useEffect(() => {
    if (isAuthenticated && user?.clientId && !selectedClientId) {
        setSelectedClientId(user.clientId);
    }
  }, [isAuthenticated, user, selectedClientId, setSelectedClientId]);

  const client = selectedClientId ? getClient(selectedClientId) : null;
  const profile = client && selectedProfileId ? client.profiles.find(p => p.id === selectedProfileId) : null;

  const filteredServices = useMemo(() => {
    if (!client) return []; // Should not happen if redirected correctly

    const type = client.entityType; // 'proprietorship', 'individual', 'private_limited', 'llp', 'partnership', 'huf'

    return allServices.filter(service => {
        // Special Case: ITR handling
        if (service.id === 'itr-filing-salaried') {
            return type === 'individual';
        }
        if (service.id === 'itr-filing') {
            return type !== 'individual';
        }

        // Exclude Company Incorporation/MCA for Proprietorships/Individuals
        if (type === 'proprietorship' || type === 'individual') {
            if (service.id === 'company-incorporation' || service.id === 'mca-compliances') return false;
        }

        // Include based on category tags matching entity type or general 'business' tag
        return service.categories.includes(type) || (type !== 'individual' && service.categories.includes('business'));
    });

  }, [client]);

  const handleStartService = (serviceId: string) => {
    // Handle services that don't have a dedicated page in this demo yet
    if (serviceId === 'mca-compliances' || serviceId === 'pf-esic') {
        setPage('contact');
    } else if (serviceId === 'itr-filing-salaried') {
        setPage('itr-filing'); // Reuses the ITR page logic
    } else {
        setPage(serviceId);
    }
  };

  const handleBack = () => {
    if (isAgentAuthenticated) {
      setPage('client-dashboard');
    } else if (isAuthenticated) {
      setPage('user-dashboard');
    } else {
      setPage('home'); // Fallback
    }
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="text-center">
            <button onClick={handleBack} className="text-sm text-ease-blue hover:underline mb-2">&larr; Back to Dashboard</button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Select a Service</h1>
            <p className="mt-2 text-gray-600">
             Applying for <span className="font-semibold text-ease-blue">{client?.name}</span> ({client?.entityType}).
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {filteredServices.map((service) => {
            return (
                <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all">
                <h3 className="text-xl font-bold text-ease-blue">{service.name}</h3>
                <p className="text-gray-600 mt-2 flex-grow">{service.description}</p>
                <button
                    onClick={() => handleStartService(service.id)}
                    className="w-full mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-green hover:bg-ease-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-green"
                >
                    Get Started
                </button>
                </div>
            );
          })}
        </div>
        
        {filteredServices.length === 0 && (
            <div className="text-center py-10">
                <p className="text-gray-500">No services available for this entity type.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
