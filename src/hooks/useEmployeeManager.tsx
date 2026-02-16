import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface Task {
    taskId: string;
    submissionId: number;
    employeeId: string;
    clientName: string;
    profileName: string;
    serviceName: string;
    entityType?: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Waiting for More Docs';
    deadline: string;
    assignedAt: string;
    adminNotes?: string;
    outputDocuments?: any[];
}

export interface Notification {
    id: string;
    employeeId: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

interface EmployeeContextType {
  employees: Employee[];
  tasks: Task[];
  notifications: Notification[];
  getEmployees: () => Employee[];
  getTasksForEmployee: (employeeId: string) => Task[];
  getNotificationsForEmployee: (employeeId: string) => Notification[];
  createTask: (taskData: Omit<Task, 'taskId' | 'assignedAt' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const EMPLOYEES_KEY = 'charteredease_employees';
const TASKS_KEY = 'charteredease_tasks';
const NOTIFICATIONS_KEY = 'charteredease_employee_notifications';

const initialEmployees: Employee[] = [
  { id: 'emp001', name: 'Rohan Sharma', email: 'rohan@charteredease.in' },
  { id: 'emp002', name: 'Priya Singh', email: 'priya@charteredease.in' },
  { id: 'emp003', name: 'Test Employee', email: 'employee@charteredease.in' },
];

export const EmployeeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Initialize with mock data if localStorage is empty
        if (!localStorage.getItem(EMPLOYEES_KEY)) {
            localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(initialEmployees));
        }
        if (!localStorage.getItem(TASKS_KEY)) {
            localStorage.setItem(TASKS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
        }

        setEmployees(JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || '[]'));
        setTasks(JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'));
        setNotifications(JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]'));
    }, []);
    
    const saveData = (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const getEmployees = useCallback(() => {
        return employees;
    }, [employees]);

    const getTasksForEmployee = useCallback((employeeId: string) => {
        return tasks.filter(task => task.employeeId === employeeId).sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    }, [tasks]);

    const getNotificationsForEmployee = useCallback((employeeId: string) => {
        return notifications.filter(n => n.employeeId === employeeId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications]);
    
    const createTask = useCallback((taskData: Omit<Task, 'taskId' | 'assignedAt' | 'status'>) => {
        const newTask: Task = {
            ...taskData,
            taskId: `task_${Date.now()}`,
            assignedAt: new Date().toISOString(),
            status: 'Pending',
        };
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);

        const newNotification: Notification = {
            id: `notif_${Date.now()}`,
            employeeId: taskData.employeeId,
            message: `New task assigned: ${taskData.serviceName} for ${taskData.clientName}.`,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        const updatedNotifications = [...notifications, newNotification];
        setNotifications(updatedNotifications);
        saveData(NOTIFICATIONS_KEY, updatedNotifications);

    }, [tasks, notifications]);
    
    const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
        const updatedTasks = tasks.map(task => 
            task.taskId === taskId ? { ...task, status } : task
        );
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);
    }, [tasks]);

    return (
        <EmployeeContext.Provider value={{ employees, tasks, notifications, getEmployees, getTasksForEmployee, getNotificationsForEmployee, createTask, updateTaskStatus }}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployeeManager = (): EmployeeContextType => {
    const context = useContext(EmployeeContext);
    if (context === undefined) {
        throw new Error('useEmployeeManager must be used within an EmployeeProvider');
    }
    return context;
};
