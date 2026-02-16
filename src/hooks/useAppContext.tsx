
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AppContextType {
  page: string;
  setPage: (page: string, state?: Record<string, any>) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedSubmissionId: number | null;
  setSelectedSubmissionId: (id: number | null) => void;
  flow: string | null;
  setFlow: (flow: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [page, setPageInternal] = useState('home');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [flow, setFlow] = useState<string | null>(null);


  const setPage = (page: string) => {
    // Reset selections and flow when navigating to top-level pages
    if (['home', 'about', 'contact', 'associate-dashboard', 'agent-dashboard'].includes(page)) {
      setSelectedClientId(null);
      setSelectedProfileId(null);
      setSelectedTaskId(null);
      setSelectedServiceId(null);
      setSelectedSubmissionId(null);
      setFlow(null);
    }
    setPageInternal(page);
  };

  return (
    <AppContext.Provider value={{ page, setPage, selectedClientId, setSelectedClientId, selectedProfileId, setSelectedProfileId, selectedTaskId, setSelectedTaskId, selectedServiceId, setSelectedServiceId, selectedSubmissionId, setSelectedSubmissionId, flow, setFlow }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
