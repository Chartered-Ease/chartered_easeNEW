
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAppContext } from './useAppContext';

export type InternalRole = 
  | 'super_admin' 
  | 'admin_services' 
  | 'admin_agent_relations' 
  | 'associate_services' 
  | 'associate_agent_relations';

export interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: InternalRole;
}

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  admin: InternalUser | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'charteredease_internal_session';

// Mock Database of Internal Users
const MOCK_INTERNAL_USERS: (InternalUser & { password: string })[] = [
  { id: 'adm_001', name: 'Super Admin', email: 'super@ce.in', password: 'password123', role: 'super_admin' },
  { id: 'adm_002', name: 'Service Head', email: 'service.admin@ce.in', password: 'password123', role: 'admin_services' },
  { id: 'adm_003', name: 'Partner Head', email: 'partner.admin@ce.in', password: 'password123', role: 'admin_agent_relations' },
  { id: 'asc_001', name: 'Rohan Sharma', email: 'rohan@charteredease.in', password: 'password123', role: 'associate_services' },
  { id: 'asc_002', name: 'Priya AgentSupport', email: 'priya@charteredease.in', password: 'password123', role: 'associate_agent_relations' },
];

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<InternalUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setPage } = useAppContext();

  useEffect(() => {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY);
      if (session) {
        setAdmin(JSON.parse(session));
        setIsAdminAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to read admin session from local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    // Development login
    if (username.toLowerCase() === 'admin' && pass === '1234') {
        const adminData = { id: 'dev_admin', name: 'Dev Admin', email: 'admin@dev.co', role: 'super_admin' as const };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        setAdmin(adminData);
        setIsAdminAuthenticated(true);
        setPage('admin-dashboard');
        return true;
    }

    // Check mock database
    const user = MOCK_INTERNAL_USERS.find(u => u.email === username && u.password === pass);
    
    // Also check localStorage for dynamically created users (from AssociateManager)
    let dynamicUser = null;
    if (!user) {
        const storedStaff = localStorage.getItem('charteredease_internal_staff');
        if (storedStaff) {
            const parsedStaff = JSON.parse(storedStaff);
            dynamicUser = parsedStaff.find((u: any) => u.email === username && u.password === pass);
        }
    }

    const validUser = user || dynamicUser;

    if (validUser) {
        const { password, ...safeUser } = validUser;
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(safeUser));
        setAdmin(safeUser);
        setIsAdminAuthenticated(true);
        setPage('admin-dashboard');
        return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdmin(null);
    setIsAdminAuthenticated(false);
    setPage('admin-login');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isLoading, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
