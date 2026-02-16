
import React, { useState, useEffect, useMemo } from 'react';
import { useClientManager, Document, downloadFile, fileToDataURL } from '../hooks/useProfile';
import { useAppContext } from '../hooks/useAppContext';
import { LoaderIcon } from './icons/LoaderIcon';
import { useAssociateManager } from '../hooks/useAssociateManager';

const entityTypes = [
    { id: 'proprietorship', name: 'Proprietorship' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'llp', name: 'LLP' },
    { id: 'private_limited', name: 'Private Limited Company' },
    { id: 'huf', name: 'HUF' },
    { id: 'society', name: 'Society' },
    { id: 'trust', name: 'Trust' },
];

const statusColors: { [key: string]: string } = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Scheduled': 'bg-teal-100 text-teal-800',
    'Waiting for More Docs': 'bg-purple-100 text-purple-800',
    'Pending Assignment': 'bg-orange-100 text-orange-800'
};

const DocumentChip: React.FC<{ doc: Document }> = ({ doc }) => (
    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full" title={doc.fileName}>
        {doc.type}
    </span>
);

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const ClientDashboardPage: React.FC = () => {
    const { selectedClientId, setPage, setSelectedProfileId, setSelectedClientId } = useAppContext();
    const { getClient, updateClient, addDocumentsToClient } = useClientManager();
    const { tasks, staff: associates } = useAssociateManager();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobileNumber: '', email: '' });
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'documents'>('profile');
    const [refreshKey, setRefreshKey] = useState(0); // To force refresh of tasks list
    
    // Document Upload State
    const [uploadDocType, setUploadDocType] = useState('');
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Appointment Modal State
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [appointmentData, setAppointmentData] = useState({
        topic: 'Income Tax',
        urgency: 'Within next 24 hours',
        availability: 'Business hours (10 AM – 6 PM)'
    });
    const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

    const client = selectedClientId ? getClient(selectedClientId) : null;

    useEffect(() => {
        if (!selectedClientId) {
            setPage('agent-dashboard');
        }
    }, [selectedClientId, setPage]);

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                mobileNumber: client.mobileNumber,
                email: client.email,
            });
        }
    }, [client]);

    const clientTasks = useMemo(() => {
        if (!client) return [];
        const allSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
        const mySubmissions = allSubmissions.filter((sub: any) => sub.clientId === client.id);
        
        return mySubmissions.map((sub: any) => {
            const task = tasks.find(t => t.submissionId === sub.id);
            const associate = task ? associates.find(a => a.id === task.associateId) : null;
            return {
                ...sub,
                currentStatus: task?.status || sub.status,
                associateName: associate?.name || 'Unassigned'
            };
        }).sort((a: any, b: any) => b.id - a.id);
    }, [client, tasks, associates, refreshKey]);

    if (!client) {
        return <div className="text-center p-12">Client not found.</div>;
    }

    // --- HANDLERS ---

    const handleUpdateClient = () => {
        if (!formData.name.trim() || !formData.mobileNumber.trim() || !formData.email.trim()) {
            setError('All fields are required.');
            return;
        }
        if (formData.mobileNumber.trim().length !== 10 || !/^\d+$/.test(formData.mobileNumber.trim())) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        setError('');
        setIsUpdating(true);
        setTimeout(() => {
            if (selectedClientId) updateClient(selectedClientId, formData);
            setIsUpdating(false);
            setIsEditModalOpen(false);
        }, 500);
    };
    
    const handleStartNew = () => {
        setSelectedProfileId(null);
        setPage('services');
    };

    const handleUploadDocs = async () => {
        if (!uploadDocType || uploadFiles.length === 0) return;
        setIsUploading(true);
        try {
            const newDocs: Document[] = await Promise.all(uploadFiles.map(async file => ({
                type: uploadDocType,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(file)
            })));
            
            addDocumentsToClient(client.id, newDocs);
            setUploadFiles([]);
            setUploadDocType('');
            setIsUploading(false);
            alert('Documents uploaded successfully.');
        } catch (e) {
            console.error(e);
            setIsUploading(false);
            alert('Failed to upload documents.');
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'mobileNumber') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleAppointmentSubmit = () => {
        setIsSubmittingAppointment(true);
        
        // Simulate Submission
        setTimeout(() => {
            const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");
            
            const newAppointment = {
                id: Date.now(),
                service: `Consultation: ${appointmentData.topic}`,
                clientName: client.name,
                clientId: client.id,
                profileName: "Appointment Request",
                profileId: "appt-" + Date.now(),
                mobile: client.mobileNumber,
                entityType: client.entityType,
                extractedData: {
                    urgency: appointmentData.urgency,
                    availability: appointmentData.availability
                },
                documents: [],
                status: "Pending Assignment",
                submittedAt: new Date().toLocaleString(),
                filingType: 'basic',
                createdByType: 'agent'
            };
            
            existingSubmissions.push(newAppointment);
            localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));
            
            setRefreshKey(prev => prev + 1); // Refresh list
            setIsSubmittingAppointment(false);
            setIsAppointmentModalOpen(false);
            setActiveTab('tasks'); // Switch to tasks to show new item
            alert("Appointment request submitted successfully!");
        }, 800);
    };

    return (
        <div className="container mx-auto px-4 py-8 font-sans">
            <button onClick={() => { setPage('agent-dashboard'); setSelectedClientId(null); }} className="text-sm text-ease-blue hover:underline mb-4">&larr; Back to Dashboard</button>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                        <div className="bg-ease-blue text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
                            <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-1">
                                <span>{client.email}</span>
                                <span>{client.mobileNumber}</span>
                                <span className="bg-blue-100 text-blue-800 px-2 rounded-full text-xs flex items-center h-5 self-center">{entityTypes.find(e => e.id === client.entityType)?.name || client.entityType}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button onClick={() => setIsEditModalOpen(true)} className="text-sm bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded hover:bg-gray-50">Edit Profile</button>
                        <button onClick={() => setIsAppointmentModalOpen(true)} className="text-sm bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-700 flex items-center justify-center">
                            <CalendarIcon /> <span className="ml-1">Schedule Appointment</span>
                        </button>
                        <button onClick={handleStartNew} className="text-sm bg-ease-green text-white py-2 px-3 rounded hover:bg-ease-green/90">+ Start New Service</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('profile')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium ${activeTab === 'profile' ? 'border-b-2 border-ease-blue text-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}>
                        <UserIcon /> <span>Profile</span>
                    </button>
                    <button onClick={() => setActiveTab('documents')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-ease-blue text-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}>
                        <DocumentTextIcon /> <span>Documents ({client.documents.length})</span>
                    </button>
                    <button onClick={() => setActiveTab('tasks')} className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium ${activeTab === 'tasks' ? 'border-b-2 border-ease-blue text-ease-blue' : 'text-gray-500 hover:text-gray-700'}`}>
                        <BriefcaseIcon /> <span>Tasks ({clientTasks.length})</span>
                    </button>
                </div>

                <div className="p-6 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Client Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                    <p className="text-gray-800 font-medium">{client.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Entity Type</label>
                                    <p className="text-gray-800 font-medium">{entityTypes.find(e => e.id === client.entityType)?.name || client.entityType}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                                    <p className="text-gray-800 font-medium">{client.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
                                    <p className="text-gray-800 font-medium">+91 {client.mobileNumber}</p>
                                </div>
                                {client.assignedAgentId && (
                                    <div className="col-span-2 pt-4 border-t">
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Assigned to Agent: {client.assignedAgentId}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Uploaded Documents</h3>
                                {client.documents.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {client.documents.map((doc, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 border rounded-md hover:bg-gray-100">
                                                <div className="overflow-hidden mr-2">
                                                    <p className="text-sm font-medium text-gray-800 truncate" title={doc.fileName}>{doc.fileName}</p>
                                                    <p className="text-xs text-gray-500">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => downloadFile(doc.fileName, doc.fileData)} className="text-ease-blue hover:bg-blue-100 p-1.5 rounded"><DownloadIcon /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-lg border h-fit">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Upload More Documents</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                        <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className="input w-full bg-white">
                                            <option value="">Select Type...</option>
                                            <option value="PAN Card">PAN Card</option>
                                            <option value="Aadhaar Card">Aadhaar Card</option>
                                            <option value="Bank Statement">Bank Statement</option>
                                            <option value="GST Credentials">GST Credentials</option>
                                            <option value="Sales Register">Sales Register</option>
                                            <option value="Purchase Register">Purchase Register</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Files</label>
                                        <input type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-ease-blue hover:file:bg-blue-100"/>
                                        {uploadFiles.length > 0 && <p className="text-xs text-gray-600 mt-1">{uploadFiles.length} file(s) selected</p>}
                                    </div>
                                    <button 
                                        onClick={handleUploadDocs} 
                                        disabled={isUploading || !uploadDocType || uploadFiles.length === 0}
                                        className="w-full bg-ease-blue text-white py-2 rounded font-semibold hover:bg-ease-blue/90 disabled:bg-gray-300 flex justify-center"
                                    >
                                        {isUploading ? <LoaderIcon /> : 'Upload Documents'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Service History</h3>
                            {clientTasks.length === 0 ? (
                                <p className="text-gray-500 text-sm">No services started for this client yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border rounded-lg">
                                        <thead className="bg-gray-100 text-gray-600 border-b">
                                            <tr>
                                                <th className="p-3 text-left">Service Name</th>
                                                <th className="p-3 text-left">Date Created</th>
                                                <th className="p-3 text-left">Status</th>
                                                <th className="p-3 text-left">Assigned Associate</th>
                                                <th className="p-3 text-left">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {clientTasks.map((task: any) => (
                                                <tr key={task.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-800">{task.service}</td>
                                                    <td className="p-3 text-gray-600">{new Date(task.submittedAt).toLocaleDateString()}</td>
                                                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[task.currentStatus] || 'bg-gray-100'}`}>{task.currentStatus}</span></td>
                                                    <td className="p-3 text-gray-600">{task.associateName}</td>
                                                    <td className="p-3">
                                                        <button className="text-ease-blue hover:underline font-medium">View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Edit Details</h2>
                        <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="input w-full" placeholder="Name"/>
                        <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleFormChange} className="input w-full" placeholder="Mobile"/>
                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} className="input w-full" placeholder="Email"/>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end space-x-3 pt-2">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleUpdateClient} disabled={isUpdating} className="px-4 py-2 rounded bg-ease-blue text-white flex items-center">{isUpdating && <LoaderIcon />} Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Modal */}
            {isAppointmentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Schedule Appointment</h2>
                            <p className="text-sm text-gray-500 mt-1">Request a consultation with our experts.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Topic</label>
                                <select 
                                    className="input w-full"
                                    value={appointmentData.topic}
                                    onChange={(e) => setAppointmentData({...appointmentData, topic: e.target.value})}
                                >
                                    <option>Income Tax</option>
                                    <option>GST Filing</option>
                                    <option>MCA Compliance</option>
                                    <option>Company / LLP Registration</option>
                                    <option>Project Report</option>
                                    <option>General Compliance Query</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="urgency" 
                                            className="text-ease-blue focus:ring-ease-blue"
                                            checked={appointmentData.urgency === 'Within next 3 hours'}
                                            onChange={() => setAppointmentData({...appointmentData, urgency: 'Within next 3 hours'})}
                                        />
                                        <span className="text-sm text-gray-700">Within next 3 hours</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="urgency" 
                                            className="text-ease-blue focus:ring-ease-blue"
                                            checked={appointmentData.urgency === 'Within next 24 hours'}
                                            onChange={() => setAppointmentData({...appointmentData, urgency: 'Within next 24 hours'})}
                                        />
                                        <span className="text-sm text-gray-700">Within next 24 hours</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Client Availability</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="availability" 
                                            className="text-ease-blue focus:ring-ease-blue"
                                            checked={appointmentData.availability === '24×7'}
                                            onChange={() => setAppointmentData({...appointmentData, availability: '24×7'})}
                                        />
                                        <span className="text-sm text-gray-700">24×7</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="availability" 
                                            className="text-ease-blue focus:ring-ease-blue"
                                            checked={appointmentData.availability === 'Business hours (10 AM – 6 PM)'}
                                            onChange={() => setAppointmentData({...appointmentData, availability: 'Business hours (10 AM – 6 PM)'})}
                                        />
                                        <span className="text-sm text-gray-700">Business hours (10 AM – 6 PM)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button 
                                onClick={() => setIsAppointmentModalOpen(false)} 
                                className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAppointmentSubmit} 
                                disabled={isSubmittingAppointment} 
                                className="px-4 py-2 rounded-md text-white bg-ease-blue hover:bg-ease-blue/90 disabled:opacity-70 flex items-center transition-colors"
                            >
                                {isSubmittingAppointment ? <LoaderIcon /> : 'Request Appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboardPage;
