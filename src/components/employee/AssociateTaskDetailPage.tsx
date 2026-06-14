import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useAssociateManager, Task } from '../../hooks/useAssociateManager';
import { useAssociateAuth } from '../../hooks/useAssociateAuth';
import { Document, fileToDataURL, downloadFile } from '../../hooks/useProfile';
import { ENTITY_LABEL_LOOKUP } from '../../data/entityServiceCatalog';

// Icons
const CloudUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const entityTypeMap: Record<string, string> = ENTITY_LABEL_LOOKUP;

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

const AssociateTaskDetailPage: React.FC = () => {
    const { setPage, selectedTaskId } = useAppContext();
    const { tasks, staff, updateTaskStatus, uploadTaskAcknowledgement, deleteTaskAcknowledgement } = useAssociateManager();
    const { associate } = useAssociateAuth();
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageDraft, setMessageDraft] = useState('');
    
    const task = useMemo(() => tasks.find(t => t.taskId === selectedTaskId), [tasks, selectedTaskId]);
    const [currentStatus, setCurrentStatus] = useState(task?.status || 'Pending');
    const serviceManager = useMemo(() => (
        staff.find(e => e.role === 'admin_services')
        || staff.find(e => e.role === 'super_admin')
        || { id: 'service-manager', name: 'Service Manager', email: 'service.admin@ce.in', role: 'admin_services' as const }
    ), [staff]);

    useEffect(() => {
        if (!task?.submissionId) {
            setChatMessages([]);
            return;
        }

        const messages = readAllChats()
            .filter(message => message.submissionId === task.submissionId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChatMessages(messages);
    }, [task?.submissionId]);

    if (!task) {
        return (
            <div className="p-8 text-center">
                <p>Task not found or you have been redirected.</p>
                <button onClick={() => setPage('associate-dashboard')} className="mt-4 text-ease-blue underline">Go back to your dashboard</button>
            </div>
        );
    }
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as Task['status'];
        updateTaskStatus(task.taskId, newStatus);
        setCurrentStatus(newStatus);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleUpload = async () => {
        if (uploadFiles.length === 0) return;

        setIsUploading(true);
        try {
            // Convert Files to Documents with Data URL
            const newDocs: Document[] = await Promise.all(uploadFiles.map(async file => ({
                type: 'Acknowledgement',
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(file)
            })));

            uploadTaskAcknowledgement(task.taskId, newDocs);
            setUploadFiles([]);
            setIsUploading(false);
            setUploadSuccess(true);
            setCurrentStatus('Completed');
            
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to process files.");
            setIsUploading(false);
        }
    };

    const handleDeleteFile = (fileName: string) => {
        if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            deleteTaskAcknowledgement(task.taskId, fileName);
        }
    };

    const handleDownload = (fileName: string, fileData?: string) => {
        downloadFile(fileName, fileData);
    };

    const handleDownloadAll = () => {
        // Since we can't easily ZIP client-side without a library in this environment,
        // we will download files sequentially.
        if (task.acknowledgements) {
            task.acknowledgements.forEach(doc => downloadFile(doc.fileName, doc.fileData));
        }
    };

    const handleSendMessage = () => {
        if (!task || !messageDraft.trim()) return;

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            submissionId: task.submissionId,
            author: associate?.name || 'Associate',
            role: 'associate',
            text: messageDraft.trim(),
            createdAt: new Date().toISOString(),
            recipients: [
                { id: 'partner-agent', name: 'Partner / Agent', role: 'Partner' },
                { id: serviceManager.id, name: serviceManager.name, role: 'Service Manager' },
            ],
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

    return (
        <div className="container mx-auto px-4 py-12">
            <button onClick={() => setPage('associate-dashboard')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                <span className="mr-2">&larr;</span>Back to Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
                <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{task.serviceName}</h1>
                            <p className="text-gray-600">for <span className="font-semibold">{task.clientName}</span> ({task.profileName})</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            currentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                            currentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            currentStatus === 'Scheduled' ? 'bg-teal-100 text-teal-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {currentStatus}
                        </span>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Details & Acknowledgement Upload */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Task Details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Task Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                <div><span className="font-semibold text-gray-600">Client:</span> {task.clientName}</div>
                                <div><span className="font-semibold text-gray-600">Entity Type:</span> {entityTypeMap[task.entityType || ''] || task.entityType}</div>
                                <div><span className="font-semibold text-gray-600">Service:</span> {task.serviceName}</div>
                                <div><span className="font-semibold text-gray-600">Assigned On:</span> {new Date(task.assignedAt).toLocaleString()}</div>
                                <div><span className="font-semibold text-gray-600">Deadline:</span> <span className="text-red-600 font-medium">{new Date(task.deadline).toLocaleDateString()}</span></div>
                            </div>
                            
                            {/* EXPERT SLOT DETAILS */}
                            {task.filingType === 'expert' && task.bookedSlot && (
                                <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-md">
                                    <div className="flex items-center text-teal-900 font-bold mb-1">
                                        <VideoIcon />
                                        <span className="ml-2">Scheduled Expert Session</span>
                                    </div>
                                    <div className="text-sm text-teal-800 ml-7">
                                        <p>Date: <strong>{task.bookedSlot.date}</strong></p>
                                        <p>Time: <strong>{task.bookedSlot.time}</strong></p>
                                        <button className="mt-2 text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700">Launch Meeting</button>
                                    </div>
                                </div>
                            )}

                            {task.adminNotes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <span className="font-semibold text-yellow-700 text-sm block mb-1">Admin Notes:</span>
                                    <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-100">{task.adminNotes}</p>
                                </div>
                            )}
                        </div>

                        {/* User Documents Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Documents Submitted by Customer / Agent</h3>
                            {task.documents && task.documents.length > 0 ? (
                                <div className="space-y-2">
                                    {task.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <FileIcon />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{doc.fileName}</p>
                                                    <div className="flex space-x-2 text-xs text-gray-500">
                                                        <span>{doc.type}</span>
                                                        <span>•</span>
                                                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDownload(doc.fileName, doc.fileData)}
                                                className="text-ease-blue hover:text-blue-700 p-2"
                                                title="Download"
                                            >
                                                <DownloadIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No documents found for this task.</p>
                            )}
                        </div>

                        {/* Upload Acknowledgement Section */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Upload Acknowledgement / Final Output</h3>
                            
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <CloudUploadIcon />
                                <label className="cursor-pointer mt-2">
                                    <span className="text-ease-blue hover:underline font-medium">Click to upload</span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                    <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.png,.zip" />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, ZIP</p>
                            </div>

                            {uploadFiles.length > 0 && (
                                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Files:</p>
                                    <ul className="space-y-1">
                                        {uploadFiles.map((f, i) => (
                                            <li key={i} className="text-sm text-gray-600 flex items-center justify-between">
                                                <span className="truncate">{f.name}</span>
                                                <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">&times;</button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button 
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="mt-3 w-full bg-ease-blue text-white py-2 rounded-md text-sm font-semibold hover:bg-ease-blue/90 disabled:bg-ease-blue/50"
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload & Complete Task'}
                                    </button>
                                </div>
                            )}
                            
                            {uploadSuccess && (
                                <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-md text-center font-medium animate-fade-in">
                                    Acknowledgement uploaded successfully. Task marked as Completed.
                                </div>
                            )}
                        </div>

                        {/* List of Uploaded Acknowledgements */}
                        {task.acknowledgements && task.acknowledgements.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-green-900">Uploaded Acknowledgements</h3>
                                    <button onClick={handleDownloadAll} className="text-xs text-ease-blue font-semibold hover:underline">Download All</button>
                                </div>
                                <div className="space-y-2">
                                    {task.acknowledgements.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-green-100">
                                            <div className="flex items-center space-x-3">
                                                <FileIcon />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{doc.fileName}</p>
                                                    <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handleDownload(doc.fileName, doc.fileData)}
                                                    className="text-gray-400 hover:text-blue-500 p-2"
                                                    title="Download"
                                                >
                                                    <DownloadIcon />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteFile(doc.fileName)}
                                                    className="text-gray-400 hover:text-red-500 p-2"
                                                    title="Delete"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Right Column: Status Control */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-4 border rounded-lg shadow-sm">
                            <h3 className="text-md font-bold text-gray-700 mb-3">Update Status</h3>
                            <select value={currentStatus} onChange={handleStatusChange} className="input w-full">
                                <option value="Pending">Pending</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting for More Docs">Waiting for More Docs</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Uploading an acknowledgement will automatically set status to <b>Completed</b>.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Communication</p>
                                <p className="mt-1 text-xs text-slate-400">Linked with partner and service manager.</p>
                                <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-3">
                                    <p className="text-[10px] font-black uppercase tracking-wide text-ease-blue">Thread participants</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-ease-blue">Partner / Agent</span>
                                        <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-black text-purple-700">{serviceManager.name} - Manager</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
                                {chatMessages.length > 0 ? (
                                    chatMessages.map(message => {
                                        const isAssociate = message.role === 'associate';
                                        return (
                                            <div key={message.id} className={`flex ${isAssociate ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isAssociate ? 'bg-ease-blue text-white' : 'border border-slate-100 bg-white text-slate-700'}`}>
                                                    <div className="mb-1 flex items-center justify-between gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-wide ${isAssociate ? 'text-blue-100' : 'text-slate-400'}`}>{message.author}</span>
                                                        <span className={`text-[10px] ${isAssociate ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                                                    {message.recipients && message.recipients.length > 0 && (
                                                        <p className={`mt-2 text-[10px] font-bold ${isAssociate ? 'text-blue-100' : 'text-slate-400'}`}>
                                                            To: {message.recipients.map(recipient => recipient.name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">No messages yet</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-400">Partner messages for this application will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white p-3">
                                <textarea
                                    value={messageDraft}
                                    onChange={(event) => setMessageDraft(event.target.value)}
                                    onKeyDown={handleMessageKeyDown}
                                    className="input min-h-[88px] resize-none text-sm"
                                    placeholder="Reply to partner or add an internal update..."
                                />
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-bold text-slate-400">Enter sends. Shift+Enter adds a new line.</p>
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={!messageDraft.trim()}
                                        className="rounded-2xl bg-ease-blue px-4 py-2 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssociateTaskDetailPage;
