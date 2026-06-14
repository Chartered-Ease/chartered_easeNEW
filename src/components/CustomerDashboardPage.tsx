import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { useClientManager, Document, downloadFile } from '../hooks/useProfile';
import { useAssociateManager } from '../hooks/useAssociateManager';
import { V1Service, getEntityLabel, getServicesForEntity } from '../data/entityServiceCatalog';
import { createProject } from '../lib/projects';

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const SwitchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" /></svg>;

const statusStyles: Record<string, string> = {
    Pending: 'bg-orange-50 text-orange-700 border-orange-100',
    'Pending Notarization': 'bg-orange-50 text-orange-700 border-orange-100',
    'Awaiting Docs': 'bg-orange-50 text-orange-700 border-orange-100',
    'PF Registration Request Submitted': 'bg-blue-50 text-ease-blue border-blue-100',
    'PF Return Filing Request Submitted': 'bg-blue-50 text-ease-blue border-blue-100',
    'Board Resolution Draft Generated': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Startup India Registration Request Submitted': 'bg-purple-50 text-ease-purple border-purple-100',
    'Trademark Filing Request Submitted': 'bg-purple-50 text-ease-purple border-purple-100',
    'HUF ITR Filing Request Submitted': 'bg-blue-50 text-ease-blue border-blue-100',
    'Capital Gains Reporting Request Submitted': 'bg-blue-50 text-ease-blue border-blue-100',
    'Tax Planning Request Submitted': 'bg-purple-50 text-ease-purple border-purple-100',
    'Tax Notice Review Submitted': 'bg-orange-50 text-orange-700 border-orange-100',
    'PAN Application Request Submitted': 'bg-blue-50 text-ease-blue border-blue-100',
    'PAN Correction Request Submitted': 'bg-purple-50 text-ease-purple border-purple-100',
    'PAN Aadhaar Link Request Submitted': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'In Progress': 'bg-blue-50 text-ease-blue border-blue-100',
    Processing: 'bg-blue-50 text-ease-blue border-blue-100',
    'Assigned to Associate': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Under Review': 'bg-purple-50 text-ease-purple border-purple-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Filed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Statements Generated': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Rejected: 'bg-red-50 text-red-700 border-red-100',
    Scheduled: 'bg-teal-50 text-teal-700 border-teal-100',
    'Nil Return - Under Processing': 'bg-blue-50 text-ease-blue border-blue-100',
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

interface NotificationItem {
    id: string;
    appId?: number;
    title: string;
    message: string;
    time: string;
    tone: 'blue' | 'green' | 'orange' | 'purple';
}

const sidebarItems = [
    'Dashboard',
    'Upload Documents',
    'My Services',
    'Compliance Tracker',
    'Notifications',
    'Support',
];

const getStatusStyle = (status: string) => statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

const getProgressForStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('completed') || normalized.includes('filed')) return 100;
    if (normalized.includes('generated')) return 100;
    if (normalized.includes('review')) return 72;
    if (normalized.includes('assigned') || normalized.includes('processing') || normalized.includes('progress')) return 56;
    if (normalized.includes('submitted')) return 28;
    if (normalized.includes('pending') || normalized.includes('awaiting')) return 28;
    if (normalized.includes('rejected')) return 18;
    return 42;
};

const getDueLabel = (index: number) => {
    const labels = ['Due in 4 days', 'Due in 9 days', 'Due this month', 'On track'];
    return labels[index % labels.length];
};

const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getNotificationToneClass = (tone: NotificationItem['tone']) => {
    const styles = {
        blue: 'bg-blue-50 text-ease-blue border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        purple: 'bg-purple-50 text-ease-purple border-purple-100',
    };

    return styles[tone];
};

const CircularScore = ({ value }: { value: number }) => {
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r={radius} className="fill-none stroke-blue-100" strokeWidth="10" />
                <motion.circle
                    cx="56"
                    cy="56"
                    r={radius}
                    className="fill-none stroke-ease-electric"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-slate-950">{value}%</span>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Health</span>
            </div>
        </div>
    );
};

