
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAppContext } from './useAppContext';

interface Corporate {
  username: string;
}

interface CorporateAuthContextType {
  isCorporateAuthenticated: boolean;
  isLoading: boolean;
  corporate: Corporate | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

const CorporateAuthContext = createContext<CorporateAuthContextType | undefined>(undefined);

const CORPORATE_SESSION_KEY = 'charteredease_corporate_session';

export const CorporateAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCorporateAuthenticated, setIsCorporateAuthenticated] = useState<boolean>(false);
  const [corporate, setCorporate] = useState<Corporate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setPage } = useAppContext();

  useEffect(() => {
    try {
      const storedCorporate = sessionStorage.getItem(CORPORATE_SESSION_KEY);
      if (storedCorporate) {
        setCorporate(JSON.parse(storedCorporate));
        setIsCorporateAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse corporate user from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    // In a real app, this would be an API call.
    if (username.toLowerCase() === 'corporate' && pass === 'password123') {
        const corporateData = { username };
        sessionStorage.setItem(CORPORATE_SESSION_KEY, JSON.stringify(corporateData));
        setCorporate(corporateData);
        setIsCorporateAuthenticated(true);
        setPage('corporate-dashboard');
        return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(CORPORATE_SESSION_KEY);
    setCorporate(null);
    setIsCorporateAuthenticated(false);
    setPage('home');
  };

  return (
    <CorporateAuthContext.Provider value={{ isCorporateAuthenticated, isLoading, corporate, login, logout }}>
      {children}
    </CorporateAuthContext.Provider>
  );
};

export const useCorporateAuth = (): CorporateAuthContextType => {
  const context = useContext(CorporateAuthContext);
  if (context === undefined) {
    throw new Error('useCorporateAuth must be used within a CorporateAuthProvider');
  }
  return context;
};
