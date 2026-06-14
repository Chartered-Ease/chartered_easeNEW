
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { useClientManager } from './useProfile';
import { useAppContext } from './useAppContext';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export interface User {
    authProvider: 'phone' | 'google';
    mobileNumber?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    firebaseUid?: string;
    clientId?: string; // Currently active client ID
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isGoogleLoginAvailable: boolean;
  login: (mobileNumber: string) => User;
  loginWithGoogle: () => Promise<User>;
  createEntity: (name: string, entityType: string) => void;
  switchEntity: (clientId: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_SESSION_KEY = 'charteredease_customer_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addClient, findClientsForUser } = useClientManager();
  const { setSelectedClientId, setPage } = useAppContext();

  const buildGoogleUser = (firebaseUser: FirebaseUser): User => ({
    authProvider: 'google',
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email || 'Google user',
    photoURL: firebaseUser.photoURL || undefined,
    mobileNumber: firebaseUser.phoneNumber?.replace(/\D/g, '').slice(-10) || '',
  });

  const attachExistingEntity = (nextUser: User): User => {
    const existingEntities = findClientsForUser(nextUser);
    if (existingEntities.length > 0) {
        const lastUsed = existingEntities[existingEntities.length - 1];
        setSelectedClientId(lastUsed.id);
        return { ...nextUser, clientId: lastUsed.id };
    }

    setSelectedClientId(null);
    const { clientId, ...userWithoutClient } = nextUser;
    return userWithoutClient;
  };

  const persistCustomerSession = (nextUser: User) => {
    sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const restoreStoredSession = () => {
      try {
        const storedUserJSON = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
        if (storedUserJSON) {
          const storedUser = JSON.parse(storedUserJSON) as User;
          const sessionUser = attachExistingEntity(storedUser);
          persistCustomerSession(sessionUser);
        }
      } catch (error) {
        console.error("Failed to parse user from session storage", error);
      }
    };

    if (!firebaseAuth) {
      restoreStoredSession();
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          const googleUser = attachExistingEntity(buildGoogleUser(firebaseUser));
          persistCustomerSession(googleUser);
        } else {
          const storedUserJSON = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
          const storedUser = storedUserJSON ? JSON.parse(storedUserJSON) as User : null;

          if (storedUser && storedUser.authProvider !== 'google') {
            const sessionUser = attachExistingEntity(storedUser);
            persistCustomerSession(sessionUser);
          } else {
            sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
            setUser(null);
            setIsAuthenticated(false);
            setSelectedClientId(null);
          }
        }
      } catch (error) {
        console.error("Failed to restore Firebase auth session", error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [findClientsForUser, setSelectedClientId]);

  // Login only verifies mobile number. It does NOT auto-create a profile anymore.
  // Profile creation is delegated to the onboarding flow.
  const login = (mobileNumber: string): User => {
    const userData = attachExistingEntity({ 
        authProvider: 'phone',
        mobileNumber
    });

    persistCustomerSession(userData);
    return userData;
  };

  const loginWithGoogle = async (): Promise<User> => {
    if (!firebaseAuth) {
      throw new Error('Google login is not configured. Add Firebase environment variables and enable Google sign-in in Firebase Authentication.');
    }

    await setPersistence(firebaseAuth, browserLocalPersistence);
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const googleUser = attachExistingEntity(buildGoogleUser(result.user));
    persistCustomerSession(googleUser);
    return googleUser;
  };

  const createEntity = (name: string, entityType: string) => {
      if (!user) return;

      const ownerId = user.firebaseUid || user.email || user.mobileNumber || `customer_${Date.now()}`;
      const newClient = addClient(
          name, 
          user.mobileNumber || '', 
          user.email || "", // Email is not required for mobile OTP users
          entityType, 
          { type: 'customer', id: ownerId }, 
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

  const logout = async () => {
    const shouldSignOutFirebase = user?.authProvider === 'google' && Boolean(firebaseAuth);
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedClientId(null);

    if (shouldSignOutFirebase && firebaseAuth) {
      await signOut(firebaseAuth);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isGoogleLoginAvailable: isFirebaseConfigured, login, loginWithGoogle, createEntity, switchEntity, logout }}>
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
