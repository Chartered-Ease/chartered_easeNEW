
import React, { useMemo } from 'react';
import { useAssociateAuth } from '../../hooks/useAssociateAuth';
import { useAssociateManager } from '../../hooks/useAssociateManager';
import { useAppContext } from '../../hooks/useAppContext';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { CheckCircleSolidIcon } from '../icons/CheckCircleSolidIcon';
import { ClockIcon } from '../icons/ClockIcon';

const VideoCameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const statusColors: { [key: string]: string } = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    'Waiting for More Docs': 'bg-purple-100 text-purple-800',
    'Scheduled': 'bg-teal-100 text-teal-800',
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <div className="bg-white p-6 rounded-lg shadow flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

const AssociateDashboardPage: React.FC = () => {
    const { associate, logout } = useAssociateAuth();
    const { getTasksForAssociate, getNotificationsForAssociate } = useAssociateManager();
    const { setPage, setSelectedTaskId } = useAppContext();

    const associateTasks = useMemo(() => associate ? getTasksForAssociate(associate.id) : [], [associate, getTasksForAssociate]);
    const notifications = useMemo(() => associate ? getNotificationsForAssociate(associate.id).slice(0, 5) : [], [associate, getNotificationsForAssociate]);

    const stats = useMemo(() => {
        return {
            total: associateTasks.length,
            inProgress: associateTasks.filter(t => t.status === 'In Progress').length,
            pending: associateTasks.filter(t => t.status === 'Pending').length,
            completed: associateTasks.filter(t => t.status === 'Completed').length,
        };
    }, [associateTasks]);

    const upcomingSessions = useMemo(() => {
        return associateTasks
            .filter(t => t.filingType === 'expert' && t.status === 'Scheduled')
            .sort((a, b) => {
                // Basic sort by deadline string (date), ideally parse date properly
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });
    }, [associateTasks]);

    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return associateTasks
            .filter(t => t.status !== 'Completed' && t.status !== 'Scheduled' && new Date(t.deadline) <= tomorrow)
            .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [associateTasks]);

    const handleViewTask = (taskId: string) => {
        setSelectedTaskId(taskId);
        setPage(`associate-task/${taskId}`);
    };

    if (!associate) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome, {associate.name.split(' ')[0]}!</h1>
                        <p className="text-gray-600">Here are your tasks for today.</p>
                    </div>
                    <div className="text-sm text-gray-700 mt-4 sm:mt-0 text-left sm:text-right">
                        <p className="font-semibold">{associate.email}</p>
                        <button onClick={logout} className="text-ease-blue hover:underline font-medium">Logout</button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Tasks Assigned" value={stats.total} icon={<ClipboardListIcon className="h-6 w-6" />} color="bg-blue-100 text-ease-blue" />
                    <StatCard title="Tasks In Progress" value={stats.inProgress} icon={<ClockIcon />} color="bg-purple-100 text-purple-600" />
                    <StatCard title="Pending Tasks" value={stats.pending} icon={<ClockIcon />} color="bg-yellow-100 text-yellow-600" />
                    <StatCard title="Completed Tasks" value={stats.completed} icon={<CheckCircleSolidIcon />} color="bg-green-100 text-ease-green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Assigned Tasks Table */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Assigned Tasks</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="p-3">Client</th>
                                        <th className="p-3">Service</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Deadline / Slot</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {associateTasks.map(task => (
                                        <tr key={task.taskId} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{task.clientName}<br/><span className="text-xs text-gray-500 font-normal">{task.profileName}</span></td>
                                            <td className="p-3">
                                                {task.serviceName}
                                                {task.filingType === 'expert' && <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1 rounded">Expert</span>}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>{task.status}</span>
                                            </td>
                                            <td className="p-3">
                                                {task.filingType === 'expert' && task.bookedSlot 
                                                    ? <span className="font-bold text-teal-700">{task.bookedSlot.date}<br/><span className="text-xs font-normal">{task.bookedSlot.time}</span></span>
                                                    : new Date(task.deadline).toLocaleDateString()
                                                }
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => handleViewTask(task.taskId)} className="text-ease-blue font-semibold hover:underline">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {associateTasks.length === 0 && <p className="text-center text-gray-500 py-8">You have no tasks assigned.</p>}
                        </div>
                    </div>
                    
                    {/* Right Sidebar: Expert Sessions, Deadlines & Notifications */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Expert Sessions Widget */}
                        {upcomingSessions.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <VideoCameraIcon /> <span className="ml-2">Upcoming Expert Sessions</span>
                                </h3>
                                <div className="space-y-3">
                                    {upcomingSessions.map(task => (
                                        <div key={task.taskId} className="p-3 bg-teal-50 rounded border border-teal-100">
                                            <p className="font-bold text-teal-900">{task.bookedSlot?.time}</p>
                                            <p className="text-sm text-teal-800">{task.bookedSlot?.date}</p>
                                            <p className="text-xs text-teal-700 mt-1">Client: {task.clientName}</p>
                                            <button onClick={() => handleViewTask(task.taskId)} className="mt-2 text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700">Join / View</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Deadlines</h3>
                            <div className="space-y-3">
                                {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(task => (
                                    <div key={task.taskId} className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                                        <p className="font-semibold text-gray-800">{task.serviceName}</p>
                                        <p className="text-xs text-gray-600">For: {task.clientName}</p>
                                        <p className="text-xs text-red-600 font-medium mt-1">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No immediate deadlines.</p>}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                            <div className="space-y-3">
                               {notifications.length > 0 ? notifications.map(notif => (
                                   <div key={notif.id} className="text-sm border-b pb-2 last:border-0">
                                       <p className="text-gray-700">{notif.message}</p>
                                       <p className="text-xs text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                                   </div>
                               )) : <p className="text-sm text-gray-500">No new notifications.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssociateDashboardPage;
