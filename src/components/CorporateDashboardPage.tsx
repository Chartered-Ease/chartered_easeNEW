
import React, { useState, useEffect, useMemo } from 'react';
import { useCorporateAuth } from '../hooks/useCorporateAuth';
import { useAssociateManager, Task } from '../hooks/useAssociateManager';
import { MCA_COMPLIANCES } from '../data/mcaConfig';
import { 
    GST_MONTHLY_COMPLIANCES, 
    GST_QRMP_COMPLIANCES, 
    TDS_COMPLIANCES, 
    GST_ANNUAL_COMPLIANCES,
    INCOME_TAX_COMPLIANCES,
    MONTHS, 
    QUARTERS 
} from '../data/taxConfig';
import { downloadFile, Document, fileToDataURL } from '../hooks/useProfile';
import { LoaderIcon } from './icons/LoaderIcon';
import { BankStatementAnalyzer } from './corporate/BankStatementAnalyzer';
import AccountingPlaceholder from './AccountingPlaceholder';
import DocumentVault from './DocumentVault';

// --- ICONS ---
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ease-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const ServiceIcon: React.FC<{ d: string, className?: string }> = ({ d, className = "h-8 w-8 text-ease-blue" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} /></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const LifeBuoyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3A12.02 12.02 0 0021 7.923z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const Share2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const statusColors: Record<string, string> = {
    'Filed': 'bg-green-100 text-green-800',
    'Completed': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Scheduled': 'bg-teal-100 text-teal-800'
};

interface Ticket {
    id: string;
    title: string;
    status: string;
    ticketType?: string;
    consultationType?: string;
    urgency?: string;
    availability?: string;
    corporateId?: string;
    assignedTo?: string;
    createdAt?: string;
}

// --- SUB-COMPONENTS ---
const DashboardCard: React.FC<{ title: string; icon?: React.ReactNode; children?: React.ReactNode; className?: string; onClick?: () => void; headerAction?: React.ReactNode }> = ({ title, icon, children, className, onClick, headerAction }) => (
    <div onClick={onClick} className={`bg-white p-6 rounded-lg shadow-md ${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-lg font-bold text-gray-800">
                {icon}
                <h3 className="ml-2">{title}</h3>
            </div>
            {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-ease-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
        {children}
    </button>
);

// --- NEW TAXATION COMPONENTS ---

const ITCBalanceCard: React.FC = () => {
    const [updated, setUpdated] = useState('Just now');
    const handleUpdate = () => {
        setUpdated('Updating...');
        setTimeout(() => setUpdated('Just now'), 1000);
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-8 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold opacity-90">ITC Balance (Credit Ledger)</h3>
                        <p className="text-xs opacity-70 mt-1">Last Sync: {updated}</p>
                    </div>
                    <button onClick={handleUpdate} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center backdrop-blur-sm transition-colors">
                        <RefreshIcon /> <span className="ml-1">Update ITC</span>
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70">Inputs</p>
                        <p className="text-xl font-bold mt-1">₹ 1,24,000</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70">Capital Goods</p>
                        <p className="text-xl font-bold mt-1">₹ 45,000</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold opacity-70">Services</p>
                        <p className="text-xl font-bold mt-1">₹ 12,500</p>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                        <p className="text-xs uppercase font-bold opacity-70">Total Available</p>
                        <p className="text-2xl font-bold text-green-300 mt-1">₹ 1,81,500</p>
                    </div>
                </div>
            </div>
            {/* Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-20 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        </div>
    );
};

// --- SECTIONS ---
const ComplianceCalendar: React.FC = () => {
    const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
    const complianceDates: Record<string, { color: string; tooltip: string }> = {
        '7': { color: 'bg-yellow-400', tooltip: 'TDS Payment Due' },
        '11': { color: 'bg-green-400', tooltip: 'GSTR-1 Due' },
        '15': { color: 'bg-yellow-400', tooltip: 'Advance Tax Due' },
        '20': { color: 'bg-red-500', tooltip: 'GSTR-3B Due' },
        '30': { color: 'bg-green-400', tooltip: 'ROC DPT-3 Due' },
    };

    return (
        <DashboardCard title="Compliance Calendar (June)" icon={<CalendarIcon />}>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="font-bold text-gray-500 text-xs">{d}</div>)}
                {calendarDays.map(day => (
                    <div key={day} className="relative p-1.5 rounded-full flex items-center justify-center group">
                        <span className={complianceDates[day.toString()] ? 'font-bold text-white' : ''}>{day}</span>
                        {complianceDates[day.toString()] && (
                            <span className={`absolute inset-0 rounded-full -z-10 ${complianceDates[day.toString()].color}`}></span>
                        )}
                         {complianceDates[day.toString()] && (
                             <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {complianceDates[day.toString()].tooltip}
                            </div>
                         )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center text-xs mt-4 text-gray-500">
                <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span> Critical</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></span> Important</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1"></span> Standard</div>
            </div>
             <div className="flex space-x-2 mt-4">
                <button className="flex-1 text-xs flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-2 rounded-md"><PlusCircleIcon /> <span className="ml-1">Add Custom</span></button>
                <button className="flex-1 text-xs flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-2 rounded-md"><DownloadIcon /> <span className="ml-1">Export</span></button>
            </div>
        </DashboardCard>
    );
};

const UserManagement: React.FC = () => {
    const users = [
        { name: 'Rakesh Gupta', role: 'Director', access: 'Admin' },
        { name: 'Sunita Sharma', role: 'Accountant', access: 'Editor' },
    ];
    return (
        <DashboardCard title="Multi-User Access" icon={<UsersIcon />}>
            {users.map(user => (
                <div key={user.name} className="flex items-center justify-between text-sm">
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">{user.access}</span>
                        <button><MoreVerticalIcon /></button>
                    </div>
                </div>
            ))}
            <button className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-md mt-2">View Activity Logs</button>
        </DashboardCard>
    );
};

const TicketSystem: React.FC<{ tickets: Ticket[] }> = ({ tickets }) => {
    const statusColors: Record<string, string> = {
        'Resolved': 'bg-green-100 text-green-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Open': 'bg-blue-100 text-blue-800',
    };

    return (
        <DashboardCard title="Support Tickets" icon={<LifeBuoyIcon />}>
             {tickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between text-sm">
                    <div>
                        <p className="font-semibold">{ticket.title}</p>
                        <p className="text-xs text-gray-500">{ticket.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>{ticket.status}</span>
                </div>
            ))}
            <button className="w-full text-sm bg-ease-green/10 hover:bg-ease-green/20 text-ease-green font-semibold py-2 rounded-md mt-2">Create New Ticket</button>
        </DashboardCard>
    );
};

const AnalyticsPanel: React.FC = () => (
    <DashboardCard title="Analytics" icon={<TrendingUpIcon />}>
        <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">Compliance Health Score</p>
            <p className="text-4xl font-bold text-ease-green mt-1">92%</p>
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Filing Activity (Last 6 Months)</p>
            <div className="flex items-end justify-between h-20 bg-gray-50 p-2 rounded-md">
                {[40, 60, 50, 80, 70, 95].map((h, i) => <div key={i} className="w-1/6 bg-blue-300 mx-px" style={{ height: `${h}%` }}></div>)}
            </div>
        </div>
    </DashboardCard>
);

const ServiceStore: React.FC = () => {
    const services = ["Trademark", "Payroll", "Virtual CFO"];
    return (
        <DashboardCard title="Corporate Service Store" icon={<ServiceIcon d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className="h-5 w-5 mr-2" />}>
            <div className="grid grid-cols-3 gap-3">
                {services.map(name => (
                    <button key={name} className="p-3 bg-gray-50 rounded-md text-center text-sm font-semibold text-gray-700 hover:bg-ease-blue/10 hover:text-ease-blue">
                        {name}
                    </button>
                ))}
            </div>
        </DashboardCard>
    );
};

// --- GENERIC COMPLIANCE COMPONENTS (MCA & Tax) ---

const ComplianceList: React.FC<{ 
    title: string, 
    tasks: Task[], 
    onViewDetail: (task: Task) => void, 
    headerControls?: React.ReactNode,
    onBack?: () => void
}> = ({ title, tasks, onViewDetail, headerControls, onBack }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-gray-500 text-sm">Manage your compliance filings.</p>
                </div>
                {headerControls && (
                    <div className="flex items-center space-x-4">
                        {headerControls}
                    </div>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                        <tr>
                            <th className="p-4">Compliance Name</th>
                            <th className="p-4">Period / FY</th>
                            <th className="p-4">Due Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.taskId} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{task.serviceName}</td>
                                <td className="p-4 text-gray-600">{task.period || task.financialYear}</td>
                                <td className="p-4 text-red-600 font-medium">{new Date(task.deadline).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[task.status] || 'bg-gray-100'}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => onViewDetail(task)} className="text-ease-blue hover:underline font-semibold">View Details</button>
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No active compliances found for this criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ComplianceDetail: React.FC<{ task: Task, onBack: () => void, onUpload: (file: File, docName: string) => void }> = ({ task, onBack, onUpload }) => {
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    // Determine requirements based on task type
    let requiredDocs: string[] = [];
    if (task.taxType) {
        if (task.taxType === 'GST') {
            const configList = [...GST_MONTHLY_COMPLIANCES, ...GST_QRMP_COMPLIANCES, ...GST_ANNUAL_COMPLIANCES];
            requiredDocs = configList.find(c => c.id === task.complianceType)?.requiredDocs || [];
        } else if (task.taxType === 'TDS') {
            requiredDocs = TDS_COMPLIANCES.find(c => c.id === task.complianceType)?.requiredDocs || [];
        } else if (task.taxType === 'IncomeTax') {
            requiredDocs = INCOME_TAX_COMPLIANCES.find(c => c.id === task.complianceType)?.requiredDocs || [];
        }
    } else {
        requiredDocs = MCA_COMPLIANCES.find(c => c.id === task.complianceType)?.requiredDocs || [];
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
        if (e.target.files && e.target.files[0]) {
            setUploadingDoc(docName);
            onUpload(e.target.files[0], docName);
            setTimeout(() => setUploadingDoc(null), 1000);
        }
    };

    const timelineSteps = [
        { label: 'Initiated', completed: true },
        { label: 'Documents Uploaded', completed: task.documents && task.documents.length > 0 },
        { label: 'Associate Assigned', completed: task.associateId !== 'unassigned' }, 
        { label: 'Filed', completed: task.status === 'Completed' || task.status === 'Filed' },
        { label: 'Acknowledgement Generated', completed: task.acknowledgements && task.acknowledgements.length > 0 },
    ];

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-sm text-gray-500 hover:text-ease-blue flex items-center">
                &larr; Back to List
            </button>

            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{task.serviceName}</h1>
                    <p className="text-gray-500">FY {task.financialYear} {task.period ? ` • ${task.period}` : ''}</p>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[task.status] || 'bg-gray-100'}`}>
                        {task.status}
                    </span>
                    {task.srn && <p className="text-sm text-gray-600 mt-2">SRN: <span className="font-mono font-bold">{task.srn}</span></p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Summary & Timeline */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Compliance Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Due Date</span>
                                <span className="font-medium text-red-600">{new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium">{task.taxType || 'MCA'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Assigned Associate</span>
                                <span className="font-medium">{(task as any).associateName || 'Associate'}</span> 
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Status Timeline</h3>
                        <div className="space-y-6 ml-2 border-l-2 border-gray-200 pl-6 relative">
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${step.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}></div>
                                    <p className={`text-sm font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Documents & Filing */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Requirements */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Document Requirements</h3>
                        <div className="space-y-3">
                            {requiredDocs.map((docReq, idx) => {
                                const uploaded = task.documents?.find(d => d.type === docReq);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{docReq}</p>
                                            {uploaded && <p className="text-xs text-green-600">Uploaded on {new Date(uploaded.uploadedAt).toLocaleDateString()}</p>}
                                        </div>
                                        <div>
                                            {uploaded ? (
                                                <div className="flex space-x-2">
                                                    <button onClick={() => downloadFile(uploaded.fileName, uploaded.fileData)} className="text-ease-blue hover:bg-blue-50 p-1.5 rounded"><DownloadIcon /></button>
                                                    <span className="text-green-600 font-bold text-sm flex items-center"><CheckCircleIcon /></span>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100 flex items-center">
                                                    {uploadingDoc === docReq ? <LoaderIcon /> : <><UploadIcon /> <span className="ml-1">Upload</span></>}
                                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, docReq)} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {requiredDocs.length === 0 && <p className="text-sm text-gray-500">No specific documents required.</p>}
                        </div>
                    </div>

                    {/* Filing Outputs */}
                    {(task.status === 'Completed' || task.status === 'Filed' || (task.acknowledgements && task.acknowledgements.length > 0)) && (
                        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
                            <h3 className="font-bold text-green-800 mb-4 border-b border-green-200 pb-2">Filing Output & Acknowledgements</h3>
                            {task.acknowledgements && task.acknowledgements.length > 0 ? (
                                <div className="space-y-3">
                                    {task.acknowledgements.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-green-100">
                                            <span className="text-sm font-medium text-gray-800">{doc.fileName}</span>
                                            <button onClick={() => downloadFile(doc.fileName, doc.fileData)} className="text-sm text-ease-blue font-semibold hover:underline flex items-center">
                                                <DownloadIcon /> <span className="ml-1">Download</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">Filing marked complete. Waiting for documents to be synced.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const CorporateDashboardPage: React.FC = () => {
    const { logout } = useCorporateAuth();
    const { tasks, generateCorporateCompliances, generateTaxCompliances, updateTaskDocuments } = useAssociateManager();
    
    // Navigation State
    type ViewType = 'dashboard' | 'mca-list' | 'mca-detail' | 'tax-landing' | 'tax-gst' | 'tax-tds' | 'tax-income' | 'tax-detail' | 'bank-analyzer';
    const [view, setView] = useState<ViewType>('dashboard');
    
    // Selection State
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedFY, setSelectedFY] = useState<string>('');
    const [selectedQuarterIdx, setSelectedQuarterIdx] = useState<number | null>(null);
    
    // GST Specific State
    const [gstFilingMode, setGstFilingMode] = useState<'Monthly' | 'QRMP'>('Monthly');
    
    const [isConsultingModalOpen, setIsConsultingModalOpen] = useState(false);
    const [consultationType, setConsultationType] = useState('');
    const [consultationUrgency, setConsultationUrgency] = useState('');
    const [consultationAvailability, setConsultationAvailability] = useState('');
    const [formError, setFormError] = useState('');

    // Constants for this mock corporate
    const CORPORATE_ID = 'CORP-8A4B';
    const COMPANY_NAME = 'Tech Solutions Pvt. Ltd.';
    const COMPANY_START_YEAR = 2022; // Mock Incorporation Year

    useEffect(() => {
        // Generate compliance tasks
        generateCorporateCompliances(CORPORATE_ID, COMPANY_NAME, COMPANY_START_YEAR);
        generateTaxCompliances(CORPORATE_ID, COMPANY_NAME, COMPANY_START_YEAR, gstFilingMode);
        
        // Set default FY to current year if not set
        if (!selectedFY) {
            const currentYear = new Date().getFullYear();
            setSelectedFY(`${currentYear-1}-${currentYear}`);
        }
    }, [generateCorporateCompliances, generateTaxCompliances, selectedFY, gstFilingMode]);

    // Generate FY Options for dropdown
    const fyOptions = useMemo(() => {
        const options = [];
        const currentYear = new Date().getFullYear();
        for (let y = COMPANY_START_YEAR; y < currentYear + 1; y++) {
            options.push(`${y}-${y + 1}`);
        }
        return options.reverse(); // Newest first
    }, []);

    // Filter Tasks based on FY
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => 
            t.profileName === CORPORATE_ID && 
            t.submissionId === -1 &&
            t.financialYear === selectedFY
        );
    }, [tasks, selectedFY]);

    const mcaTasks = useMemo(() => 
        filteredTasks.filter(t => !t.taxType).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), 
    [filteredTasks]);

    const gstTasks = useMemo(() => filteredTasks.filter(t => t.taxType === 'GST'), [filteredTasks]);
    const tdsTasks = useMemo(() => filteredTasks.filter(t => t.taxType === 'TDS'), [filteredTasks]);
    const incomeTasks = useMemo(() => filteredTasks.filter(t => t.taxType === 'IncomeTax'), [filteredTasks]);

    // Filter Tasks for Selected Quarter (Used in GST/TDS views)
    const getQuarterTasks = (taskList: Task[]) => {
        if (selectedQuarterIdx === null) return [];
        const qData = QUARTERS[selectedQuarterIdx];
        
        return taskList.filter(t => {
            // Check if task period matches Quarter Name (e.g., "Q1 (Apr-Jun)")
            if (t.period === qData.name) return true;
            // Check if task period is a Month name inside this quarter
            if (t.period && MONTHS.includes(t.period) && qData.months.includes(MONTHS.indexOf(t.period))) return true;
            return false;
        });
    };

    const handleUploadDocument = async (file: File, docType: string) => {
        if (!selectedTask) return;
        try {
            const dataUrl = await fileToDataURL(file);
            const newDoc: Document = {
                type: docType,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: dataUrl
            };
            updateTaskDocuments(selectedTask.taskId, [newDoc]);
            
            // Update local state to reflect change immediately
            setSelectedTask(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    documents: [...(prev.documents || []), newDoc]
                };
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload document");
        }
    };

    const handleNavigateToDetail = (task: Task, returnView: ViewType) => {
        setSelectedTask(task);
        // Store return path in component state or deduce
        setView('tax-detail');
    };

    const backFromDetail = () => {
        if (selectedTask?.taxType === 'GST') setView('tax-gst');
        else if (selectedTask?.taxType === 'TDS') setView('tax-tds');
        else if (selectedTask?.taxType === 'IncomeTax') setView('tax-income');
        else setView('mca-list');
    };

    // --- TICKET LOGIC (Existing) ---
    const initialTickets: Ticket[] = [
        { id: '#TKT-1024', title: 'Query on TDS return', status: 'In Progress' },
        { id: '#TKT-1023', title: 'Need Form 16', status: 'Resolved' },
    ];
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

    const handleSubmitRequest = () => {
        if (!consultationType || !consultationUrgency || !consultationAvailability) {
            setFormError('All fields are mandatory.');
            return;
        }
        setFormError('');
        setIsConsultingModalOpen(false);
        alert('Consultation request submitted successfully.');
    };

    // Reusable Quarter Cards for GST/TDS
    const QuarterGrid = ({ tasks, onClick }: { tasks: Task[], onClick: (idx: number) => void }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {QUARTERS.map((q, idx) => {
                const qTasks = tasks.filter(t => {
                    if (t.period === q.name) return true;
                    if (t.period && MONTHS.includes(t.period) && q.months.includes(MONTHS.indexOf(t.period))) return true;
                    return false;
                });
                const pendingCount = qTasks.filter(t => t.status === 'Pending' || t.status === 'Scheduled').length;
                const monthsList = q.months.map(m => MONTHS[m]).join(', ');
                
                return (
                    <div 
                        key={idx} 
                        onClick={() => onClick(idx)}
                        className={`bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 group ${selectedQuarterIdx === idx ? 'border-ease-blue ring-2 ring-ease-blue ring-offset-1' : 'border-gray-300'}`}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-ease-blue transition-colors">{q.name}</h3>
                            {pendingCount > 0 && (
                                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{pendingCount} Pending</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{monthsList}</p>
                    </div>
                );
            })}
        </div>
    );

    const FYSelector = () => (
        <select 
            value={selectedFY} 
            onChange={(e) => setSelectedFY(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="input py-1 px-3 text-sm font-medium border-gray-300 shadow-sm w-32"
        >
            {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
        </select>
    );

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="bg-white shadow-md rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="cursor-pointer" onClick={() => setView('dashboard')}>
                            <h1 className="text-2xl font-bold text-gray-800">{COMPANY_NAME}</h1>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mt-2">
                               <span>Corporate ID: <span className="font-semibold text-ease-blue">{CORPORATE_ID}</span></span>
                               <span>Assigned CE Manager: <span className="font-semibold text-ease-blue">Priya Singh</span></span>
                            </div>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0 space-x-4">
                             <button onClick={() => setIsConsultingModalOpen(true)} className="bg-ease-saffron text-ease-blue font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">Book Consulting</button>
                             <button onClick={logout} className="text-gray-500 hover:text-red-600 font-semibold py-2 px-4 rounded-lg transition-colors">Logout</button>
                        </div>
                    </div>
                </header>
                
                {/* DASHBOARD OVERVIEW */}
                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* MCA Manager */}
                            <DashboardCard 
                                title="MCA Compliance Manager" 
                                icon={<ShieldCheckIcon />} 
                                className="cursor-pointer hover:shadow-xl transition-all border border-transparent hover:border-ease-blue" 
                                onClick={() => setView('mca-list')}
                                headerAction={<FYSelector />}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">Manage annual filings, director KYC, and event-based compliances.</p>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{mcaTasks.filter(t => t.status === 'Pending').length} Due</span>
                                </div>
                                <div className="text-center pt-2">
                                    <span className="text-ease-blue text-sm font-semibold hover:underline">View All Compliances &rarr;</span>
                                </div>
                            </DashboardCard>

                            {/* TAXATION SUITE CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* GST */}
                                <div onClick={() => setView('tax-gst')} className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 border-blue-600">
                                    <div className="flex items-center mb-3 text-blue-700"><FileTextIcon /> <span className="font-bold text-lg">GST</span></div>
                                    <p className="text-sm text-gray-600">Monthly/Quarterly Returns, Annual Filing & Reconciliation.</p>
                                    <p className="text-xs text-gray-400 mt-3">Click to Manage &rarr;</p>
                                </div>
                                {/* TDS */}
                                <div onClick={() => setView('tax-tds')} className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 border-green-600">
                                    <div className="flex items-center mb-3 text-green-700"><FileTextIcon /> <span className="font-bold text-lg">TDS</span></div>
                                    <p className="text-sm text-gray-600">Salary (24Q) & Non-Salary (26Q) Returns.</p>
                                    <p className="text-xs text-gray-400 mt-3">Click to Manage &rarr;</p>
                                </div>
                                {/* Income Tax */}
                                <div onClick={() => setView('tax-income')} className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-t-4 border-orange-500">
                                    <div className="flex items-center mb-3 text-orange-600"><FileTextIcon /> <span className="font-bold text-lg">Income Tax</span></div>
                                    <p className="text-sm text-gray-600">Advance Tax Payments, ITR Filing & AIS Review.</p>
                                    <p className="text-xs text-gray-400 mt-3">Click to Manage &rarr;</p>
                                </div>
                            </div>

                            <AccountingPlaceholder selectedFY={selectedFY} />
                            {/* Document Vault removed — use Documents tab in Financials */}
                        </div>
                        
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            <ComplianceCalendar />
                            <AnalyticsPanel />
                            <TicketSystem tickets={tickets} />
                        </div>
                    </div>
                )}

                {/* BANK STATEMENT ANALYZER VIEW */}
                {view === 'bank-analyzer' && (
                    <BankStatementAnalyzer onBack={() => setView('dashboard')} />
                )}

                {/* TAX LANDING (Left as fallback, but bypassed from dashboard) */}
                {view === 'tax-landing' && (
                    <div className="animate-fade-in">
                        <button onClick={() => setView('dashboard')} className="mb-4 text-sm text-gray-500 hover:text-ease-blue">&larr; Back to Dashboard</button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Taxation Compliance Suite</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DashboardCard title="GST Compliance" icon={<FileTextIcon />} onClick={() => setView('tax-gst')} className="hover:border-blue-500 border-2 border-transparent h-64 flex flex-col justify-center items-center text-center">
                                <p className="text-gray-600">Manage GSTR-1, 3B, Annual Returns, and ITC.</p>
                                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700">Open GST Hub</button>
                            </DashboardCard>
                            <DashboardCard title="TDS Compliance" icon={<FileTextIcon />} onClick={() => setView('tax-tds')} className="hover:border-green-500 border-2 border-transparent h-64 flex flex-col justify-center items-center text-center">
                                <p className="text-gray-600">Manage 24Q, 26Q, and Certificate downloads.</p>
                                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-700">Open TDS Hub</button>
                            </DashboardCard>
                            <DashboardCard title="Income Tax" icon={<FileTextIcon />} onClick={() => setView('tax-income')} className="hover:border-orange-500 border-2 border-transparent h-64 flex flex-col justify-center items-center text-center">
                                <p className="text-gray-600">Advance Tax tracking, ITR-6 Filing, AIS/TIS.</p>
                                <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-orange-600">Open Income Tax Hub</button>
                            </DashboardCard>
                        </div>
                    </div>
                )}

                {/* GST HUB */}
                {view === 'tax-gst' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setView('dashboard')} className="text-sm text-gray-500 hover:text-ease-blue">&larr; Back to Dashboard</button>
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-50 px-3 py-1 rounded text-sm">
                                    Mode: <strong>{gstFilingMode}</strong>
                                    <button onClick={() => setGstFilingMode(prev => prev === 'Monthly' ? 'QRMP' : 'Monthly')} className="ml-2 text-blue-600 underline text-xs">Change</button>
                                </div>
                                <FYSelector />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">GST Compliance Hub</h1>
                        <ITCBalanceCard />
                        
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Quarterly Filings</h3>
                        <QuarterGrid tasks={gstTasks} onClick={(idx) => setSelectedQuarterIdx(idx)} />

                        {selectedQuarterIdx !== null && (
                            <div className="mb-8">
                                <ComplianceList 
                                    title={`Filings for ${QUARTERS[selectedQuarterIdx].name}`}
                                    tasks={getQuarterTasks(gstTasks)}
                                    onViewDetail={(t) => handleNavigateToDetail(t, 'tax-gst')}
                                />
                            </div>
                        )}

                        <h3 className="text-lg font-bold text-gray-700 mb-4 mt-8 border-t pt-8">Annual Returns</h3>
                        <ComplianceList 
                            title="Annual Forms (GSTR-9 / 9C)"
                            tasks={gstTasks.filter(t => t.period === 'Annual')}
                            onViewDetail={(t) => handleNavigateToDetail(t, 'tax-gst')}
                        />
                    </div>
                )}

                {/* TDS HUB */}
                {view === 'tax-tds' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setView('dashboard')} className="text-sm text-gray-500 hover:text-ease-blue">&larr; Back to Dashboard</button>
                            <FYSelector />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">TDS Compliance Hub</h1>
                        
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Quarterly Returns (24Q / 26Q)</h3>
                        <QuarterGrid tasks={tdsTasks} onClick={(idx) => setSelectedQuarterIdx(idx)} />

                        {selectedQuarterIdx !== null && (
                            <div className="mb-8">
                                <ComplianceList 
                                    title={`TDS Returns for ${QUARTERS[selectedQuarterIdx].name}`}
                                    tasks={getQuarterTasks(tdsTasks)}
                                    onViewDetail={(t) => handleNavigateToDetail(t, 'tax-tds')}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* INCOME TAX HUB */}
                {view === 'tax-income' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setView('dashboard')} className="text-sm text-gray-500 hover:text-ease-blue">&larr; Back to Dashboard</button>
                            <FYSelector />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Income Tax Compliance Hub</h1>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 mb-4">Advance Tax Schedule</h3>
                                <ComplianceList 
                                    title="Quarterly Advance Tax"
                                    tasks={incomeTasks.filter(t => t.frequency === 'Quarterly')}
                                    onViewDetail={(t) => handleNavigateToDetail(t, 'tax-income')}
                                />
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 mb-4">Annual Filing</h3>
                                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                    <h4 className="font-bold text-gray-800 mb-2">ITR Filing (ITR-6)</h4>
                                    <p className="text-sm text-gray-600 mb-4">Upload your audited financials and 26AS/AIS to proceed with corporate tax filing.</p>
                                    {incomeTasks.filter(t => t.frequency === 'Annual').map(task => (
                                        <div key={task.taskId} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                                            <span className="font-semibold text-sm">{task.serviceName}</span>
                                            <button onClick={() => handleNavigateToDetail(task, 'tax-income')} className="text-ease-blue font-bold text-xs">View Details &rarr;</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h4 className="font-bold text-gray-800 mb-2">AIS / 26AS</h4>
                                    <button className="w-full border-2 border-dashed border-gray-300 p-4 rounded text-gray-500 text-sm hover:bg-gray-50 hover:border-gray-400">
                                        + Upload AIS/TIS Documents for Analysis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* GENERIC DETAIL VIEW */}
                {view === 'tax-detail' && selectedTask && (
                    <ComplianceDetail 
                        task={selectedTask} 
                        onBack={backFromDetail} 
                        onUpload={handleUploadDocument}
                    />
                )}

                {/* MCA LIST VIEW */}
                {view === 'mca-list' && (
                    <div>
                        <button onClick={() => setView('dashboard')} className="mb-4 text-sm text-gray-500 hover:text-ease-blue">&larr; Back to Dashboard</button>
                        <ComplianceList 
                            title="MCA Compliance Manager"
                            tasks={mcaTasks} 
                            onViewDetail={(t) => handleNavigateToDetail(t, 'mca-list')}
                            headerControls={<FYSelector />}
                        />
                    </div>
                )}

                {/* MCA DETAIL VIEW */}
                {view === 'mca-detail' && selectedTask && (
                    <ComplianceDetail 
                        task={selectedTask} 
                        onBack={() => setView('mca-list')} 
                        onUpload={handleUploadDocument}
                    />
                )}

            </div>
            
            {/* Consultation Modal */}
            {isConsultingModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Book Consulting Session</h2>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Type of Consultation</label>
                            <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)} className="input w-full">
                                <option value="">Select a type...</option>
                                <option value="Taxation">Taxation</option>
                                <option value="Finance">Finance</option>
                                <option value="Technical Support">Technical Support</option>
                                <option value="Legal">Legal</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Consultation Category</label>
                            <select value={consultationUrgency} onChange={(e) => setConsultationUrgency(e.target.value)} className="input w-full">
                                <option value="">Select urgency...</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Normal">Normal</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Client Availability</label>
                            <select value={consultationAvailability} onChange={(e) => setConsultationAvailability(e.target.value)} className="input w-full">
                                <option value="">Select availability...</option>
                                <option value="Office Timings (10 AM – 7 PM)">Office Timings (10 AM – 7 PM)</option>
                                <option value="24 Hours">24 Hours</option>
                            </select>
                        </div>

                        {formError && <p className="text-sm text-red-600">{formError}</p>}

                        <div className="flex justify-end space-x-3 pt-2">
                            <button onClick={() => setIsConsultingModalOpen(false)} className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleSubmitRequest} className="px-4 py-2 rounded-md text-white bg-ease-blue hover:bg-ease-blue/90">
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CorporateDashboardPage;
