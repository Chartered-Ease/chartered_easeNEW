
import React, { useState, useEffect, useMemo } from 'react';
import { useAgentAuth } from '../../hooks/useAgentAuth';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import { CharteredEaseLogo } from '../icons/EaseIndiaLogo';
import { UsersIcon } from '../icons/UsersIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleSolidIcon } from '../icons/CheckCircleSolidIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';

// Icons
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const AddClientIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const AddServiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const TrackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// Components from ClientListPage (embedded)
const entityTypes = [
    { id: 'proprietorship', name: 'Proprietorship' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'llp', name: 'LLP' },
    { id: 'private_limited', name: 'Private Limited Company' },
    { id: 'huf', name: 'HUF' },
    { id: 'society', name: 'Society' },
    { id: 'trust', name: 'Trust' },
];

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

const QuickActionCard = ({ title, description, icon, onClick, highlight }: { title: string, description?: string, icon: React.ReactNode, onClick: () => void, highlight?: boolean }) => (
    <button onClick={onClick} className={`text-center p-6 rounded-lg transition-all group flex flex-col items-center justify-center h-full shadow-sm hover:shadow-md ${highlight ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' : 'bg-white hover:bg-gray-50 border border-transparent'}`}>
        <div className={`flex items-center justify-center h-12 w-12 rounded-full mx-auto transition-all mb-3 ${highlight ? 'bg-white text-ease-blue shadow-sm' : 'bg-gray-100 text-gray-600 group-hover:bg-ease-blue group-hover:text-white'}`}>
            {icon}
        </div>
        <p className={`text-sm font-bold ${highlight ? 'text-ease-blue' : 'text-gray-800'}`}>{title}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </button>
);

