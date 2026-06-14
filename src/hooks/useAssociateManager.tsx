
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Document } from './useProfile';
import { InternalRole } from './useAdminAuth';
import { MCA_COMPLIANCES } from '../data/mcaConfig';
import { 
    GST_MONTHLY_COMPLIANCES, 
    GST_QRMP_COMPLIANCES, 
    GST_ANNUAL_COMPLIANCES,
    TDS_COMPLIANCES, 
    INCOME_TAX_COMPLIANCES,
    MONTHS, 
    QUARTERS 
} from '../data/taxConfig';

export interface InternalStaff {
  id: string;
  name: string;
  email: string;
  role: InternalRole;
  password?: string;
}

export interface AgentProfile {
    id: string;
    username: string; // This is their code/ID
    name: string;
    email: string;
    mobile: string;
    password?: string;
    createdBy: string;
}

export interface ExpertSlot {
    id: string;
    date: string;
    time: string;
    associateId: string;
    associateName: string;
}

export interface Task {
    taskId: string;
    submissionId: number; // 0 or -1 for pure compliance tasks if not linked to submission
    associateId: string;
    clientName: string;
    profileName: string;
    serviceName: string;
    entityType?: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Waiting for More Docs' | 'Scheduled' | 'Filed';
    deadline: string;
    assignedAt: string;
    completedAt?: string;
    adminNotes?: string;
    documents?: Document[]; // Documents submitted by customer
    acknowledgements?: Document[]; // Final output documents
    filingType?: 'basic' | 'expert';
    bookedSlot?: ExpertSlot;
    /* Fix: Added missing frequency field for tax/compliance logic */
    frequency?: string;
    // Compliance Specific Fields
    complianceType?: string;
    financialYear?: string;
    srn?: string;
    filingDate?: string;
    // Tax Specific
    period?: string; // e.g., 'April', 'Q1'
    taxType?: 'GST' | 'TDS' | 'IncomeTax';
}

