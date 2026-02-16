import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager } from '../../hooks/useProfile';
import { useAssociateManager } from '../../hooks/useAssociateManager';

const statusOptions = [
    'Pending',
    'Awaiting Docs',
    'In Progress',
    'Assigned to Associate',
    'Completed',
    'Rejected',
];

const serviceOptions = [
    'GST Registration',
    'Shop Act License',
    'Udyam Registration',
    'Company Incorporation',
    'Professional Tax',
    'Income Tax Filing',
];

const statusColors: { [key: string]: string } = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'Awaiting Docs': 'bg-purple-100 text-purple-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Assigned to Associate': 'bg-indigo-100 text-indigo-800',
    Completed: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
};

const TrackStatusDashboardPage: React.FC = () => {
    const { setPage, setSelectedSubmissionId } = useAppContext();
    const { clients } = useClientManager();
    const { tasks, staff: associates } = useAssociateManager();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [filters, setFilters] = useState({ client: '', service: '', status: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const storedSubmissions = localStorage.getItem('charteredease_submissions');
        if (storedSubmissions) {
            setSubmissions(JSON.parse(storedSubmissions).sort((a: any, b: any) => b.id - a.id));
        }
    }, []);

    const submissionsWithDetails = useMemo(() => {
        return submissions.map(sub => {
            const client = clients.find(c => c.id === sub.clientId);
            const task = tasks.find(t => t.submissionId === sub.id);
            const associate = task ? associates.find(e => e.id === task.associateId) : null;
            
            // Derive a more detailed status
            let derivedStatus = sub.status;
            if (task && (sub.status === 'Pending' || sub.status === 'In Progress')) {
                derivedStatus = 'Assigned to Associate';
            }

            return {
                ...sub,
                clientName: client?.name || sub.clientName,
                clientMobile: client?.mobileNumber || '',
                status: derivedStatus,
                assignedTo: associate?.name || 'Unassigned',
                lastUpdated: sub.submittedAt, // Placeholder, a real app would have an updated_at field
            };
        });
    }, [submissions, clients, tasks, associates]);

    const filteredSubmissions = useMemo(() => {
        return submissionsWithDetails.filter(sub => {
            const searchMatch = searchQuery.trim() === '' ||
                sub.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.clientMobile.includes(searchQuery);

            const clientMatch = !filters.client || sub.clientId === filters.client;
            const serviceMatch = !filters.service || sub.service === filters.service;
            const statusMatch = !filters.status || sub.status === filters.status;

            return searchMatch && clientMatch && serviceMatch && statusMatch;
        });
    }, [submissionsWithDetails, filters, searchQuery]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleViewDetails = (submissionId: number) => {
        setSelectedSubmissionId(submissionId);
        setPage('status-timeline');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => setPage('agent-dashboard')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                <span className="mr-2">&larr;</span>Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Track Application Status</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search by client name or mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input"
                    />
                    <select name="client" value={filters.client} onChange={handleFilterChange} className="input">
                        <option value="">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="service" value={filters.service} onChange={handleFilterChange} className="input">
                        <option value="">All Services</option>
                        {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="input">
                        <option value="">All Statuses</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="p-3 font-semibold">Client Name</th>
                            <th className="p-3 font-semibold">Service Name</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Assigned To</th>
                            <th className="p-3 font-semibold">Last Updated</th>
                            <th className="p-3 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubmissions.map(sub => (
                            <tr key={sub.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{sub.clientName}</td>
                                <td className="p-3">{sub.service}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[sub.status] || 'bg-gray-100 text-gray-800'}`}>{sub.status}</span>
                                </td>
                                <td className="p-3">{sub.assignedTo}</td>
                                <td className="p-3">{new Date(sub.lastUpdated).toLocaleDateString()}</td>
                                <td className="p-3">
                                    <button onClick={() => handleViewDetails(sub.id)} className="font-semibold text-ease-blue hover:underline">View</button>
                                </td>
                            </tr>
                        ))}
                        {filteredSubmissions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-gray-500 py-8">No applications match your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TrackStatusDashboardPage;