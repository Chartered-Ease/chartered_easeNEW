import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useAssociateManager } from '../../hooks/useAssociateManager';
import { Document, downloadFile } from '../../hooks/useProfile';
import { useAgentAuth } from '../../hooks/useAgentAuth';

// Icons for timeline
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const FileUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ProcessingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M5 12a7 7 0 113.5 6.06M12 20v-5h-5" /></svg>;
const RejectedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

interface ChatMessage {
    id: string;
    submissionId: number;
    author: string;
    role: 'partner' | 'associate' | 'client' | 'system';
    text: string;
    createdAt: string;
    recipients?: Array<{ id: string; name: string; role: string }>;
}

const CHAT_STORAGE_KEY = 'charteredease_application_chats';

const readAllChats = (): ChatMessage[] => {
    try {
        return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

const StatusTimelinePage: React.FC = () => {
    const { setPage, selectedSubmissionId } = useAppContext();
    const { tasks, staff: associates } = useAssociateManager();
    const { agent } = useAgentAuth();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageDraft, setMessageDraft] = useState('');

    const submission = useMemo(() => {
        if (!selectedSubmissionId) return null;
        const allSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
        return allSubmissions.find((s: any) => s.id === selectedSubmissionId);
    }, [selectedSubmissionId]);

    useEffect(() => {
        if (!submission?.id) {
            setChatMessages([]);
            return;
        }

        const messages = readAllChats()
            .filter(message => message.submissionId === submission.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(messages);
    }, [submission?.id]);
    
    const associatedTask = useMemo(() => tasks.find(t => t.submissionId === submission?.id), [tasks, submission]);
    const assignedAssociate = useMemo(() => (
        associatedTask ? associates.find(e => e.id === associatedTask.associateId) : null
    ), [associatedTask, associates]);
    const serviceManager = useMemo(() => (
        associates.find(e => e.role === 'admin_services')
        || associates.find(e => e.role === 'super_admin')
        || { id: 'service-manager', name: 'Service Manager', email: 'service.admin@ce.in', role: 'admin_services' as const }
    ), [associates]);
    const messageRecipients = useMemo(() => {
        const recipients = [];
        if (assignedAssociate) {
            recipients.push({ id: assignedAssociate.id, name: assignedAssociate.name, role: 'Assigned Associate' });
        }
        recipients.push({ id: serviceManager.id, name: serviceManager.name, role: 'Service Manager' });
        return recipients;
    }, [assignedAssociate, serviceManager]);

    const timelineEvents = useMemo(() => {
        if (!submission) return [];
        const events = [];
        const submissionDate = new Date(submission.submittedAt);
        
        events.push({
            timestamp: submissionDate,
            title: 'Service Application Created',
            description: `Application for ${submission.service} was initiated for ${submission.clientName}.`,
            icon: <CheckCircleIcon />,
            color: 'bg-green-500',
        });

        if (submission.documents && submission.documents.length > 0) {
            events.push({
                timestamp: new Date(submissionDate.getTime() + 1000 * 60 * 5), // 5 mins later
                title: 'Documents Uploaded',
                description: `${submission.documents.length} document(s) were attached to the application.`,
                icon: <FileUploadIcon />,
                color: 'bg-blue-500',
            });
        }
        
        if (associatedTask) {
            const associate = associates.find(e => e.id === associatedTask.associateId);
            events.push({
                timestamp: new Date(associatedTask.assignedAt),
                title: 'Assigned to Associate',
                description: `Task assigned to ${associate?.name || 'an associate'}.`,
                icon: <UserCircleIcon />,
                color: 'bg-indigo-500',
            });
            
            if (associatedTask.status !== 'Pending') {
                 events.push({
                    timestamp: new Date(new Date(associatedTask.assignedAt).getTime() + 1000 * 60 * 60 * 3), // 3 hours later
                    title: 'Work Started',
                    description: `Associate began processing the application.`,
                    icon: <ProcessingIcon />,
                    color: 'bg-purple-500',
                });
            }
            
            if (associatedTask.status === 'Completed') {
                 events.push({
                    timestamp: associatedTask.completedAt ? new Date(associatedTask.completedAt) : new Date(),
                    title: 'Application Completed',
                    description: `The application process has been completed by the associate.`,
                    icon: <CheckCircleIcon />,
                    color: 'bg-green-500',
                });
            }
        } else if (submission.status === 'Rejected') {
             events.push({
                timestamp: new Date(submissionDate.getTime() + 1000 * 60 * 60 * 24), 
                title: 'Application Rejected',
                description: `The application has been rejected.`,
                icon: <RejectedIcon />,
                color: 'bg-red-500',
            });
        }
        
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [submission, associatedTask, associates]);

    const handleDownload = (fileName: string, fileData?: string) => {
        downloadFile(fileName, fileData);
    }

    const handleSendMessage = () => {
        if (!submission || !messageDraft.trim()) return;

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            submissionId: submission.id,
            author: agent?.name || agent?.username || 'Partner',
            role: 'partner',
            text: messageDraft.trim(),
            createdAt: new Date().toISOString(),
            recipients: messageRecipients,
        };

        const allMessages = readAllChats();
        const updatedMessages = [...allMessages, newMessage];
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));
        setChatMessages(prev => [...prev, newMessage]);
        setMessageDraft('');
    };

    const handleMessageKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    if (!submission) {
        return (
            <div className="min-h-screen bg-ease-bg px-4 py-12 text-center sm:px-6">
                <div className="glass-card mx-auto max-w-md p-8">
                    <p className="text-lg font-black text-ease-ink">Application details not found.</p>
                    <button onClick={() => setPage('track-status')} className="mt-5 rounded-full bg-ease-blue px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">Go back to Status Dashboard</button>
                </div>
            </div>
        );
    }

    const attachedDocuments = submission.documents || [];
    const acknowledgementDocuments = associatedTask?.acknowledgements || [];
    const activeStatus = associatedTask?.status || submission.status || 'Pending';
    const completedSteps = timelineEvents.length;
    const progress = Math.min(100, Math.max(20, Math.round((completedSteps / 5) * 100)));
    const statusTone = activeStatus === 'Completed'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : activeStatus === 'Rejected'
            ? 'bg-red-50 text-red-700 border-red-100'
            : activeStatus === 'Pending' || activeStatus === 'Pending Assignment'
                ? 'bg-orange-50 text-orange-700 border-orange-100'
                : 'bg-blue-50 text-ease-blue border-blue-100';

    return (
        <div className="min-h-screen bg-ease-bg px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <button onClick={() => setPage('track-status')} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-ease-blue hover:shadow-lg">
                    <span>&larr;</span>
                    Back to Status Dashboard
                </button>

                <section className="glass-card overflow-hidden">
                    <div className="mesh-surface relative p-6 text-white md:p-8">
                        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-ease-electric/30 blur-3xl" />
                        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Status Workspace</p>
                                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{submission.service}</h1>
                                <p className="mt-3 text-base font-semibold text-blue-100">
                                    Client: <span className="text-white">{submission.clientName}</span>
                                </p>
                            </div>

                            <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/10 backdrop-blur">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">Current Stage</p>
                                        <p className="mt-2 text-xl font-black">{activeStatus}</p>
                                    </div>
                                    <span className="h-3 w-3 rounded-full bg-ease-green animate-pulse-ring" />
                                </div>
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                                    <div className="h-full rounded-full bg-ease-electric transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs font-bold text-blue-100">
                                    <span>{completedSteps} updates logged</span>
                                    <span>{progress}% ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    {[
                        ['Status', activeStatus, 'Live application state'],
                        ['Documents', String(attachedDocuments.length), 'Files received'],
                        ['Assigned', assignedAssociate?.name || 'Queue', 'Execution owner'],
                        ['Reference', `CE-${String(submission.id).slice(-6)}`, 'Application ID'],
                    ].map(([label, value, helper]) => (
                        <div key={label} className="glass-card p-4 transition hover:-translate-y-0.5 hover:border-ease-electric/30 hover:shadow-2xl">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                            <p className="mt-2 truncate text-2xl font-black text-ease-ink" title={value}>{value}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">{helper}</p>
                        </div>
                    ))}
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <section className="glass-card p-5 md:p-6">
                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Status Timeline</p>
                                <h2 className="mt-2 text-2xl font-black text-ease-ink">Live work in motion</h2>
                            </div>
                            <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone}`}>{activeStatus}</span>
                        </div>

                        <div className="relative mt-6 space-y-4">
                            <div className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-ease-electric via-blue-100 to-transparent" />
                            {timelineEvents.map((event, index) => (
                                <div key={index} className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                                    <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl ${event.color} text-white shadow-lg shadow-slate-300/50`}>
                                        {event.icon}
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-ease-electric/30 hover:shadow-xl">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="text-base font-black text-ease-ink">{event.title}</h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p>
                                            </div>
                                            <p className="shrink-0 text-xs font-bold text-slate-400">{event.timestamp.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-5">
                        {acknowledgementDocuments.length > 0 && (
                            <section className="glass-card overflow-hidden">
                                <div className="bg-emerald-50/80 p-5">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircleIcon />
                                        <h2 className="text-lg font-black">Acknowledgement Documents</h2>
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-emerald-700/70">Final documents shared by the execution team.</p>
                                </div>
                                <div className="space-y-2 p-4">
                                    {acknowledgementDocuments.map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-3">
                                            <span className="truncate text-sm font-bold text-slate-700" title={doc.fileName}>{doc.fileName}</span>
                                            <button 
                                                onClick={() => handleDownload(doc.fileName, doc.fileData)}
                                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
                                            >
                                                <DownloadIcon />
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        <section className="glass-card p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Attachments</p>
                                    <h2 className="mt-2 text-xl font-black text-ease-ink">Client documents</h2>
                                </div>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-ease-blue">{attachedDocuments.length} files</span>
                            </div>
                            <div className="mt-4 space-y-2">
                                {attachedDocuments.map((doc: Document, i: number) => (
                                    <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                                        <span className="truncate text-sm font-bold text-slate-700" title={doc.fileName}>{doc.fileName}</span>
                                        <button onClick={() => handleDownload(doc.fileName, doc.fileData)} className="rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-ease-blue"><DownloadIcon /></button>
                                    </div>
                                ))}
                                {attachedDocuments.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
                                        <p className="text-sm font-bold text-slate-600">No documents attached.</p>
                                    </div>
                                )}
                            </div>
                            <button className="mt-4 w-full rounded-2xl bg-ease-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric">
                                Upload Additional Documents
                            </button>
                        </section>

                        <section className="glass-card overflow-hidden">
                            <div className="border-b border-slate-100 bg-white/70 px-5 py-4">
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-ease-electric">Communication</p>
                                <h2 className="mt-2 text-xl font-black text-ease-ink">Application thread</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-400">Messages stay attached to this service request.</p>
                            </div>

                            <div className="h-72 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
                                {chatMessages.length > 0 ? (
                                    chatMessages.map(message => {
                                        const isPartner = message.role === 'partner';
                                        return (
                                            <div key={message.id} className={`flex ${isPartner ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isPartner ? 'bg-ease-blue text-white' : 'border border-slate-100 bg-white text-slate-700'}`}>
                                                    <div className="mb-1 flex items-center justify-between gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-wide ${isPartner ? 'text-blue-100' : 'text-slate-400'}`}>{message.author}</span>
                                                        <span className={`text-[10px] ${isPartner ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">No messages yet</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">Send a note to keep communication linked with this application.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white p-4">
                                <textarea
                                    value={messageDraft}
                                    onChange={(event) => setMessageDraft(event.target.value)}
                                    onKeyDown={handleMessageKeyDown}
                                    className="input min-h-[92px] resize-none text-sm"
                                    placeholder="Type an update, document request, or client note..."
                                />
                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-[11px] font-bold text-slate-400">Press Enter to send, Shift+Enter for new line.</p>
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={!messageDraft.trim()}
                                        className="rounded-2xl bg-ease-blue px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default StatusTimelinePage;
