import React, { useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useAssociateManager } from '../../hooks/useAssociateManager';
import { Document, downloadFile } from '../../hooks/useProfile';

// Icons for timeline
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const FileUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ProcessingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M5 12a7 7 0 113.5 6.06M12 20v-5h-5" /></svg>;
const RejectedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

const StatusTimelinePage: React.FC = () => {
    const { setPage, selectedSubmissionId } = useAppContext();
    const { tasks, staff: associates } = useAssociateManager();

    const submission = useMemo(() => {
        if (!selectedSubmissionId) return null;
        const allSubmissions = JSON.parse(localStorage.getItem('charteredease_submissions') || '[]');
        return allSubmissions.find((s: any) => s.id === selectedSubmissionId);
    }, [selectedSubmissionId]);
    
    const associatedTask = useMemo(() => tasks.find(t => t.submissionId === submission?.id), [tasks, submission]);

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

    if (!submission) {
        return (
            <div className="p-8 text-center">
                <p>Application details not found.</p>
                <button onClick={() => setPage('track-status')} className="mt-4 text-ease-blue underline">Go back to Status Dashboard</button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => setPage('track-status')} className="text-sm text-gray-600 hover:text-ease-blue mb-6 inline-flex items-center">
                <span className="mr-2">&larr;</span>Back to Status Dashboard
            </button>
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h1 className="text-2xl font-bold text-gray-800">{submission.service}</h1>
                <p className="text-gray-600">for <span className="font-semibold">{submission.clientName}</span></p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Status Timeline</h2>
                    <div className="relative border-l-2 border-gray-200 pl-6">
                        {timelineEvents.map((event, index) => (
                            <div key={index} className="mb-8 last:mb-0">
                                <div className={`absolute -left-3.5 mt-1.5 h-6 w-6 rounded-full ${event.color} flex items-center justify-center text-white`}>
                                    {event.icon}
                                </div>
                                <div className="pl-4">
                                    <p className="text-xs text-gray-500">{event.timestamp.toLocaleString()}</p>
                                    <h3 className="font-semibold text-gray-800">{event.title}</h3>
                                    <p className="text-sm text-gray-600">{event.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1 space-y-6">
                     {/* Acknowledgement Documents (New Section) */}
                     {associatedTask?.acknowledgements && associatedTask.acknowledgements.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h2 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                                <CheckCircleIcon />
                                <span className="ml-2">Acknowledgement Documents</span>
                            </h2>
                            <div className="space-y-2">
                                {associatedTask.acknowledgements.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]" title={doc.fileName}>{doc.fileName}</span>
                                        <button 
                                            onClick={() => handleDownload(doc.fileName, doc.fileData)}
                                            className="text-ease-blue hover:text-ease-blue/80 text-sm font-semibold"
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Attachments</h2>
                        <div className="space-y-2">
                            {submission.documents.map((doc: Document, i: number) => (
                                <div key={i} className="w-full flex items-center justify-between text-left p-2 bg-gray-50 rounded-md">
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{doc.fileName}</span>
                                    <button onClick={() => handleDownload(doc.fileName, doc.fileData)} className="text-gray-500 hover:text-ease-blue"><DownloadIcon /></button>
                                </div>
                            ))}
                            {submission.documents.length === 0 && <p className="text-sm text-gray-500">No documents attached.</p>}
                        </div>
                        <button className="w-full mt-3 bg-ease-blue/10 text-ease-blue font-semibold py-2 rounded-lg text-sm hover:bg-ease-blue/20">
                            Upload Additional Documents
                        </button>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Communication</h2>
                        <div className="border rounded-lg p-3 h-48 bg-gray-50 flex items-center justify-center">
                            <p className="text-sm text-gray-400">Chat panel placeholder</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusTimelinePage;