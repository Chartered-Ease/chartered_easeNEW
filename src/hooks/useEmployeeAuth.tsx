import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAppContext } from './useAppContext';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface EmployeeAuthContextType {
  isEmployeeAuthenticated: boolean;
  isLoading: boolean;
  employee: Employee | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

const EMPLOYEE_SESSION_KEY = 'charteredease_employee_session';

// In a real app, this would come from a secure backend.
const employees = [
  { id: 'emp001', name: 'Rohan Sharma', email: 'rohan@charteredease.in', password: 'password123' },
  { id: 'emp002', name: 'Priya Singh', email: 'priya@charteredease.in', password: 'password123' },
  { id: 'emp003', name: 'Test Employee', email: 'employee@charteredease.in', password: 'employee@123' },
];

export const EmployeeAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEmployeeAuthenticated, setIsEmployeeAuthenticated] = useState<boolean>(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setPage } = useAppContext();

  useEffect(() => {
    try {
      const storedEmployee = sessionStorage.getItem(EMPLOYEE_SESSION_KEY);
      if (storedEmployee) {
        setEmployee(JSON.parse(storedEmployee));
        setIsEmployeeAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse employee from session storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, pass: string): boolean => {
    const foundEmployee = employees.find(emp => emp.email === email && emp.password === pass);
    if (foundEmployee) {
        const { password, ...employeeData } = foundEmployee;
        sessionStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(employeeData));
        setEmployee(employeeData);
        setIsEmployeeAuthenticated(true);
        setPage('employee-dashboard');
        return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
    setEmployee(null);
    setIsEmployeeAuthenticated(false);
    setPage('employee-login');
  };

  return (
    <EmployeeAuthContext.Provider value={{ isEmployeeAuthenticated, isLoading, employee, login, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = (): EmployeeAuthContextType => {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
};