const CustomerDashboardPage: React.FC = () => {
    const { user, switchEntity } = useAuth();
    const { setPage, setSelectedClientId, setSelectedProfileId, setSelectedServiceId } = useAppContext();
    const { getClient, findClientsForUser } = useClientManager();
    const { tasks, staff: associates } = useAssociateManager();

    const client = user?.clientId ? getClient(user.clientId) : null;
    const allUserEntities = user ? findClientsForUser(user) : [];
    const [view, setView] = useState<'list' | 'details'>('list');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [showEntitySwitcher, setShowEntitySwitcher] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [dashboardPanel, setDashboardPanel] = useState<'pending' | 'ai' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [pendingProjectService, setPendingProjectService] = useState<V1Service | null>(null);
    const [projectEntityId, setProjectEntityId] = useState('');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [projectCreationError, setProjectCreationError] = useState('');
    const activeFilingsRef = useRef<HTMLElement | null>(null);
    const servicesSectionRef = useRef<HTMLElement | null>(null);
    const availableServices = useMemo(() => client ? getServicesForEntity(client.entityType) : [], [client]);

    useEffect(() => {
        if (!client) return;

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
                outputDocuments: task?.acknowledgements || sub.outputDocuments || [],
                filingType: sub.filingType,
                bookedSlot: sub.bookedSlot,
                extractedData: sub.extractedData,
            };
        }).sort((a: Application, b: Application) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        setApplications(processedApps);
    }, [client, tasks, associates]);

    if (!client) {
        return (
            <div className="min-h-screen bg-ease-bg p-12 text-center">
                <div className="glass-card mx-auto max-w-md p-8">Loading profile...</div>
            </div>
        );
    }

    const projectEntityOptions = allUserEntities.filter(entity => entity.entityType === client.entityType);
    const inProgressCount = applications.filter(app => !['Completed', 'Filed', 'Rejected'].includes(app.status)).length;
    const completedCount = applications.filter(app => ['Completed', 'Filed'].includes(app.status)).length;
    const complianceScore = applications.length === 0
        ? 0
        : Math.min(96, Math.max(72, 82 + completedCount * 2 - Math.max(0, inProgressCount - 2)));
    const activeFilings = applications.slice(0, 4);
    const activityFeed = applications.length > 0 ? applications.slice(0, 5) : [
        { id: 1, serviceName: 'Profile created', status: 'Completed', submittedAt: new Date().toLocaleString(), referenceId: 'START', clientProfileName: client.name, documents: [], assignedAssociateName: null, outputDocuments: [] },
        { id: 2, serviceName: 'Services ready', status: 'In Progress', submittedAt: new Date().toLocaleString(), referenceId: 'SERVICES', clientProfileName: client.name, documents: [], assignedAssociateName: null, outputDocuments: [] },
    ];

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
        setView('details');
    };

    const handleStartService = (service: V1Service) => {
        if (service.route === 'contact') {
            setPage('contact');
            return;
        }

        setPendingProjectService(service);
        setProjectEntityId(client.id);
        setProjectCreationError('');
    };

    const closeProjectLauncher = () => {
        if (isCreatingProject) return;
        setPendingProjectService(null);
        setProjectEntityId('');
        setProjectCreationError('');
    };

    const handleConfirmProjectLaunch = async () => {
        if (!pendingProjectService) return;

        if (!user?.firebaseUid) {
            setProjectCreationError('Please continue with Google login so this project can be linked to your Firebase account.');
            return;
        }

        const matchingEntities = allUserEntities.filter(entity => entity.entityType === client.entityType);
        const selectedEntity = matchingEntities.find(entity => entity.id === projectEntityId);

        if (!selectedEntity) {
            setProjectCreationError('Please select or create an entity before starting this service.');
            return;
        }

        setIsCreatingProject(true);
        setProjectCreationError('');

        try {
            await createProject({
                userId: user.firebaseUid,
                entityId: selectedEntity.id,
                entityName: selectedEntity.name,
                entityType: getEntityLabel(selectedEntity.entityType),
                service: pendingProjectService.name,
            });

            switchEntity(selectedEntity.id);
            setSelectedClientId(selectedEntity.id);
            setSelectedProfileId(null);
            setSelectedServiceId(pendingProjectService.key);
            setPendingProjectService(null);
            setPage(pendingProjectService.route);
        } catch (error: any) {
            setProjectCreationError(error?.message || 'Unable to create project. Please try again.');
        } finally {
            setIsCreatingProject(false);
        }
    };

    const scrollToAvailableServices = () => {
        servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const scrollToActiveFilings = () => {
        activeFilingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = (values: Array<string | null | undefined>) =>
        values.some(value => (value || '').toLowerCase().includes(normalizedSearchQuery));
    const filingSearchResults = normalizedSearchQuery
        ? applications.filter(app => matchesSearch([
            app.serviceName,
            app.clientProfileName,
            app.referenceId,
            app.status,
            app.assignedAssociateName,
        ])).slice(0, 5)
        : [];
    const serviceSearchResults = normalizedSearchQuery
        ? availableServices.filter(service => matchesSearch([
            service.name,
            service.description,
            service.mode,
        ])).slice(0, 5)
        : [];
    const hasSearchResults = filingSearchResults.length > 0 || serviceSearchResults.length > 0;

    const pendingActionItems = applications.filter(app => {
        const status = app.status.toLowerCase();
        return !['completed', 'filed', 'rejected'].includes(status)
            && (app.documents.length === 0 || status.includes('pending') || status.includes('awaiting') || status.includes('review') || status.includes('submitted'));
    }).slice(0, 5);
    const pendingActionCount = applications.length === 0 ? 1 : Math.max(pendingActionItems.length, inProgressCount);
    const recommendedServices = availableServices.slice(0, 3);
    const aiRecommendationItems = [
        {
            title: 'Keep core documents ready',
            copy: 'Upload reusable PAN, Aadhaar, bank proof and entity documents once so future filings move faster.',
            action: 'Upload Docs',
            onClick: () => setPage('document-vault'),
        },
        {
            title: recommendedServices[0] ? `Start ${recommendedServices[0].name}` : 'Start your first filing',
            copy: recommendedServices[0]?.description || 'Choose an available service and create your first compliance workflow.',
            action: 'Open Services',
            onClick: scrollToAvailableServices,
        },
        {
            title: applications.length > 0 ? 'Review live filing status' : 'Build compliance history',
            copy: applications.length > 0 ? 'Check active work, acknowledgements and pending document movement from the tracker.' : 'Once you submit a filing, status and recommendations will become more personalized.',
            action: applications.length > 0 ? 'Track Status' : 'View Services',
            onClick: applications.length > 0 ? scrollToActiveFilings : scrollToAvailableServices,
        },
    ];

    const handleSwitchEntity = (clientId: string) => {
        switchEntity(clientId);
        setShowEntitySwitcher(false);
    };

    const handleDownload = (fileName: string, fileData?: string) => {
        downloadFile(fileName, fileData);
    };

    const handleDownloadAll = (app: Application) => {
        app.outputDocuments.forEach(doc => handleDownload(doc.fileName, doc.fileData));
    };

    const getAcknowledgementLabel = (app: Application) => {
        const service = app.serviceName.toLowerCase();
        if (service.includes('income tax') || service.includes('itr')) return 'ITR-V Acknowledgement';
        if (service.includes('capital gains reporting')) return 'ITR-V Acknowledgement';
        if (service.includes('gst return')) return 'GST Filing Receipt';
        if (service.includes('gst registration')) return 'GST Registration Certificate';
        if (service.includes('incorporation')) return 'Certificate of Incorporation';
        if (service.includes('shop act')) return 'Shop Act License';
        if (service.includes('udyam')) return 'Udyam Certificate';
        if (service.includes('project report')) return 'Project Report PDF';
        if (service.includes('tax planning')) return 'Tax Planning Summary';
        if (service.includes('tax notice')) return 'Notice Reply / Review Summary';
        if (service.includes('pan application')) return 'PAN Application Acknowledgement';
        if (service.includes('pan correction')) return 'PAN Correction Acknowledgement';
        if (service.includes('pan aadhaar') || service.includes('pan-aadhaar')) return 'PAN-Aadhaar Link Confirmation';
        if (service.includes('llp annual') || service.includes('llp form')) return 'LLP Filing Acknowledgement';
        if (service.includes('roc filing')) return 'ROC Filing Acknowledgement';
        if (service.includes('board resolution')) return 'Board Resolution Draft';
        if (service.includes('startup india')) return 'Startup India / DPIIT Acknowledgement';
        if (service.includes('trademark')) return 'Trademark Filing Acknowledgement';
        if (service.includes('194-ia')) return 'Form 26QB Acknowledgement';
        if (service.includes('partnership registration')) return 'Partnership Deed Draft';
        if (service.includes('accounting')) return 'P&L / Balance Sheet';
        if (service.includes('pf registration')) return 'PF Registration Certificate';
        if (service.includes('pf return')) return 'PF Return Acknowledgement';
        return 'Service Output Document';
    };

    const notificationItems: NotificationItem[] = applications.flatMap((app) => {
        const normalizedStatus = app.status.toLowerCase();
        const items: NotificationItem[] = [];

        if (app.outputDocuments.length > 0) {
            items.push({
                id: `${app.id}-ack`,
                appId: app.id,
                title: `${getAcknowledgementLabel(app)} available`,
                message: `${app.serviceName} acknowledgement has been uploaded and is ready to download.`,
                time: app.submittedAt,
                tone: 'green',
            });
        }

        if (normalizedStatus.includes('submitted')) {
            items.push({
                id: `${app.id}-submitted`,
                appId: app.id,
                title: `${app.serviceName} submitted`,
                message: `Your request is received. Reference ${app.referenceId} is now in the processing queue.`,
                time: app.submittedAt,
                tone: 'blue',
            });
        } else if (normalizedStatus.includes('processing') || normalizedStatus.includes('progress') || normalizedStatus.includes('assigned')) {
            items.push({
                id: `${app.id}-processing`,
                appId: app.id,
                title: `${app.serviceName} is being processed`,
                message: app.assignedAssociateName ? `${app.assignedAssociateName} is working on this filing.` : 'The compliance team has started processing this filing.',
                time: app.submittedAt,
                tone: 'purple',
            });
        } else if (normalizedStatus.includes('review')) {
            items.push({
                id: `${app.id}-review`,
                appId: app.id,
                title: `${app.serviceName} under review`,
                message: 'Documents and details are being checked before filing preparation.',
                time: app.submittedAt,
                tone: 'orange',
            });
        } else if (normalizedStatus.includes('completed') || normalizedStatus.includes('filed') || normalizedStatus.includes('generated')) {
            items.push({
                id: `${app.id}-completed`,
                appId: app.id,
                title: `${app.serviceName} completed`,
                message: 'The latest output is available in application details.',
                time: app.submittedAt,
                tone: 'green',
            });
        } else if (normalizedStatus.includes('pending') || normalizedStatus.includes('awaiting')) {
            items.push({
                id: `${app.id}-pending`,
                appId: app.id,
                title: `${app.serviceName} needs attention`,
                message: 'Some document or review action may be pending for this service.',
                time: app.submittedAt,
                tone: 'orange',
            });
        }

        return items;
    });

    const unreadNotificationCount = notificationItems.length;

    const handleNotificationClick = (notification: NotificationItem) => {
        if (!notification.appId) return;
        const app = applications.find(application => application.id === notification.appId);
        if (app) {
            setShowNotifications(false);
            handleViewDetails(app);
        }
    };

    if (view === 'details' && selectedApp) {
        const progress = getProgressForStatus(selectedApp.status);
        const timeline = [
            ['Documents Uploaded', progress >= 25],
            ['Under Review', progress >= 55],
            ['Filing in Progress', progress >= 75],
            ['Filed Successfully', progress === 100],
        ];

        return (
            <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <button onClick={() => { setSelectedApp(null); setView('list'); }} className="mb-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-ease-blue">
                        <BackArrowIcon /> <span className="ml-2">Back to Command Center</span>
                    </button>

                    <div className="glass-card overflow-hidden">
                        <div className="mesh-surface p-7 text-white">
                            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.26em] text-blue-100">Application cockpit</p>
                                    <h1 className="mt-3 font-display text-3xl font-bold">{selectedApp.serviceName}</h1>
                                    <p className="mt-2 text-sm text-blue-100">Reference ID: <span className="font-mono text-white">{selectedApp.referenceId}</span></p>
                                </div>
                                <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${getStatusStyle(selectedApp.status)}`}>{selectedApp.status}</span>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-6">
                                <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                    <div className="mb-5 flex items-center justify-between">
                                        <h2 className="text-lg font-black text-slate-950">Live Filing Timeline</h2>
                                        <span className="text-sm font-bold text-ease-blue">{progress}%</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-0.5 bg-slate-100" />
                                        <div className="space-y-5">
                                            {timeline.map(([label, done], index) => (
                                                <motion.div key={String(label)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07 }} className="relative flex items-center gap-4">
                                                    <span className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-xs font-black shadow ${done ? 'bg-ease-green text-white' : 'bg-slate-200 text-slate-500'}`}>{done ? '✓' : index + 1}</span>
                                                    <span className={`font-bold ${done ? 'text-slate-950' : 'text-slate-500'}`}>{label}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-950">Uploaded Documents</h3>
                                    {selectedApp.documents.length > 0 ? (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {selectedApp.documents.map((doc, index) => (
                                                <div key={`${doc.fileName}-${index}`} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="rounded-2xl bg-blue-50 p-2 text-ease-blue"><FileIcon /></span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-slate-900">{doc.fileName}</p>
                                                            <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()} · Verified</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDownload(doc.fileName, doc.fileData)} className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-ease-blue"><DownloadIcon /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-slate-500">No documents uploaded.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-950">Processing Info</h3>
                                    <div className="mt-4 space-y-4 text-sm">
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">Submitted</span><span className="font-bold text-slate-900">{selectedApp.submittedAt}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">Profile</span><span className="font-bold text-slate-900">{selectedApp.clientProfileName}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">Associate</span><span className="font-bold text-slate-900">{selectedApp.assignedAssociateName || 'Pending Assignment'}</span></div>
                                    </div>
                                </div>

                                <div className="rounded-[1.4rem] border border-purple-100 bg-purple-50 p-5 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-wide text-ease-purple">AI summary</p>
                                    <p className="mt-3 text-sm leading-6 text-slate-700">Documents are tracked in this workspace. The next update will appear automatically once the associate moves the filing ahead.</p>
                                </div>

                                {(selectedApp.status === 'Completed' || selectedApp.status === 'Filed' || selectedApp.outputDocuments.length > 0) && (
                                    <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                                        <h3 className="text-lg font-black text-emerald-800">Acknowledgements</h3>
                                        {selectedApp.outputDocuments.length > 0 ? (
                                            <div className="mt-4 space-y-3">
                                                {selectedApp.outputDocuments.map((doc, index) => (
                                                    <button key={`${doc.fileName}-${index}`} onClick={() => handleDownload(doc.fileName, doc.fileData)} className="flex w-full items-center justify-between rounded-2xl bg-white p-3 text-left shadow-sm">
                                                        <span className="text-sm font-bold text-slate-900">{getAcknowledgementLabel(selectedApp)}</span>
                                                        <DownloadIcon />
                                                    </button>
                                                ))}
                                                <button onClick={() => handleDownloadAll(selectedApp)} className="blue-glow-button w-full">Download All</button>
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-sm text-emerald-700">Output documents will appear here shortly.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ease-bg">
            <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr]">
                <aside className="hidden lg:block">
                    <div className="sticky top-24 glass-card overflow-hidden p-3">
                        <div className="mesh-surface rounded-[1.35rem] p-4 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.26em] text-blue-100">Workspace</p>
                            <p className="mt-2 text-lg font-black">{client.name}</p>
                            <p className="mt-1 text-xs text-blue-100">{getEntityLabel(client.entityType)}</p>
                        </div>
                        <nav className="mt-3 space-y-1">
                            {sidebarItems.map((item, index) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        if (item === 'Upload Documents') setPage('document-vault');
                                        if (item === 'My Services') scrollToAvailableServices();
                                        if (item === 'Compliance Tracker') scrollToActiveFilings();
                                        if (item === 'Notifications') setShowNotifications(true);
                                        if (item === 'Support') setPage('contact');
                                    }}
                                    className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition duration-300 ${index === 0 ? 'bg-ease-blue text-white shadow-lg shadow-ease-blue/20' : 'text-slate-600 hover:bg-blue-50 hover:text-ease-blue'}`}
                                >
                                    <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-white' : 'bg-slate-300 group-hover:bg-ease-blue'}`} />
                                    <span className="flex-1">{item}</span>
                                    {item === 'Notifications' && unreadNotificationCount > 0 && (
                                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700">{unreadNotificationCount}</span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className="space-y-6">
                    <section className="glass-card relative z-30 overflow-visible p-5 md:p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-ease-blue text-xl font-black text-white shadow-lg shadow-ease-blue/20">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Compliance Command Center</p>
                                    <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Welcome back, {client.name}</h1>
                                    <p className="mt-2 text-sm text-slate-500">Your compliance ecosystem is running smoothly.</p>

                                    <div className="relative mt-3">
                                        <button onClick={() => setShowEntitySwitcher(prev => !prev)} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-ease-blue">
                                            Managing {getEntityLabel(client.entityType)} <SwitchIcon />
                                        </button>

                                        {showEntitySwitcher && (
                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 top-full z-50 mt-2 w-72 rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
                                                {allUserEntities.map(entity => (
                                                    <button key={entity.id} onClick={() => handleSwitchEntity(entity.id)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${entity.id === client.id ? 'bg-blue-50 text-ease-blue' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                        <span className="truncate">{entity.name}</span>
                                                        {entity.id === client.id && <span className="h-2 w-2 rounded-full bg-ease-blue" />}
                                                    </button>
                                                ))}
                                                <button onClick={() => setPage('entity-onboarding')} className="mt-1 w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-ease-blue hover:bg-blue-50">+ Add New Entity</button>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:w-auto">
                                    <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 shadow-sm transition focus-within:border-ease-electric/40 focus-within:ring-4 focus-within:ring-ease-electric/10">
                                        <SearchIcon />
                                        <input
                                            value={searchQuery}
                                            onChange={(event) => {
                                                setSearchQuery(event.target.value);
                                                setShowSearchResults(true);
                                            }}
                                            onFocus={() => setShowSearchResults(true)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Escape') {
                                                    setSearchQuery('');
                                                    setShowSearchResults(false);
                                                }
                                            }}
                                            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 sm:w-64"
                                            placeholder="Search filings..."
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setShowSearchResults(false);
                                                }}
                                                className="text-xs font-black text-slate-400 transition hover:text-ease-blue"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {showSearchResults && normalizedSearchQuery && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/15"
                                        >
                                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Search results</p>
                                            </div>
                                            <div className="max-h-[360px] overflow-y-auto p-3">
                                                {hasSearchResults ? (
                                                    <div className="space-y-4">
                                                        {filingSearchResults.length > 0 && (
                                                            <div>
                                                                <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Filings</p>
                                                                <div className="space-y-2">
                                                                    {filingSearchResults.map(app => (
                                                                        <button
                                                                            key={`search-app-${app.id}`}
                                                                            onClick={() => {
                                                                                setSearchQuery('');
                                                                                setShowSearchResults(false);
                                                                                handleViewDetails(app);
                                                                            }}
                                                                            className="group w-full rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-ease-electric/30 hover:bg-blue-50/50"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-sm font-black text-slate-950">{app.serviceName}</p>
                                                                                    <p className="mt-1 text-xs font-bold text-slate-400">{app.referenceId} - {app.status}</p>
                                                                                </div>
                                                                                <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-ease-blue"><ChevronRightIcon /></span>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {serviceSearchResults.length > 0 && (
                                                            <div>
                                                                <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Services</p>
                                                                <div className="space-y-2">
                                                                    {serviceSearchResults.map(service => (
                                                                        <button
                                                                            key={`search-service-${service.key}`}
                                                                            onClick={() => {
                                                                                setSearchQuery('');
                                                                                setShowSearchResults(false);
                                                                                handleStartService(service);
                                                                            }}
                                                                            className="group w-full rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate text-sm font-black text-slate-950">{service.name}</p>
                                                                                    <p className="mt-1 text-xs leading-5 text-slate-500">{service.description}</p>
                                                                                </div>
                                                                                <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"><ChevronRightIcon /></span>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                                                        <p className="text-sm font-black text-slate-900">No matching filings or services</p>
                                                        <p className="mt-1 text-xs leading-5 text-slate-500">Try GST, ITR, ROC, PAN, PF or a reference ID.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                <button onClick={() => setShowNotifications(true)} className="relative rounded-full bg-white p-3 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-ease-blue">
                                    <BellIcon />
                                    {unreadNotificationCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow-lg shadow-orange-500/30">
                                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                        </span>
                                    )}
                                </button>
                                <button onClick={scrollToAvailableServices} className="blue-glow-button whitespace-nowrap">New Filing</button>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Compliance Health</p>
                                    <h2 className="mt-2 text-xl font-black text-slate-950">{applications.length === 0 ? 'Not started yet' : 'Operating cleanly'}</h2>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${applications.length === 0 ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {applications.length === 0 ? 'No filings' : 'Live'}
                                </span>
                            </div>
                            <div className="mt-6 flex items-center justify-center"><CircularScore value={complianceScore} /></div>
                            <div className="mt-6 grid grid-cols-3 gap-3">
                                {[
                                    ['Total', applications.length],
                                    ['Active', inProgressCount],
                                    ['Done', completedCount],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-3xl bg-slate-50 p-3 text-center">
                                        <p className="font-display text-2xl font-bold text-slate-950">{value}</p>
                                        <p className="text-xs font-bold text-slate-400">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {[
                                { title: 'Active Filings', value: inProgressCount, copy: 'GST, ITR, ROC, TDS workflows moving', tone: 'bg-blue-50 text-ease-blue', onClick: scrollToActiveFilings },
                                { title: 'Pending Actions', value: pendingActionCount, copy: 'Documents or reviews that may need action', tone: 'bg-orange-50 text-orange-700', onClick: () => setDashboardPanel('pending') },
                                { title: 'AI Recommendations', value: aiRecommendationItems.length, copy: 'Tax savings and document checks queued', tone: 'bg-purple-50 text-ease-purple', onClick: () => setDashboardPanel('ai') },
                            ].map(({ title, value, copy, tone, onClick }, index) => (
                                <motion.button type="button" onClick={onClick} key={String(title)} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} whileHover={{ y: -6 }} className="glass-card p-5 text-left transition hover:border-ease-electric/30 hover:shadow-2xl hover:shadow-ease-electric/10">
                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{title}</span>
                                    <p className="mt-6 font-display text-4xl font-bold text-slate-950">{value}</p>
                                    <p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p>
                                    <p className="mt-5 text-xs font-black uppercase tracking-wide text-ease-blue">Open</p>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    <section ref={activeFilingsRef} className="grid gap-6 scroll-mt-28 xl:grid-cols-[1.35fr_0.65fr]">
                        <div className="glass-card p-5 md:p-6">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Active filings</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-950">Live work in motion</h2>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage('document-vault')} className="soft-button px-4 py-2 text-sm">Upload Docs</button>
                                    <button onClick={scrollToActiveFilings} className="soft-button px-4 py-2 text-sm">Track Status</button>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                {activeFilings.length > 0 ? activeFilings.map((app, index) => {
                                    const progress = getProgressForStatus(app.status);
                                    return (
                                        <motion.button key={`${app.id}-${app.serviceName}`} onClick={() => handleViewDetails(app)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -5 }} className="rounded-[1.4rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-ease-electric/30 hover:shadow-xl">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-black text-slate-950">{app.serviceName}</h3>
                                                    <p className="mt-1 text-xs font-bold text-slate-400">{getDueLabel(index)}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusStyle(app.status)}`}>{app.status}</span>
                                            </div>
                                            <div className="mt-5">
                                                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                                    <span>{app.assignedAssociateName || 'Associate queue'}</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} transition={{ duration: 0.8 }} className="h-full origin-left rounded-full bg-ease-electric" />
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                }) : (
                                    <div className="md:col-span-2 rounded-[1.4rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center">
                                        <p className="text-lg font-black text-slate-950">No active filings yet</p>
                                        <p className="mt-2 text-sm text-slate-500">Start a service from Available Services below. Once submitted, live progress will appear here.</p>
                                        <button onClick={scrollToAvailableServices} className="blue-glow-button mt-5 px-5 py-2.5 text-sm">Go to Available Services</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-950">Activity Feed</h2>
                                <span className="rounded-full bg-ease-green/10 px-3 py-1 text-xs font-black text-ease-green">Realtime</span>
                            </div>
                            <div className="mt-5 space-y-4">
                                {activityFeed.map((app, index) => (
                                    <motion.div key={`${app.id}-activity-${index}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="relative rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                                        <span className="absolute -left-1 top-6 h-3 w-3 rounded-full bg-ease-electric shadow-[0_0_0_5px_rgba(37,99,235,0.12)]" />
                                        <p className="text-sm font-black text-slate-950">{app.serviceName}</p>
                                        <p className="mt-1 text-xs text-slate-500">{app.status} · {new Date(app.submittedAt).toLocaleDateString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section ref={servicesSectionRef} className="glass-card scroll-mt-28 p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Service launcher</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-950">Available Services</h2>
                                <p className="mt-1 text-sm text-slate-500">Services available for {getEntityLabel(client.entityType)}.</p>
                            </div>
                        </div>

                        {availableServices.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {availableServices.map((service, index) => (
                                    <motion.div key={service.key} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} whileHover={{ y: -5 }} className="rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm">
                                        <h3 className="text-lg font-black text-slate-950">{service.name}</h3>
                                        <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">{service.description}</p>
                                        <button onClick={() => handleStartService(service)} className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 ${service.route === 'contact' ? 'bg-ease-blue shadow-ease-blue/20' : 'bg-ease-green shadow-emerald-700/20'}`}>
                                            {service.route === 'contact' ? 'Talk to Expert' : 'Get Started'}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">No V1 services are configured for this entity type yet.</div>
                        )}
                    </section>
                </main>
            </div>

            {pendingProjectService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <button aria-label="Close project launcher" onClick={closeProjectLauncher} className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/25"
                    >
                        <div className="mesh-surface p-6 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Create project</p>
                            <h2 className="mt-2 text-2xl font-black">{pendingProjectService.name}</h2>
                            <p className="mt-2 text-sm leading-6 text-blue-100">Select the entity this service belongs to. A linked project will be created before the workflow opens.</p>
                        </div>

                        <div className="space-y-5 bg-ease-bg p-6">
                            {projectEntityOptions.length > 0 ? (
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">Entity</span>
                                    <select
                                        value={projectEntityId}
                                        onChange={(event) => setProjectEntityId(event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition focus:border-ease-electric focus:ring-4 focus:ring-blue-100"
                                    >
                                        {projectEntityOptions.map(entity => (
                                            <option key={entity.id} value={entity.id}>
                                                {entity.name} - {getEntityLabel(entity.entityType)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center">
                                    <p className="font-black text-slate-950">No matching entity found</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">Create an entity first, then start this service again.</p>
                                    <button onClick={() => setPage('entity-onboarding')} className="blue-glow-button mt-4 px-5 py-2.5 text-sm">Create Entity</button>
                                </div>
                            )}

                            <div className="rounded-3xl border border-slate-100 bg-white p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Project status</p>
                                        <p className="mt-1 font-black text-slate-950">Pending</p>
                                    </div>
                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">Firestore</span>
                                </div>
                            </div>

                            {projectCreationError && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{projectCreationError}</div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button onClick={closeProjectLauncher} disabled={isCreatingProject} className="soft-button flex-1 px-5 py-3 text-sm disabled:opacity-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmProjectLaunch}
                                    disabled={isCreatingProject || projectEntityOptions.length === 0}
                                    className="blue-glow-button flex-1 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isCreatingProject ? 'Creating Project...' : 'Create Project & Continue'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {dashboardPanel && (
                <div className="fixed inset-0 z-50">
                    <button aria-label="Close dashboard panel" onClick={() => setDashboardPanel(null)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" />
                    <motion.aside
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-4 top-4 flex max-h-[calc(100vh-2rem)] w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/20"
                    >
                        <div className="mesh-surface p-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                                        {dashboardPanel === 'pending' ? 'Pending actions' : 'AI recommendations'}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black">
                                        {dashboardPanel === 'pending' ? 'What needs attention' : 'Smart next moves'}
                                    </h2>
                                    <p className="mt-2 text-sm text-blue-100">
                                        {dashboardPanel === 'pending' ? 'Documents, reviews and next steps that can move your filings ahead.' : 'Practical suggestions based on this entity and current workspace state.'}
                                    </p>
                                </div>
                                <button onClick={() => setDashboardPanel(null)} className="rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20">Close</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-ease-bg p-4">
                            {dashboardPanel === 'pending' ? (
                                <div className="space-y-3">
                                    {applications.length === 0 ? (
                                        <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-6 text-center">
                                            <p className="text-lg font-black text-slate-950">Start your first filing</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">There are no active applications yet. Pick a service and your pending actions will appear here.</p>
                                            <button onClick={() => { setDashboardPanel(null); scrollToAvailableServices(); }} className="blue-glow-button mt-5 px-5 py-2.5 text-sm">View Services</button>
                                        </div>
                                    ) : pendingActionItems.length > 0 ? (
                                        pendingActionItems.map((app, index) => (
                                            <motion.button
                                                key={`${app.id}-pending-panel`}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                onClick={() => { setDashboardPanel(null); handleViewDetails(app); }}
                                                className="group w-full rounded-[1.25rem] border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-ease-electric/30 hover:shadow-xl"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-black text-slate-950">{app.serviceName}</p>
                                                        <p className="mt-1 text-sm leading-5 text-slate-500">{app.documents.length === 0 ? 'Documents may still be needed.' : 'Review latest status and next step.'}</p>
                                                        <p className="mt-3 text-xs font-bold text-slate-400">{app.referenceId}</p>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${getStatusStyle(app.status)}`}>{app.status}</span>
                                                </div>
                                            </motion.button>
                                        ))
                                    ) : (
                                        <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50 p-6 text-center">
                                            <p className="text-lg font-black text-emerald-900">No urgent action</p>
                                            <p className="mt-2 text-sm leading-6 text-emerald-700">Your current filings are moving. Track status anytime from active filings.</p>
                                            <button onClick={() => { setDashboardPanel(null); scrollToActiveFilings(); }} className="mt-5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white">Track Status</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {aiRecommendationItems.map((item, index) => (
                                        <motion.div
                                            key={item.title}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm"
                                        >
                                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-ease-purple">AI suggestion</span>
                                            <h3 className="mt-3 font-black text-slate-950">{item.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">{item.copy}</p>
                                            <button onClick={() => { setDashboardPanel(null); item.onClick(); }} className="mt-4 rounded-full bg-ease-blue px-4 py-2 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                                                {item.action}
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </div>
            )}

            {showNotifications && (
                <div className="fixed inset-0 z-50">
                    <button aria-label="Close notifications" onClick={() => setShowNotifications(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" />
                    <motion.aside
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-4 top-4 flex max-h-[calc(100vh-2rem)] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/20"
                    >
                        <div className="mesh-surface p-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Notifications</p>
                                    <h2 className="mt-2 text-2xl font-black">Latest compliance updates</h2>
                                    <p className="mt-2 text-sm text-blue-100">Acknowledgements, processed forms and service movement in one place.</p>
                                </div>
                                <button onClick={() => setShowNotifications(false)} className="rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20">Close</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-ease-bg p-4">
                            {notificationItems.length > 0 ? (
                                <div className="space-y-3">
                                    {notificationItems.map((notification, index) => (
                                        <motion.button
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className="group w-full rounded-[1.25rem] border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-ease-electric/30 hover:shadow-xl"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border shadow-[0_0_0_5px_rgba(37,99,235,0.08)] ${getNotificationToneClass(notification.tone)}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="font-black text-slate-950">{notification.title}</p>
                                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${getNotificationToneClass(notification.tone)}`}>
                                                            New
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-5 text-slate-500">{notification.message}</p>
                                                    <p className="mt-3 text-xs font-bold text-slate-400">{formatNotificationTime(notification.time)}</p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-8 text-center">
                                    <p className="text-lg font-black text-slate-950">No notifications yet</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">Once a form is submitted, processed, completed or an acknowledgement is uploaded, it will appear here.</p>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboardPage;
