
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useClientManager, Document, downloadFile } from '../hooks/useProfile';
import { useAssociateManager } from '../hooks/useAssociateManager';
import { LoaderIcon } from './icons/LoaderIcon';

// Icons
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const SwitchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;

const statusColors: { [key: string]: string } = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Awaiting Docs': 'bg-orange-100 text-orange-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Assigned to Associate': 'bg-indigo-100 text-indigo-800',
    'Under Review': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-800',
    'Filed': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Scheduled': 'bg-teal-100 text-teal-800',
    'Nil Return – Under Processing': 'bg-blue-100 text-blue-800',
};

interface Application {
    id: number;
    serviceName: string;
    clientProfileName: string;
    referenceId: string;
    status: string;
    submittedAt: string;
    documents: Document[];
    assignedAssociateName: string | null;
    outputDocuments: Document[];
    filingType?: 'basic' | 'expert';
    bookedSlot?: { date: string; time: string; associateName: string };
    extractedData?: any;
}

const CustomerDashboardPage: React.FC = () => {
    const { user, switchEntity } = useAuth();
    const { setPage, setSelectedClientId, setSelectedProfileId } = useAppContext();
    const { getClient, findClientsByMobile } = useClientManager();
    const { tasks, staff: associates } = useAssociateManager(); 

    const client = user?.clientId ? getClient(user.clientId) : null;
    const allUserEntities = user ? findClientsByMobile(user.mobileNumber) : [];

    const [view, setView] = useState<'list' | 'details'>('list');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [showEntitySwitcher, setShowEntitySwitcher] = useState(false);
    
    // Salaried ITR View State
    const [selectedAY, setSelectedAY] = useState('AY 2024-25');

    const isSalaried = client?.entityType === 'individual';

    // Fetch and process applications
    useEffect(() => {
        if (client) {
            const allSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
            const mySubmissions = allSubmissions.filter((sub: any) => sub.clientId === client.id);

            const processedApps = mySubmissions.map((sub: any) => {
                const task = tasks.find(t => t.submissionId === sub.id);
                const associate = task ? associates.find(a => a.id === task.associateId) : null;
                
                let displayStatus = sub.status;
                if (task) {
                     if (task.status !== 'Pending') displayStatus = task.status;
                     else if (task.filingType === 'expert') displayStatus = 'Scheduled';
                     else displayStatus = 'Assigned to Associate';
                }

                return {
                    id: sub.id,
                    serviceName: sub.service,
                    clientProfileName: sub.profileName,
                    referenceId: `REF-${sub.id.toString().slice(-6)}`,
                    status: displayStatus,
                    submittedAt: sub.submittedAt,
                    documents: sub.documents || [],
                    assignedAssociateName: associate ? associate.name : null,
                    outputDocuments: task?.acknowledgements || [],
                    filingType: sub.filingType,
                    bookedSlot: sub.bookedSlot,
                    extractedData: sub.extractedData
                };
            }).sort((a: Application, b: Application) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

            setApplications(processedApps);
        }
    }, [client, tasks, associates]);


    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
        setView('details');
    };

    const handleBackToList = () => {
        setSelectedApp(null);
        setView('list');
    };

    const handleApplyForNewService = () => {
        if (client) {
            setSelectedClientId(client.id);
            setSelectedProfileId(null);
            setPage('services');
        }
    };
    
    const handleDownload = (fileName: string, fileData?: string) => {
        downloadFile(fileName, fileData);
    }

    const handleDownloadAll = (app: Application) => {
        app.outputDocuments.forEach(doc => handleDownload(doc.fileName, doc.fileData));
    }

    const handleSwitchEntity = (clientId: string) => {
        switchEntity(clientId);
        setShowEntitySwitcher(false);
    };

    const handleAddEntity = () => {
        setPage('entity-onboarding');
    };
    
    const getAcknowledgementLabel = (app: Application) => {
        const s = app.serviceName.toLowerCase();
        if (s.includes('income tax') || s.includes('itr')) return 'ITR-V Acknowledgement';
        if (s.includes('gst return')) return 'GST Filing Receipt';
        if (s.includes('gst registration')) return 'GST Registration Certificate';
        if (s.includes('incorporation')) return 'Certificate of Incorporation';
        if (s.includes('shop act')) return 'Shop Act License';
        if (s.includes('udyam')) return 'Udyam Certificate';
        if (s.includes('project report')) return 'Project Report PDF';
        if (s.includes('194-ia')) return 'Form 26QB Acknowledgement';
        return 'Service Output Document';
    };
    
    if (!client) {
        return <div className="p-12 text-center">Loading profile...</div>;
    }

    // --- DETAILS VIEW ---
    if (view === 'details' && selectedApp) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <button onClick={handleBackToList} className="flex items-center text-sm text-gray-600 hover:text-ease-blue mb-6">
                    <BackArrowIcon /> <span className="ml-2">Back to Dashboard</span>
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                                {selectedApp.serviceName}
                                {selectedApp.filingType === 'expert' && <span className="ml-2 bg-ease-blue text-white text-xs px-2 py-0.5 rounded-full">Expert Assisted</span>}
                            </h1>
                            <p className="text-gray-500 mt-1">Reference ID: <span className="font-mono font-medium text-gray-700">{selectedApp.referenceId}</span></p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[selectedApp.status] || 'bg-gray-100'}`}>
                            {selectedApp.status}
                        </span>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Expert Slot Info */}
                        {selectedApp.filingType === 'expert' && selectedApp.bookedSlot && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                                <div className="bg-white p-2 rounded-full text-ease-blue mr-4"><VideoIcon /></div>
                                <div>
                                    <h3 className="font-bold text-blue-900">Scheduled Expert Session</h3>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Your session is confirmed with <span className="font-semibold">{selectedApp.bookedSlot.associateName}</span>.
                                    </p>
                                    <div className="mt-2 text-sm font-medium text-blue-900 bg-blue-100 inline-block px-3 py-1 rounded">
                                        {selectedApp.bookedSlot.date} | {selectedApp.bookedSlot.time}
                                    </div>
                                    <div className="mt-3">
                                         <button className="text-xs bg-ease-blue text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                                             Join Meeting (Link active 10 min before)
                                         </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Application Details</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-600">Submitted On:</span> <span className="font-medium">{selectedApp.submittedAt}</span></p>
                                    <p><span className="text-gray-600">Profile Used:</span> <span className="font-medium">{selectedApp.clientProfileName}</span></p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Processing Info</h3>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="text-gray-600">Assigned Associate:</span>{' '}
                                        <span className="font-medium">{selectedApp.assignedAssociateName || 'Pending Assignment'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Uploaded Documents</h3>
                            {selectedApp.documents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedApp.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center">
                                                <FileIcon />
                                                <div className="ml-3 overflow-hidden">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                                                    <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDownload(doc.fileName, doc.fileData)} className="text-gray-400 hover:text-ease-blue p-1"><DownloadIcon /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
                            )}
                        </div>

                        {(selectedApp.status === 'Completed' || selectedApp.status === 'Filed' || selectedApp.outputDocuments.length > 0) && (
                            <div className="border-t pt-6">
                                <h3 className="text-sm font-bold text-ease-green uppercase tracking-wider mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Acknowledgements & Downloads
                                </h3>
                                
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    {selectedApp.outputDocuments.length > 0 ? (
                                         <div className="space-y-3">
                                            {selectedApp.outputDocuments.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-4 rounded shadow-sm border border-green-100">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="bg-green-100 p-2 rounded text-green-700">
                                                            <FileIcon />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-gray-800 block">{getAcknowledgementLabel(selectedApp)}</span>
                                                            <span className="text-xs text-gray-500">File: {doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDownload(doc.fileName, doc.fileData)}
                                                        className="text-white bg-ease-green hover:bg-green-700 text-sm font-semibold flex items-center px-4 py-2 rounded transition-colors shadow-sm"
                                                    >
                                                        <DownloadIcon /> <span className="ml-1">Download</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 text-center py-4">Filing marked complete. Acknowledgement documents will appear here shortly.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- SALARIED INDIVIDUAL DASHBOARD ---
    if (isSalaried) {
        const itrApp = applications.find(a => a.serviceName === 'Income Tax Filing' && a.extractedData?.assessmentYear === selectedAY);
        const tdsPropertyApp = applications.find(a => a.serviceName.includes('TDS on Property'));

        return (
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Hello, {client.name}</h1>
                        <div className="relative mt-2">
                            <button 
                                onClick={() => setShowEntitySwitcher(!showEntitySwitcher)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                            >
                                <span>Profile: <strong>{client.entityType}</strong></span>
                                <SwitchIcon />
                            </button>
                            {showEntitySwitcher && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-2 animate-fade-in-up">
                                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Switch Profile</p>
                                    {allUserEntities.map(entity => (
                                        <button
                                            key={entity.id}
                                            onClick={() => handleSwitchEntity(entity.id)}
                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center ${entity.id === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                        >
                                            <span className="truncate text-sm font-medium">{entity.name}</span>
                                            {entity.id === client.id && <span className="h-2 w-2 rounded-full bg-blue-600"></span>}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                        <button onClick={handleAddEntity} className="w-full text-left px-4 py-2 text-sm text-ease-blue hover:underline font-semibold">+ Add New Entity</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* CARD A: Income Tax Return */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Income Tax Return</h2>
                                <p className="text-sm text-gray-500">File your annual taxes effortlessly.</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <FileIcon />
                            </div>
                        </div>
                        
                        <div className="p-6 flex-grow space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Assessment Year</label>
                                <select 
                                    value={selectedAY} 
                                    onChange={(e) => setSelectedAY(e.target.value)}
                                    className="input w-full bg-gray-50 border-gray-200"
                                >
                                    <option>AY 2024-25</option>
                                    <option>AY 2023-24</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Current Status</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${itrApp ? statusColors[itrApp.status] : 'bg-gray-200 text-gray-500'}`}>
                                        {itrApp ? itrApp.status : 'Not Started'}
                                    </span>
                                </div>
                                
                                {itrApp && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleViewDetails(itrApp)}
                                            className="text-xs font-bold text-ease-blue hover:underline text-left"
                                        >
                                            View Progress &rarr;
                                        </button>
                                        {itrApp.outputDocuments.length > 0 && (
                                            <button 
                                                onClick={() => handleDownload(itrApp.outputDocuments[0].fileName, itrApp.outputDocuments[0].fileData)}
                                                className="text-xs font-bold text-ease-green hover:underline text-right"
                                            >
                                                Download Acknowledgement
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button 
                                onClick={() => { setSelectedClientId(client.id); setPage('itr-filing'); }}
                                className="w-full bg-ease-blue text-white py-3 rounded-xl font-bold shadow-md hover:bg-ease-blue/90 transition-all"
                            >
                                {itrApp ? 'Manage Filing' : 'Start ITR Filing'}
                            </button>
                        </div>
                    </div>

                    {/* CARD B: TDS on Property */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">TDS on Property</h2>
                                <p className="text-sm text-gray-500">Section 194-IA compliance for buyers.</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl shadow-sm text-purple-600">
                                <PlusIcon />
                            </div>
                        </div>

                        <div className="p-6 flex-grow flex flex-col justify-center text-center">
                            {tdsPropertyApp ? (
                                <div className="space-y-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusColors[tdsPropertyApp.status]}`}>
                                        {tdsPropertyApp.status}
                                    </span>
                                    <p className="text-sm text-gray-600">Filing for property worth ₹{tdsPropertyApp.extractedData?.propertyValue?.toLocaleString()}</p>
                                    <button 
                                        onClick={() => handleViewDetails(tdsPropertyApp)}
                                        className="text-ease-blue font-bold text-sm hover:underline"
                                    >
                                        Check Timeline &rarr;
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500 italic">Purchased a property worth more than ₹50 Lakhs? You are required to deduct 1% TDS and file Form 26QB.</p>
                                    <div className="pt-4">
                                        <button 
                                            onClick={() => { setSelectedClientId(client.id); setPage('tds-property'); }}
                                            className="inline-flex items-center text-ease-blue font-bold text-sm hover:underline"
                                        >
                                            Start Property TDS Filing &rarr;
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 mt-auto">
                            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 flex items-start space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                <p className="text-xs text-yellow-800 leading-relaxed">
                                    <strong>Buyer's Responsibility:</strong> TDS must be paid within 30 days from the end of the month in which deduction is made.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 text-center text-sm text-gray-400">
                    <p>Need help with anything else? <a href="mailto:support@charteredease.in" className="underline hover:text-gray-600">Contact our tax experts</a></p>
                </div>
            </div>
        );
    }

    // --- GENERIC LIST VIEW (For Business Entities) ---
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Applications</h1>
                    
                    {/* Entity Switcher */}
                    <div className="relative mt-2">
                        <button 
                            onClick={() => setShowEntitySwitcher(!showEntitySwitcher)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                        >
                            <span>Managing: <strong>{client.name}</strong> ({client.entityType})</span>
                            <SwitchIcon />
                        </button>

                        {showEntitySwitcher && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-2 animate-fade-in-up">
                                <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Switch Profile</p>
                                {allUserEntities.map(entity => (
                                    <button
                                        key={entity.id}
                                        onClick={() => handleSwitchEntity(entity.id)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center ${entity.id === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        <span className="truncate text-sm font-medium">{entity.name}</span>
                                        {entity.id === client.id && <span className="h-2 w-2 rounded-full bg-blue-600"></span>}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <button 
                                        onClick={handleAddEntity}
                                        className="w-full text-left px-4 py-2 text-sm text-ease-blue hover:underline font-semibold"
                                    >
                                        + Add New Entity
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={handleApplyForNewService}
                        className="bg-ease-blue text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-ease-blue/90 transition-all flex items-center"
                    >
                        <span className="mr-2 text-lg">+</span> New Application
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{applications.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-500 uppercase font-semibold">In Progress</p>
                    <p className="text-2xl font-bold text-gray-800">{applications.filter(a => a.status !== 'Completed' && a.status !== 'Rejected' && a.status !== 'Filed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Completed</p>
                    <p className="text-2xl font-bold text-gray-800">{applications.filter(a => a.status === 'Completed' || a.status === 'Filed').length}</p>
                </div>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <FileIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No applications yet for {client.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by applying for a new service.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleApplyForNewService}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ease-blue hover:bg-ease-blue/90"
                        >
                            Start New Application
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {applications.map((app) => (
                        <div 
                            key={app.id} 
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between group cursor-pointer"
                            onClick={() => handleViewDetails(app)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-2">
                                    <h2 className="text-lg font-bold text-gray-800 truncate mr-3">{app.serviceName}</h2>
                                    {app.filingType === 'expert' && <span className="mr-2 bg-ease-blue/10 text-ease-blue text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Expert</span>}
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100'}`}>
                                        {app.status}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-y-1 gap-x-6">
                                    <span>Ref: {app.referenceId}</span>
                                    {app.bookedSlot 
                                        ? <span className="text-teal-700 font-semibold">Slot: {app.bookedSlot.date}, {app.bookedSlot.time}</span>
                                        : <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                                    }
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center">
                                <button className="text-sm font-semibold text-ease-blue group-hover:underline flex items-center">
                                    View Details <ChevronRightIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-12 text-center text-sm text-gray-400">
                <p>Need help? Contact support at <a href="mailto:support@charteredease.in" className="underline hover:text-gray-600">support@charteredease.in</a></p>
            </div>
        </div>
    );
};

export default CustomerDashboardPage;
