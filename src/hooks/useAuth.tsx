
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useClientManager, Client } from './useProfile';
import { useAppContext } from './useAppContext';

interface User {
    mobileNumber: string;
    clientId?: string; // Currently active client ID
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (mobileNumber: string) => boolean;
  createEntity: (name: string, entityType: string) => void;
  switchEntity: (clientId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_SESSION_KEY = 'charteredease_customer_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addClient, findClientsByMobile } = useClientManager();
  const { setSelectedClientId, setPage } = useAppContext();

  useEffect(() => {
    try {
      const storedUserJSON = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
      if (storedUserJSON) {
        const storedUser = JSON.parse(storedUserJSON);
        setUser(storedUser);
        setIsAuthenticated(true);
        if (storedUser.clientId) {
            setSelectedClientId(storedUser.clientId);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, [setSelectedClientId]);

  // Login only verifies mobile number. It does NOT auto-create a profile anymore.
  // Profile creation is delegated to the onboarding flow.
  const login = (mobileNumber: string): boolean => {
    const userData: User = { 
        mobileNumber
    };
    
    // Check if user has existing entities
    const existingEntities = findClientsByMobile(mobileNumber);
    if (existingEntities.length > 0) {
        // Auto-select the most recent one (last in list usually)
        const lastUsed = existingEntities[existingEntities.length - 1];
        userData.clientId = lastUsed.id;
        setSelectedClientId(lastUsed.id);
    }

    sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return true;
  };

  const createEntity = (name: string, entityType: string) => {
      if (!user) return;

      const newClient = addClient(
          name, 
          user.mobileNumber, 
          "", // Email is not required for creation
          entityType, 
          { type: 'customer', id: user.mobileNumber }, 
          null, 
          entityType === 'individual' ? 'salaried' : 'business'
      );

      const updatedUser = { ...user, clientId: newClient.id };
      sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSelectedClientId(newClient.id);
  };

  const switchEntity = (clientId: string) => {
      if (!user) return;
      const updatedUser = { ...user, clientId };
      sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSelectedClientId(clientId);
      setPage('user-dashboard'); // Reset to dashboard on switch
  };

  const logout = () => {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedClientId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, createEntity, switchEntity, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
