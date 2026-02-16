
import React, { useState, useEffect, useMemo } from 'react';
import { useAdminAuth, InternalRole } from '../../hooks/useAdminAuth';
import { useAssociateManager, InternalStaff, AgentProfile } from '../../hooks/useAssociateManager';
import { CharteredEaseLogo } from '../icons/EaseIndiaLogo';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { UsersGroupIcon } from '../icons/UsersGroupIcon';
import { LoaderIcon } from '../icons/LoaderIcon';
import { downloadFile } from '../../hooks/useProfile';

const applicationServices = [
    'GST Registration',
    'Shop Act License',
    'Udyam Registration',
    'Company Incorporation',
    'Professional Tax',
    'Income Tax Filing',
];

const statusColors: { [key: string]: string } = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Review': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Scheduled': 'bg-teal-100 text-teal-800'
};

const entityTypeMap: Record<string, string> = {
    proprietorship: 'Proprietorship',
    partnership: 'Partnership',
    llp: 'LLP',
    private_limited: 'Private Limited Company',
    huf: 'HUF',
    society: 'Society',
    trust: 'Trust',
};

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;


// --- INTERNAL USER / AGENT MANAGEMENT COMPONENT ---
const UserManagement: React.FC = () => {
    const { admin } = useAdminAuth();
    const { staff, agents, addInternalUser, addAgent, canCreateRole } = useAssociateManager();
    
    const [creationType, setCreationType] = useState<'internal' | 'agent'>('internal');
    const [role, setRole] = useState<InternalRole | ''>('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState<any>(null);

    const canCreateInternal = canCreateRole(admin!.role, 'associate_services'); // Simplified check to see if they can create ANY internal
    const canCreateAgent = canCreateRole(admin!.role, 'agent');

    // Default tab selection based on permission
    useEffect(() => {
        if (!canCreateInternal && canCreateAgent) setCreationType('agent');
    }, [canCreateInternal, canCreateAgent]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg(null);

        if (!name || !email) { setError('Name and Email are required.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid Email Format.'); return; }

        setIsLoading(true);
        
        setTimeout(() => {
            if (creationType === 'internal') {
                if (!role) { setError('Role is required.'); setIsLoading(false); return; }
                const res = addInternalUser(name, email, role as InternalRole);
                if (res) setSuccessMsg({ ...res, type: 'Internal User' });
                else setError('User with this email already exists.');
            } else {
                if (!mobile || !/^\d{10}$/.test(mobile)) { setError('Valid 10-digit mobile number required for agents.'); setIsLoading(false); return; }
                const res = addAgent(name, email, mobile, admin!.id);
                if (res) setSuccessMsg({ ...res, type: 'Agent', username: res.agent.username });
                else setError('Agent with this email or mobile already exists.');
            }
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Creation Form */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Credentials</h3>
                
                <div className="flex space-x-4 mb-4 border-b pb-2">
                    {canCreateInternal && (
                        <button 
                            onClick={() => { setCreationType('internal'); setRole(''); setError(''); setSuccessMsg(null); }}
                            className={`pb-2 text-sm font-semibold ${creationType === 'internal' ? 'text-ease-blue border-b-2 border-ease-blue' : 'text-gray-500'}`}
                        >
                            Internal Staff
                        </button>
                    )}
                    {canCreateAgent && (
                        <button 
                            onClick={() => { setCreationType('agent'); setError(''); setSuccessMsg(null); }}
                            className={`pb-2 text-sm font-semibold ${creationType === 'agent' ? 'text-ease-blue border-b-2 border-ease-blue' : 'text-gray-500'}`}
                        >
                            Partner Agent
                        </button>
                    )}
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input w-full mt-1" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input w-full mt-1" placeholder="john@example.com" />
                    </div>
                    
                    {creationType === 'agent' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Mobile Number (10 Digits)</label>
                            <input type="tel" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} className="input w-full mt-1" placeholder="9876543210" />
                        </div>
                    )}

                    {creationType === 'internal' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Assign Role</label>
                            <select value={role} onChange={e => setRole(e.target.value as InternalRole)} className="input w-full mt-1">
                                <option value="">Select Role...</option>
                                {canCreateRole(admin!.role, 'admin_services') && <option value="admin_services">Admin - Services</option>}
                                {canCreateRole(admin!.role, 'admin_agent_relations') && <option value="admin_agent_relations">Admin - Agent Relations</option>}
                                {canCreateRole(admin!.role, 'associate_services') && <option value="associate_services">Associate - Services</option>}
                                {canCreateRole(admin!.role, 'associate_agent_relations') && <option value="associate_agent_relations">Associate - Agent Relations</option>}
                            </select>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full bg-ease-blue text-white py-2 rounded-md font-semibold hover:bg-ease-blue/90 disabled:opacity-50 flex justify-center">
                        {isLoading ? <LoaderIcon /> : 'Generate Credentials'}
                    </button>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                </form>

                {successMsg && (
                    <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                        <h4 className="font-bold text-sm">✔ {successMsg.type} Created!</h4>
                        <div className="mt-2 text-xs bg-white p-2 rounded border text-gray-700 space-y-1">
                            {successMsg.username && <p><strong>Username:</strong> {successMsg.username}</p>}
                            <p><strong>Email:</strong> {successMsg.user?.email || successMsg.agent?.email}</p>
                            <p><strong>Password:</strong> {successMsg.passwordGenerated}</p>
                        </div>
                        <p className="text-xs mt-2 text-green-700 italic">Copy these credentials now. Password won't be shown again.</p>
                    </div>
                )}
            </div>

            {/* Lists */}
            <div className="space-y-6">
                {canCreateInternal && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Internal Staff ({staff.length})</h3>
                        <div className="bg-white border rounded-lg max-h-60 overflow-y-auto">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100 font-semibold text-gray-600">
                                    <tr><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Email</th></tr>
                                </thead>
                                <tbody>
                                    {staff.map(s => (
                                        <tr key={s.id} className="border-b last:border-0">
                                            <td className="p-2">{s.name}</td>
                                            <td className="p-2 text-gray-500">{s.role.replace(/_/g, ' ')}</td>
                                            <td className="p-2 text-gray-500">{s.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {canCreateAgent && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Partner Agents ({agents.length})</h3>
                        <div className="bg-white border rounded-lg max-h-60 overflow-y-auto">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100 font-semibold text-gray-600">
                                    <tr><th className="p-2">Name</th><th className="p-2">Username</th><th className="p-2">Mobile</th></tr>
                                </thead>
                                <tbody>
                                    {agents.map(a => (
                                        <tr key={a.id} className="border-b last:border-0">
                                            <td className="p-2">{a.name}</td>
                                            <td className="p-2 text-ease-blue font-mono">{a.username}</td>
                                            <td className="p-2 text-gray-500">{a.mobile}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MAIN ADMIN DASHBOARD ---
const AdminDashboardPage: React.FC = () => {
    const { admin, logout } = useAdminAuth();
    const { getAssociates, createTask, tasks } = useAssociateManager();

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [editableData, setEditableData] = useState<Record<string, any> | null>(null);
    const [activeView, setActiveView] = useState('Overview');

    // Access Control Flags
    const isServiceRole = admin?.role === 'super_admin' || admin?.role === 'admin_services' || admin?.role === 'associate_services';
    const isAgentRelationsRole = admin?.role === 'super_admin' || admin?.role === 'admin_agent_relations' || admin?.role === 'associate_agent_relations';
    const canManageUsers = admin?.role !== 'associate_services'; // Regular service associates can't manage users

    // Task Assignment State
    const [assignee, setAssignee] = useState('');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        try {
            const storedSubmissions = localStorage.getItem('charteredease_submissions');
            if (storedSubmissions) {
                setSubmissions(JSON.parse(storedSubmissions).sort((a: any, b: any) => b.id - a.id));
            }
        } catch (e) { console.error(e); }
    }, []);

    const assignedSubmissionIds = useMemo(() => new Set(tasks.map(task => task.submissionId)), [tasks]);
    const selectedTask = useMemo(() => selectedSubmission ? tasks.find(t => t.submissionId === selectedSubmission.id) : null, [selectedSubmission, tasks]);
    const serviceAssociates = useMemo(() => getAssociates(), [getAssociates]);

    useEffect(() => {
        if (selectedSubmission) {
            setEditableData(selectedSubmission.extractedData || {});
            setAssignee('');
            setDeadline('');
            setNotes('');
        } else {
            setEditableData(null);
        }
    }, [selectedSubmission]);
    
    // Filter Submissions based on View
    const filteredSubmissions = useMemo(() => {
        if (activeView === 'Overview' || activeView === 'User Management') return submissions;
        return submissions.filter(app => app.service === activeView);
    }, [activeView, submissions]);

    const updateSubmissions = (updated: any[]) => {
        setSubmissions(updated);
        localStorage.setItem('charteredease_submissions', JSON.stringify(updated));
    };

    const handleUpdateStatus = (id: number, newStatus: string) => {
        const updated = submissions.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub);
        updateSubmissions(updated);
        if (selectedSubmission) setSelectedSubmission({ ...selectedSubmission, status: newStatus });
    };

    const handleAssignTask = () => {
        if (!assignee || !deadline) { alert("Select associate and deadline."); return; }
        createTask({
            submissionId: selectedSubmission.id,
            associateId: assignee,
            clientName: selectedSubmission.clientName,
            profileName: selectedSubmission.profileName,
            serviceName: selectedSubmission.service,
            entityType: selectedSubmission.entityType,
            deadline,
            adminNotes: notes,
            documents: selectedSubmission.documents,
            filingType: selectedSubmission.filingType,
            bookedSlot: selectedSubmission.bookedSlot
        });
        alert(`Task Assigned.`);
        setSelectedSubmission(null);
    };

    const sidebarItems = [
        { name: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg> },
        ...(isServiceRole ? applicationServices.map(name => ({ name, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> })) : []),
        ...(canManageUsers ? [{ name: 'User Management', icon: <UsersGroupIcon /> }] : [])
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-64 bg-ease-blue text-white flex flex-col flex-shrink-0">
                <div className="h-20 flex items-center justify-center border-b border-blue-700">
                    <CharteredEaseLogo className="h-10 w-10" />
                    <span className="ml-3 font-semibold text-lg">Internal Portal</span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {sidebarItems.map(item => (
                        <button key={item.name}
                            onClick={() => setActiveView(item.name)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${activeView === item.name ? 'bg-blue-700' : 'hover:bg-blue-600'}`}
                        >
                            {item.icon}
                            <span className="text-sm text-left">{item.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm flex justify-between items-center px-6 py-4">
                    <div>
                         <h1 className="text-xl font-semibold text-gray-800">Welcome, {admin?.name}</h1>
                         <p className="text-xs text-gray-500 uppercase tracking-wide">{admin?.role?.replace(/_/g, ' ')}</p>
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-all">Logout</button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                         <h2 className="text-xl font-semibold border-b pb-4 mb-6">{activeView}</h2>
                         
                         {activeView === 'User Management' ? (
                            <UserManagement />
                         ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left">
                                        <tr>
                                            <th className="p-3">Client</th>
                                            <th className="p-3">Service</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Task</th>
                                            <th className="p-3">Details</th>
                                            <th className="p-3">Actions</th>
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
                                                <td className="p-3">
                                                    {assignedSubmissionIds.has(sub.id) ? 
                                                        <span className="text-green-600 font-semibold flex items-center"><ClipboardListIcon className="h-4 w-4 mr-1"/> Assigned</span> : 
                                                        <span className="text-gray-400">Unassigned</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {sub.filingType === 'expert' && <span className="text-teal-600 font-bold">Expert Slot</span>}
                                                </td>
                                                <td className="p-3">
                                                    <button onClick={() => setSelectedSubmission(sub)} className="text-ease-blue font-semibold hover:underline">Manage</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredSubmissions.length === 0 && <p className="text-center text-gray-500 py-8">No records found.</p>}
                            </div>
                         )}
                    </div>
                </main>
            </div>

            {/* Modal for Task Management */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <header className="flex justify-between items-center p-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-ease-blue">{selectedSubmission.service}</h2>
                                <p className="text-sm">{selectedSubmission.clientName} ({selectedSubmission.profileName})</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                        </header>
                        <main className="p-6 flex-1 overflow-y-auto grid md:grid-cols-3 gap-6">
                           
                           {/* Col 1: Meta Data */}
                           <div className="space-y-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                    <select value={selectedSubmission.status} onChange={(e) => handleUpdateStatus(selectedSubmission.id, e.target.value)} className="w-full input mt-1 text-sm">
                                        {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Contact</label>
                                    <p className="text-sm mt-1">{selectedSubmission.mobile}</p>
                                </div>
                                {selectedSubmission.filingType === 'expert' && selectedSubmission.bookedSlot && (
                                    <div className="bg-teal-50 p-3 rounded border border-teal-200">
                                        <p className="text-teal-800 font-bold text-sm">Expert Session</p>
                                        <p className="text-xs text-teal-700">{selectedSubmission.bookedSlot.date} @ {selectedSubmission.bookedSlot.time}</p>
                                    </div>
                                )}
                           </div>
                           
                           {/* Col 2: Documents & Data */}
                           <div className="border-l pl-6 border-r pr-6">
                                <h3 className="font-bold text-gray-800 mb-3">Documents</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                                    {selectedSubmission.documents?.map((doc: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                            <span className="truncate w-32" title={doc.fileName}>{doc.fileName}</span>
                                            <button onClick={() => downloadFile(doc.fileName, doc.fileData)} className="text-ease-blue"><DownloadIcon /></button>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="font-bold text-gray-800 mb-2 mt-6">Extracted Data</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {editableData && Object.entries(editableData).map(([k, v]) => (
                                        <div key={k} className="text-xs">
                                            <span className="font-semibold text-gray-500 block capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="text-gray-800">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                           </div>

                           {/* Col 3: Assignment */}
                           <div>
                                <h3 className="font-bold text-gray-800 mb-3">Task Assignment</h3>
                                {assignedSubmissionIds.has(selectedSubmission.id) ? (
                                    <div className="bg-green-50 p-4 rounded text-center border border-green-200">
                                        <p className="text-green-800 font-semibold text-sm">Task Assigned</p>
                                        {selectedTask && <p className="text-xs text-green-700 mt-1">To: {serviceAssociates.find(s => s.id === selectedTask.associateId)?.name}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Assignee</label>
                                            <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full input mt-1 text-sm">
                                                <option value="">Select Associate...</option>
                                                {serviceAssociates.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role.replace('associate_', '')})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
                                            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full input mt-1 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Notes</label>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full input mt-1 text-sm" rows={2}></textarea>
                                        </div>
                                        <button onClick={handleAssignTask} disabled={!assignee || !deadline} className="w-full bg-ease-green text-white py-2 rounded font-semibold text-sm hover:bg-green-700 disabled:opacity-50">
                                            Assign Task
                                        </button>
                                    </div>
                                )}
                           </div>

                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
