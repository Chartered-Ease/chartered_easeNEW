
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAppContext } from './useAppContext';
import { AGENTS_KEY, AgentProfile } from './useAssociateManager';

interface Agent {
  username: string;
  name: string;
}

interface AgentAuthContextType {
  isAgentAuthenticated: boolean;
  isLoading: boolean;
  agent: Agent | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

const AGENT_SESSION_KEY = 'charteredease_agent_session';

export const AgentAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAgentAuthenticated, setIsAgentAuthenticated] = useState<boolean>(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setPage } = useAppContext();

  useEffect(() => {
    try {
      const storedAgent = sessionStorage.getItem(AGENT_SESSION_KEY);
      if (storedAgent) {
        setAgent(JSON.parse(storedAgent));
        setIsAgentAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse agent from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (username: string, pass: string): boolean => {
    // Development login credentials
    if (username.toLowerCase() === 'partner' && pass === '1234') {
        const agentData = { username: 'Partner', name: 'Development Partner' };
        sessionStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(agentData));
        setAgent(agentData);
        setIsAgentAuthenticated(true);
        setPage('agent-dashboard');
        return true;
    }

    // Check against dynamically created agents
    const storedAgents = localStorage.getItem(AGENTS_KEY);
    if (storedAgents) {
        const agentsList: AgentProfile[] = JSON.parse(storedAgents);
        const foundAgent = agentsList.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === pass);
        
        if (foundAgent) {
            const agentData = { username: foundAgent.username, name: foundAgent.name };
            sessionStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(agentData));
            setAgent(agentData);
            setIsAgentAuthenticated(true);
            setPage('agent-dashboard');
            return true;
        }
    }

    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(AGENT_SESSION_KEY);
    setAgent(null);
    setIsAgentAuthenticated(false);
    setPage('home'); 
  };

  return (
    <AgentAuthContext.Provider value={{ isAgentAuthenticated, isLoading, agent, login, logout }}>
      {children}
    </AgentAuthContext.Provider>
  );
};

export const useAgentAuth = (): AgentAuthContextType => {
  const context = useContext(AgentAuthContext);
  if (context === undefined) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};