const PartnerDashboardPage: React.FC = () => {
    const { agent, logout } = useAgentAuth();
    const { setPage, setSelectedClientId, setFlow } = useAppContext();
    const { getClientsForAgent, addClient } = useClientManager();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [activeView, setActiveView] = useState<'dashboard' | 'clients'>('dashboard');
    
    // Client Addition State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [entityType, setEntityType] = useState('');
    
    // GST Return Flow State
    const [isSelectingForGstReturn, setIsSelectingForGstReturn] = useState(false);

    useEffect(() => {
        const storedSubmissions = localStorage.getItem('charteredease_submissions');
        if (storedSubmissions) {
            setSubmissions(JSON.parse(storedSubmissions));
        }
    }, []);

    const agentClients = useMemo(() => {
        return agent ? getClientsForAgent(agent.username) : [];
    }, [agent, getClientsForAgent]);

    const stats = useMemo(() => {
        const clientIds = new Set(agentClients.map(c => c.id));
        const agentSubmissions = submissions.filter(s => clientIds.has(s.clientId));
        
        return {
            totalClients: agentClients.length,
            totalServices: agentSubmissions.length,
            activeServices: agentSubmissions.filter(s => s.status !== 'Completed').length,
            completedServices: agentSubmissions.filter(s => s.status === 'Completed').length,
        };
    }, [agentClients, submissions]);

    // --- HANDLERS ---

    const handleClientClick = (clientId: string) => {
        setSelectedClientId(clientId);
        if (isSelectingForGstReturn) {
            // If in GST Return mode, go to GST Return Page
            setPage('gst-return-filing');
            setIsSelectingForGstReturn(false); // Reset mode
        } else {
            // Default: Manage Client Dashboard
            setPage('client-dashboard');
        }
    };

    const handleStartGstReturn = () => {
        setActiveView('clients');
        setIsSelectingForGstReturn(true);
    };

    const handleStartNewClient = () => {
        setActiveView('clients');
        setIsModalOpen(true);
    }

    const handleAddClient = () => {
        if (!newClientName || !mobileNumber || !entityType) return;
        const creator = { type: 'agent' as const, id: agent!.username };
        const assignedAgent = agent!.username;
        addClient(newClientName, mobileNumber, email, entityType, creator, assignedAgent);
        setIsModalOpen(false);
        setNewClientName(''); setMobileNumber(''); setEmail(''); setEntityType('');
    };

    const resetView = (view: 'dashboard' | 'clients') => {
        setActiveView(view);
        setIsSelectingForGstReturn(false);
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col flex-shrink-0 z-10">
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <div className="flex items-center space-x-2 text-ease-blue font-bold text-xl">
                        <CharteredEaseLogo className="h-8 w-8" />
                        <span>Partner Portal</span>
                    </div>
                </div>
                
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                            {agent?.username.slice(0,1).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{agent?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{agent?.username}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    <button onClick={() => resetView('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${activeView === 'dashboard' ? 'bg-ease-blue/10 text-ease-blue' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <DashboardIcon /> <span>Dashboard</span>
                    </button>
                    <button onClick={() => resetView('clients')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${activeView === 'clients' ? 'bg-ease-blue/10 text-ease-blue' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <UsersIcon /> <span>My Clients</span>
                    </button>
                    <button onClick={() => setPage('track-status')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <ClipboardListIcon /> <span>Track Status</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center space-x-2 text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <LogoutIcon /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                
                {activeView === 'dashboard' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                            <p className="text-sm text-gray-500">Manage your clients and services efficiently.</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Clients" value={stats.totalClients} icon={<UsersIcon />} color="bg-blue-100 text-ease-blue" />
                            <StatCard title="Services Filed" value={stats.totalServices} icon={<BriefcaseIcon />} color="bg-orange-100 text-ease-saffron" />
                            <StatCard title="In Progress" value={stats.activeServices} icon={<ClockIcon />} color="bg-yellow-100 text-yellow-600" />
                            <StatCard title="Completed" value={stats.completedServices} icon={<CheckCircleSolidIcon />} color="bg-green-100 text-ease-green" />
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Start a New Task</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <QuickActionCard 
                                    title="GST Return Filing" 
                                    description="Monthly/Quarterly Returns"
                                    icon={<FileTextIcon />} 
                                    onClick={handleStartGstReturn} 
                                    highlight={true}
                                />
                                <QuickActionCard 
                                    title="Add New Client" 
                                    icon={<AddClientIcon />} 
                                    onClick={handleStartNewClient} 
                                />
                                <QuickActionCard 
                                    title="New Service Application" 
                                    description="GST, Udyam, Shop Act etc."
                                    icon={<AddServiceIcon />} 
                                    onClick={() => { setFlow('service'); setPage('client-list'); }} 
                                />
                                <QuickActionCard 
                                    title="Upload Documents" 
                                    icon={<UploadIcon />} 
                                    onClick={() => { setFlow('upload'); setPage('client-list'); }} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'clients' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">My Clients</h1>
                                {isSelectingForGstReturn && <p className="text-ease-blue font-semibold mt-1">Select a client to file GST Return &rarr;</p>}
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="bg-ease-green text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-ease-green/90">
                                + Add New Client
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agentClients.map(client => (
                                <div 
                                    key={client.id} 
                                    onClick={() => handleClientClick(client.id)}
                                    className={`bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[180px] group ${isSelectingForGstReturn ? 'ring-2 ring-ease-blue ring-offset-2' : 'border-gray-200'}`}
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-ease-blue transition-colors">{client.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{client.mobileNumber}</p>
                                        <span className="inline-block mt-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{entityTypes.find(e => e.id === client.entityType)?.name || client.entityType}</span>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="text-xs text-gray-400">
                                            {client.documents?.length || 0} Documents<br/>
                                            {client.profiles?.length || 0} Profiles
                                        </div>
                                        <button className="text-sm font-semibold text-ease-blue hover:underline">
                                            {isSelectingForGstReturn ? 'Select for GST' : 'Manage Client'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {agentClients.length === 0 && (
                                <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500">You don't have any clients yet.</p>
                                    <button onClick={() => setIsModalOpen(true)} className="mt-2 text-ease-blue font-semibold hover:underline">Add your first client</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>

            {/* Add Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Add New Client</h2>
                        <input type="text" placeholder="Client Name" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="input w-full"/>
                        <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="input w-full"/>
                        <input type="email" placeholder="Email (Optional)" value={email} onChange={e => setEmail(e.target.value)} className="input w-full"/>
                        <select value={entityType} onChange={e => setEntityType(e.target.value)} className="input w-full">
                            <option value="">Select Entity Type</option>
                            {entityTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                            <button onClick={handleAddClient} className="px-4 py-2 rounded bg-ease-blue text-white">Add Client</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDashboardPage;
