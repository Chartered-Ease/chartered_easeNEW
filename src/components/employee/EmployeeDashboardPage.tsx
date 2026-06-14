import React, { useMemo } from 'react';
import { useEmployeeAuth } from '../../hooks/useEmployeeAuth';
import { useEmployeeManager } from '../../hooks/useEmployeeManager';
import { useAppContext } from '../../hooks/useAppContext';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { CheckCircleSolidIcon } from '../icons/CheckCircleSolidIcon';
import { ClockIcon } from '../icons/ClockIcon';

const statusColors: { [key: string]: string } = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    'Waiting for More Docs': 'bg-purple-100 text-purple-800',
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

const EmployeeDashboardPage: React.FC = () => {
    const { employee, logout } = useEmployeeAuth();
    const { getTasksForEmployee, getNotificationsForEmployee } = useEmployeeManager();
    const { setPage, setSelectedTaskId } = useAppContext();

    const employeeTasks = useMemo(() => employee ? getTasksForEmployee(employee.id) : [], [employee, getTasksForEmployee]);
    const notifications = useMemo(() => employee ? getNotificationsForEmployee(employee.id).slice(0, 5) : [], [employee, getNotificationsForEmployee]);

    const stats = useMemo(() => {
        return {
            total: employeeTasks.length,
            inProgress: employeeTasks.filter(t => t.status === 'In Progress').length,
            pending: employeeTasks.filter(t => t.status === 'Pending').length,
            completed: employeeTasks.filter(t => t.status === 'Completed').length,
        };
    }, [employeeTasks]);

    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return employeeTasks
            .filter(t => t.status !== 'Completed' && new Date(t.deadline) <= tomorrow)
            .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [employeeTasks]);

    const handleViewTask = (taskId: string) => {
        setSelectedTaskId(taskId);
        setPage(`employee-task/${taskId}`);
    };

    if (!employee) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome, {employee.name.split(' ')[0]}!</h1>
                        <p className="text-gray-600">Here are your tasks for today.</p>
                    </div>
                    <div className="text-sm text-gray-700 mt-4 sm:mt-0 text-left sm:text-right">
                        <p className="font-semibold">{employee.email}</p>
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
                                        <th className="p-3">Deadline</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeTasks.map(task => (
                                        <tr key={task.taskId} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{task.clientName}<br/><span className="text-xs text-gray-500 font-normal">{task.profileName}</span></td>
                                            <td className="p-3">{task.serviceName}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>{task.status}</span>
                                            </td>
                                            <td className="p-3">{new Date(task.deadline).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <button onClick={() => handleViewTask(task.taskId)} className="text-ease-blue font-semibold hover:underline">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {employeeTasks.length === 0 && <p className="text-center text-gray-500 py-8">You have no tasks assigned.</p>}
                        </div>
                    </div>
                    
                    {/* Right Sidebar: Deadlines & Notifications */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Deadlines</h3>
                            <div className="space-y-3">
                                {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(task => (
                                    <div key={task.taskId} className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                                        <p className="font-semibold text-gray-800">{task.serviceName}</p>
                                        <p className="text-xs text-gray-600">For: {task.clientName}</p>
                                        <p className="text-xs text-red-600 font-medium mt-1">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No tasks due today.</p>}
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

export default EmployeeDashboardPage;