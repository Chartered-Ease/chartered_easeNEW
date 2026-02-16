
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAppContext } from './useAppContext';
import { InternalStaff, STAFF_KEY } from './useAssociateManager';

interface AssociateAuthContextType {
  isAssociateAuthenticated: boolean;
  isLoading: boolean;
  associate: Omit<InternalStaff, 'password'> | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

const AssociateAuthContext = createContext<AssociateAuthContextType | undefined>(undefined);

const ASSOCIATE_SESSION_KEY = 'charteredease_associate_session';

export const AssociateAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAssociateAuthenticated, setIsAssociateAuthenticated] = useState<boolean>(false);
  const [associate, setAssociate] = useState<Omit<InternalStaff, 'password'> | null>(null);
  const [associatesList, setAssociatesList] = useState<InternalStaff[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setPage } = useAppContext();

  useEffect(() => {
    try {
      // Load the list of all associates for authentication check
      const allAssociates = localStorage.getItem(STAFF_KEY);
      if (allAssociates) {
        setAssociatesList(JSON.parse(allAssociates));
      }

      // Check for an active session
      const storedAssociate = sessionStorage.getItem(ASSOCIATE_SESSION_KEY);
      if (storedAssociate) {
        setAssociate(JSON.parse(storedAssociate));
        setIsAssociateAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse associate data from storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    // Development login
    if (username.toLowerCase() === 'associate' && pass === '1234') {
        const associateData = { id: 'dev_assoc', name: 'Dev Associate', email: 'associate@dev.co', role: 'associate_services' as const };
        sessionStorage.setItem(ASSOCIATE_SESSION_KEY, JSON.stringify(associateData));
        setAssociate(associateData);
        setIsAssociateAuthenticated(true);
        setPage('associate-dashboard');
        return true;
    }

    const foundAssociate = associatesList.find(emp => emp.email === username && emp.password === pass);
    if (foundAssociate) {
        const { password, ...associateData } = foundAssociate;
        sessionStorage.setItem(ASSOCIATE_SESSION_KEY, JSON.stringify(associateData));
        setAssociate(associateData);
        setIsAssociateAuthenticated(true);
        setPage('associate-dashboard');
        return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(ASSOCIATE_SESSION_KEY);
    setAssociate(null);
    setIsAssociateAuthenticated(false);
    setPage('associate-login');
  };

  return (
    <AssociateAuthContext.Provider value={{ isAssociateAuthenticated, isLoading, associate, login, logout }}>
      {children}
    </AssociateAuthContext.Provider>
  );
};

export const useAssociateAuth = (): AssociateAuthContextType => {
  const context = useContext(AssociateAuthContext);
  if (context === undefined) {
    throw new Error('useAssociateAuth must be used within an AssociateAuthProvider');
  }
  return context;
};
