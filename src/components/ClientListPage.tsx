import React, { useState, useMemo } from 'react';
import { useClientManager } from '../hooks/useProfile';
import { useAppContext } from '../hooks/useAppContext';
import { useAgentAuth } from '../hooks/useAgentAuth';
import { LoaderIcon } from './icons/LoaderIcon';

const entityTypes = [
    { id: 'proprietorship', name: 'Proprietorship' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'llp', name: 'LLP' },
    { id: 'private_limited', name: 'Private Limited Company' },
    { id: 'huf', name: 'HUF' },
    { id: 'society', name: 'Society' },
    { id: 'trust', name: 'Trust' },
];

const ClientListPage: React.FC = () => {
    const { clients, addClient, isLoading, getClientsForAgent } = useClientManager();
    const { setPage, setSelectedClientId, selectedServiceId, flow } = useAppContext();
    const { isAgentAuthenticated, agent } = useAgentAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [entityType, setEntityType] = useState('');
    const [error, setError] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Filter clients based on visibility rules
    const displayedClients = useMemo(() => {
        if (isAgentAuthenticated && agent) {
            // Agent sees only their created or assigned clients
            return getClientsForAgent(agent.username);
        }
        // Admin (or fallback) sees all
        return clients;
    }, [clients, isAgentAuthenticated, agent, getClientsForAgent]);

    const handleSelectClient = (clientId: string) => {
        setSelectedClientId(clientId);
        if (flow === 'upload') {
            setPage('document-upload');
        } else if (selectedServiceId) {
            setPage(selectedServiceId);
        } else {
            setPage('client-dashboard');
        }
    };
    
    const resetModal = () => {
        setNewClientName('');
        setMobileNumber('');
        setEmail('');
        setEntityType('');
        setError('');
        setIsModalOpen(false);
        setIsAdding(false);
    };

    const handleAddClient = () => {
        if (!newClientName.trim() || !mobileNumber.trim() || !email.trim() || !entityType) {
            setError('All fields are required.');
            return;
        }
        if (mobileNumber.trim().length !== 10 || !/^\d+$/.test(mobileNumber.trim())) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setIsAdding(true);
        setTimeout(() => {
            // If added by an agent, mark authorship and assignment
            const creator = isAgentAuthenticated && agent 
                ? { type: 'agent' as const, id: agent.username } 
                : { type: 'admin' as const, id: 'admin' };
            
            const assignedAgent = isAgentAuthenticated && agent ? agent.username : null;

            const newClient = addClient(
                newClientName, 
                mobileNumber, 
                email, 
                entityType,
                creator,
                assignedAgent
            );
            
            resetModal();
            handleSelectClient(newClient.id);
        }, 500);
    };

    if (isLoading) {
        return <div className="text-center p-12">Loading clients...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <button onClick={() => setPage('agent-dashboard')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                <span className="mr-2">&larr;</span>Back to Dashboard
            </button>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Your Clients</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-ease-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-ease-green/90 transition-all"
                >
                    + Add New Client
                </button>
            </div>

            {displayedClients.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700">No clients found.</h2>
                    <p className="text-gray-500 mt-2">
                        {isAgentAuthenticated ? "You only see clients created by you or assigned to you." : "No clients in the system."}
                    </p>
                    <p className="text-gray-500 mt-2">Click "Add New Client" to add your first client.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => handleSelectClient(client.id)}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-ease-blue"
                        >
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
                                {client.createdBy?.type === 'customer' && (
                                     <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">Direct Customer</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{client.mobileNumber}</p>
                            <p className="text-sm text-gray-500">{client.profiles.length} application(s)</p>
                            {client.assignedAgentId && (
                                <p className="text-xs text-green-600 mt-3 font-medium">✓ Assigned to You</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Add New Client</h2>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 block">Client Name</label>
                            <input
                                type="text"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="e.g., ABC Enterprises"
                                className="input w-full mt-1"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block">Mobile Number</label>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit mobile number"
                                className="input w-full mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block">Email ID</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="client@example.com"
                                className="input w-full mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block">Entity Type</label>
                            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="input w-full mt-1">
                                <option value="">Select Entity Type</option>
                                {entityTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                            </select>
                        </div>
                        
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end space-x-3 pt-2">
                            <button onClick={resetModal} className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                            <button
                                onClick={handleAddClient}
                                disabled={isAdding || !newClientName.trim() || !mobileNumber.trim() || !email.trim() || !entityType}
                                className="px-4 py-2 rounded-md text-white bg-ease-blue hover:bg-ease-blue/90 disabled:bg-ease-blue/50 flex items-center"
                            >
                                {isAdding && <LoaderIcon />}
                                Add Client
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientListPage;