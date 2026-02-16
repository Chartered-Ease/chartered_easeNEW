import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useEmployeeManager, Task } from '../../hooks/useEmployeeManager';

const entityTypeMap: Record<string, string> = {
    proprietorship: 'Proprietorship',
    partnership: 'Partnership',
    llp: 'LLP',
    private_limited: 'Private Limited Company',
    huf: 'HUF',
    society: 'Society',
    trust: 'Trust',
};

const EmployeeTaskDetailPage: React.FC = () => {
    const { setPage, selectedTaskId } = useAppContext();
    const { tasks, updateTaskStatus } = useEmployeeManager();
    
    const task = useMemo(() => tasks.find(t => t.taskId === selectedTaskId), [tasks, selectedTaskId]);
    const [currentStatus, setCurrentStatus] = useState(task?.status || 'Pending');

    if (!task) {
        return (
            <div className="p-8 text-center">
                <p>Task not found or you have been redirected.</p>
                <button onClick={() => setPage('employee-dashboard')} className="mt-4 text-ease-blue underline">Go back to your dashboard</button>
            </div>
        );
    }
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as Task['status'];
        updateTaskStatus(task.taskId, newStatus);
        setCurrentStatus(newStatus);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <button onClick={() => setPage('employee-dashboard')} className="text-sm text-ease-blue hover:underline mb-4">&larr; Back to Dashboard</button>
            <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
                <div className="border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{task.serviceName}</h1>
                    <p className="text-gray-600">for <span className="font-semibold">{task.clientName}</span> ({task.profileName})</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Task Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><span className="font-semibold text-gray-600 block">Client:</span> {task.clientName}</div>
                            <div><span className="font-semibold text-gray-600 block">Entity Type:</span> {entityTypeMap[task.entityType || ''] || task.entityType}</div>
                            <div><span className="font-semibold text-gray-600 block">Service:</span> {task.serviceName}</div>
                            <div><span className="font-semibold text-gray-600 block">Profile:</span> {task.profileName}</div>
                            <div><span className="font-semibold text-gray-600 block">Assigned On:</span> {new Date(task.assignedAt).toLocaleString()}</div>
                            <div><span className="font-semibold text-gray-600 block">Deadline:</span> <span className="font-bold text-red-600">{new Date(task.deadline).toLocaleDateString()}</span></div>
                        </div>
                        {task.adminNotes && (
                            <div className="bg-yellow-50 p-3 rounded-md mt-4">
                                <h4 className="font-semibold text-yellow-800">Admin Notes:</h4>
                                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{task.adminNotes}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Update Status</h3>
                        <select value={currentStatus} onChange={handleStatusChange} className="input w-full">
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting for More Docs">Waiting for More Docs</option>
                            <option value="Completed">Completed</option>
                        </select>
                         <h3 className="text-lg font-semibold text-gray-700 pt-4">Documents</h3>
                         <p className="text-sm text-gray-500">Document viewer/downloader functionality will be here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeTaskDetailPage;