export interface Notification {
    id: string;
    associateId: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

interface AssociateContextType {
  staff: InternalStaff[];
  agents: AgentProfile[];
  tasks: Task[];
  notifications: Notification[];
  getAssociates: () => InternalStaff[]; // Returns only service associates for task assignment
  addInternalUser: (name: string, email: string, role: InternalRole) => { user: InternalStaff, passwordGenerated: string } | null;
  addAgent: (name: string, email: string, mobile: string, creatorId: string) => { agent: AgentProfile, passwordGenerated: string } | null;
  getTasksForAssociate: (associateId: string) => Task[];
  getNotificationsForAssociate: (associateId: string) => Notification[];
  createTask: (taskData: Omit<Task, 'taskId' | 'assignedAt' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  uploadTaskAcknowledgement: (taskId: string, newFiles: Document[]) => void;
  deleteTaskAcknowledgement: (taskId: string, fileName: string) => void;
  generateMockSlots: () => ExpertSlot[];
  canCreateRole: (creatorRole: InternalRole, targetRole: InternalRole | 'agent') => boolean;
  generateCorporateCompliances: (corporateId: string, companyName: string, startYear?: number) => void;
  generateTaxCompliances: (corporateId: string, companyName: string, startYear: number, gstMode: 'Monthly' | 'QRMP') => void;
  updateTaskDocuments: (taskId: string, newDocuments: Document[]) => void;
}

const AssociateContext = createContext<AssociateContextType | undefined>(undefined);

export const STAFF_KEY = 'charteredease_internal_staff';
export const AGENTS_KEY = 'charteredease_agents_list';
const TASKS_KEY = 'charteredease_tasks';
const ASSOCIATE_NOTIFICATIONS_KEY = 'charteredease_associate_notifications';

const initialStaff: InternalStaff[] = [
  { id: 'emp001', name: 'Rohan Sharma', email: 'rohan@charteredease.in', role: 'associate_services', password: 'password123' },
  { id: 'emp002', name: 'Priya Singh', email: 'priya@charteredease.in', role: 'associate_agent_relations', password: 'password123' },
];

export const AssociateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [staff, setStaff] = useState<InternalStaff[]>([]);
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!localStorage.getItem(STAFF_KEY)) {
            localStorage.setItem(STAFF_KEY, JSON.stringify(initialStaff));
        }
        if (!localStorage.getItem(AGENTS_KEY)) {
            localStorage.setItem(AGENTS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(TASKS_KEY)) {
            localStorage.setItem(TASKS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(ASSOCIATE_NOTIFICATIONS_KEY)) {
            localStorage.setItem(ASSOCIATE_NOTIFICATIONS_KEY, JSON.stringify([]));
        }

        setStaff(JSON.parse(localStorage.getItem(STAFF_KEY) || '[]'));
        setAgents(JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]'));
        setTasks(JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'));
        setNotifications(JSON.parse(localStorage.getItem(ASSOCIATE_NOTIFICATIONS_KEY) || '[]'));
    }, []);
    
    const saveData = (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
    };
    
    const canCreateRole = (creatorRole: InternalRole, targetRole: InternalRole | 'agent'): boolean => {
        if (creatorRole === 'super_admin') return true;
        
        if (creatorRole === 'admin_services') {
            return targetRole === 'associate_services';
        }
        
        if (creatorRole === 'admin_agent_relations') {
            return targetRole === 'associate_agent_relations' || targetRole === 'agent';
        }
        
        if (creatorRole === 'associate_agent_relations') {
            return targetRole === 'agent';
        }
        
        return false;
    };

    const addInternalUser = (name: string, email: string, role: InternalRole) => {
        const existing = staff.find(a => a.email.toLowerCase() === email.toLowerCase());
        if (existing) return null;

        const passwordGenerated = `ce@${Math.floor(1000 + Math.random() * 9000)}`;
        const newUser: InternalStaff = {
            id: `staff_${Date.now()}`,
            name,
            email,
            role,
            password: passwordGenerated,
        };

        const updatedStaff = [...staff, newUser];
        setStaff(updatedStaff);
        saveData(STAFF_KEY, updatedStaff);
        
        return { user: newUser, passwordGenerated };
    };

    const addAgent = (name: string, email: string, mobile: string, creatorId: string) => {
        const existing = agents.find(a => a.email === email || a.mobile === mobile);
        if (existing) return null;

        // Generate Username: AGENT + Last 4 digits of mobile
        const username = `AGENT${mobile.slice(-4)}`;
        const passwordGenerated = `pass${mobile.slice(0, 4)}`; // Simplified for demo

        const newAgent: AgentProfile = {
            id: `agent_${Date.now()}`,
            username,
            name,
            email,
            mobile,
            password: passwordGenerated,
            createdBy: creatorId
        };

        const updatedAgents = [...agents, newAgent];
        setAgents(updatedAgents);
        saveData(AGENTS_KEY, updatedAgents);

        return { agent: newAgent, passwordGenerated };
    };

    const getAssociates = useCallback(() => {
        // Return staff capable of performing tasks (Services roles)
        return staff.filter(s => s.role === 'associate_services' || s.role === 'admin_services' || s.role === 'super_admin');
    }, [staff]);

    const getTasksForAssociate = useCallback((associateId: string) => {
        return tasks.filter(task => task.associateId === associateId).sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    }, [tasks]);

    const getNotificationsForAssociate = useCallback((associateId: string) => {
        return notifications.filter(n => n.associateId === associateId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications]);
    
    const createTask = useCallback((taskData: Omit<Task, 'taskId' | 'assignedAt' | 'status'>) => {
        const newTask: Task = {
            ...taskData,
            taskId: `task_${Date.now()}`,
            assignedAt: new Date().toISOString(),
            status: taskData.filingType === 'expert' ? 'Scheduled' : 'Pending',
            acknowledgements: []
        };
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);

        // Notify
        const newNotification: Notification = {
            id: `notif_${Date.now()}`,
            associateId: taskData.associateId,
            message: taskData.filingType === 'expert' 
                ? `New Expert Session Scheduled with ${taskData.clientName} on ${taskData.bookedSlot?.date}.`
                : `New task assigned: ${taskData.serviceName} for ${taskData.clientName}.`,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        const updatedNotifications = [...notifications, newNotification];
        setNotifications(updatedNotifications);
        saveData(ASSOCIATE_NOTIFICATIONS_KEY, updatedNotifications);

    }, [tasks, notifications]);
    
    const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
        const updatedTasks = tasks.map(task => 
            task.taskId === taskId ? { ...task, status } : task
        );
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);
    }, [tasks]);

    const updateTaskDocuments = useCallback((taskId: string, newDocuments: Document[]) => {
        const updatedTasks = tasks.map(task => {
            if (task.taskId === taskId) {
                return {
                    ...task,
                    documents: [...(task.documents || []), ...newDocuments]
                };
            }
            return task;
        });
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);
    }, [tasks]);

    const uploadTaskAcknowledgement = useCallback((taskId: string, newFiles: Document[]) => {
        const updatedTasks = tasks.map(task => {
            if (task.taskId === taskId) {
                return {
                    ...task,
                    status: 'Completed' as const,
                    completedAt: new Date().toISOString(),
                    acknowledgements: [...(task.acknowledgements || []), ...newFiles]
                };
            }
            return task;
        });
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);
    }, [tasks]);

    const deleteTaskAcknowledgement = useCallback((taskId: string, fileName: string) => {
        const updatedTasks = tasks.map(task => {
            if (task.taskId === taskId) {
                return {
                    ...task,
                    acknowledgements: task.acknowledgements?.filter(doc => doc.fileName !== fileName) || []
                };
            }
            return task;
        });
        setTasks(updatedTasks);
        saveData(TASKS_KEY, updatedTasks);
    }, [tasks]);

    const generateMockSlots = useCallback((): ExpertSlot[] => {
        const slots: ExpertSlot[] = [];
        const today = new Date();
        const times = ["10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"];
        const serviceAssociates = staff.filter(s => s.role === 'associate_services' || s.role === 'super_admin');

        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            
            times.forEach((time, idx) => {
                if (serviceAssociates.length > 0) {
                    const randomAssociate = serviceAssociates[Math.floor(Math.random() * serviceAssociates.length)];
                    slots.push({
                        id: `slot_${date.getTime()}_${idx}`,
                        date: dateStr,
                        time,
                        associateId: randomAssociate.id,
                        associateName: randomAssociate.name
                    });
                }
            });
        }
        return slots;
    }, [staff]);

    const generateCorporateCompliances = useCallback((corporateId: string, companyName: string, startYear: number = new Date().getFullYear() - 2) => {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        const newTasks: Task[] = [];

        for (let y = startYear; y <= currentYear; y++) {
            const fyString = `${y}-${y + 1}`;
            const dueDateYear = y + 1;

            MCA_COMPLIANCES.forEach(comp => {
                const exists = tasks.some(t => 
                    t.submissionId === -1 &&
                    t.profileName === corporateId && 
                    t.complianceType === comp.id && 
                    t.financialYear === fyString
                );
                
                if (!exists) {
                    newTasks.push({
                        taskId: `mca_${corporateId}_${comp.id}_${fyString}_${Date.now()}`,
                        submissionId: -1,
                        associateId: 'emp001',
                        clientName: companyName,
                        profileName: corporateId,
                        serviceName: comp.name,
                        entityType: 'private_limited',
                        status: 'Pending',
                        deadline: `${dueDateYear}-${comp.defaultDueDate}`, 
                        assignedAt: new Date().toISOString(),
                        financialYear: fyString,
                        complianceType: comp.id,
                        frequency: comp.frequency,
                        documents: [],
                        acknowledgements: []
                    });
                }
            });
        }

        if (newTasks.length > 0) {
            const updatedTasks = [...tasks, ...newTasks];
            setTasks(updatedTasks);
            saveData(TASKS_KEY, updatedTasks);
        }
    }, [tasks]);

    const generateTaxCompliances = useCallback((corporateId: string, companyName: string, startYear: number, gstMode: 'Monthly' | 'QRMP') => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const newTasks: Task[] = [];

        // Helper to add tasks
        const addTask = (fyString: string, period: string, type: 'GST' | 'TDS' | 'IncomeTax', complianceId: string, name: string, dueDate: Date, frequency: string) => {
             const exists = tasks.some(t => 
                t.submissionId === -1 &&
                t.profileName === corporateId && 
                t.complianceType === complianceId && 
                t.financialYear === fyString &&
                t.period === period
            );

            if (!exists) {
                newTasks.push({
                    taskId: `tax_${corporateId}_${type}_${complianceId}_${period}_${fyString}_${Date.now() + Math.random()}`,
                    submissionId: -1,
                    associateId: 'emp001',
                    clientName: companyName,
                    profileName: corporateId,
                    serviceName: `${name} - ${period}`,
                    entityType: 'private_limited',
                    status: 'Pending',
                    deadline: dueDate.toISOString(),
                    assignedAt: new Date().toISOString(),
                    financialYear: fyString,
                    complianceType: complianceId,
                    taxType: type,
                    period: period,
                    frequency,
                    documents: [],
                    acknowledgements: []
                });
            }
        };

        for (let y = startYear; y <= currentYear; y++) {
            const fyString = `${y}-${y + 1}`;
            
            // --- GST GENERATION ---
            if (gstMode === 'Monthly') {
                MONTHS.forEach((month, idx) => {
                    GST_MONTHLY_COMPLIANCES.forEach(comp => {
                        // Due date logic
                        const dueDate = new Date(y, 3 + idx + 1, comp.dueDateDay); 
                        addTask(fyString, month, 'GST', comp.id, comp.name, dueDate, comp.frequency);
                    });
                });
            } else {
                // QRMP
                QUARTERS.forEach(q => {
                    // M1 & M2 of Quarter: IFF
                    q.months.slice(0, 2).forEach((mIdx, i) => {
                        const periodName = MONTHS[mIdx];
                        const dueDate = new Date(y, 3 + mIdx + 1, 13); 
                        addTask(fyString, periodName, 'GST', 'IFF', 'IFF (Optional)', dueDate, 'Monthly');
                    });
                    
                    // Quarter End: GSTR-1 & 3B
                    GST_QRMP_COMPLIANCES.filter(c => c.frequency === 'Quarterly').forEach(comp => {
                        const dueDate = new Date(y, 3 + q.endMonthIndex + 1, comp.dueDateDay);
                        addTask(fyString, q.name, 'GST', comp.id, comp.name, dueDate, comp.frequency);
                    });
                });
            }

            // --- GST ANNUAL ---
            GST_ANNUAL_COMPLIANCES.forEach(comp => {
                const dueDate = new Date(y + 1, 11, 31); // 31st Dec of next year
                addTask(fyString, 'Annual', 'GST', comp.id, comp.name, dueDate, comp.frequency);
            });

            // --- TDS GENERATION ---
            QUARTERS.forEach(q => {
                TDS_COMPLIANCES.forEach(comp => {
                    let dueDate;
                    if (q.name.startsWith('Q4')) {
                         dueDate = new Date(y + 1, 4, 31); // May 31st of next year
                    } else {
                         dueDate = new Date(y, 3 + q.endMonthIndex + 1, comp.dueDateDay);
                    }
                    addTask(fyString, q.name, 'TDS', comp.id, comp.name, dueDate, comp.frequency);
                });
            });

            // --- INCOME TAX (ADVANCE TAX & ITR) ---
            INCOME_TAX_COMPLIANCES.forEach(comp => {
                if (comp.frequency === 'Quarterly') {
                    // Map Q1-Q4 to specific dates
                    const qMap: Record<string, Date> = {
                        'ADV-TAX-Q1': new Date(y, 5, 15),  // Jun 15
                        'ADV-TAX-Q2': new Date(y, 8, 15),  // Sep 15
                        'ADV-TAX-Q3': new Date(y, 11, 15), // Dec 15
                        'ADV-TAX-Q4': new Date(y + 1, 2, 15) // Mar 15
                    };
                    const dueDate = qMap[comp.id];
                    // Extract Q1, Q2 from ID for period name
                    const period = comp.id.split('-')[2];
                    addTask(fyString, period, 'IncomeTax', comp.id, comp.name, dueDate, comp.frequency);
                } else {
                    // Annual ITR
                    const dueDate = new Date(y + 1, 9, 31); // Oct 31
                    addTask(fyString, 'Annual', 'IncomeTax', comp.id, comp.name, dueDate, comp.frequency);
                }
            });
        }

        if (newTasks.length > 0) {
            const updatedTasks = [...tasks, ...newTasks];
            setTasks(updatedTasks);
            saveData(TASKS_KEY, updatedTasks);
        }

    }, [tasks]);

    return (
        <AssociateContext.Provider value={{ 
            staff, 
            agents,
            tasks, 
            notifications, 
            getAssociates, 
            addInternalUser, 
            addAgent,
            getTasksForAssociate, 
            getNotificationsForAssociate, 
            createTask, 
            updateTaskStatus,
            uploadTaskAcknowledgement,
            deleteTaskAcknowledgement,
            generateMockSlots,
            canCreateRole,
            generateCorporateCompliances,
            generateTaxCompliances,
            updateTaskDocuments
        }}>
            {children}
        </AssociateContext.Provider>
    );
};

export const useAssociateManager = (): AssociateContextType => {
    const context = useContext(AssociateContext);
    if (context === undefined) {
        throw new Error('useAssociateManager must be used within an AssociateProvider');
    }
    return context;
};
