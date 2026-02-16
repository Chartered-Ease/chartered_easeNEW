
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export interface Document {
    type: string;
    fileName: string;
    uploadedAt: string;
    fileData?: string; // Base64 Data URL
}

export interface Profile {
    id: string;
    name: string;
    extractedData: Record<string, any>;
    documents: Document[];
}

export interface Client {
    id: string;
    name: string;
    mobileNumber: string;
    email: string;
    entityType: string;
    documents: Document[];
    profiles: Profile[];
    // Ownership and Visibility fields
    createdBy?: {
        type: 'customer' | 'agent' | 'admin';
        id: string;
    };
    assignedAgentId?: string | null;
    // New User Profile Type
    profileType?: 'salaried' | 'business' | null;
    // Stored Service Credentials
    gstCredentials?: {
        userId: string;
        password?: string;
    };
    itrCredentials?: {
        pan: string;
        password?: string;
    };
}

interface ClientContextType {
    clients: Client[];
    isLoading: boolean;
    addClient: (
        name: string, 
        mobileNumber: string, 
        email: string, 
        entityType: string,
        creator?: { type: 'customer' | 'agent' | 'admin'; id: string },
        assignedAgentId?: string | null,
        profileType?: 'salaried' | 'business' | null
    ) => Client;
    getClient: (clientId: string) => Client | undefined;
    getClientsForAgent: (agentId: string) => Client[];
    findClientByMobile: (mobile: string) => Client | undefined;
    findClientsByMobile: (mobile: string) => Client[];
    updateClient: (clientId: string, updatedDetails: { name: string; mobileNumber: string; email: string }) => void;
    updateClientProfileType: (clientId: string, profileType: 'salaried' | 'business') => void;
    updateClientGstCredentials: (clientId: string, credentials: { userId: string; password?: string } | null) => void;
    updateClientItrCredentials: (clientId: string, credentials: { pan: string; password?: string } | null) => void;
    addDocumentsToClient: (clientId: string, newDocuments: Document[]) => void;
    processServiceApplication: (
        clientId: string,
        profileId: string | null,
        serviceName: string,
        newData: Record<string, any>,
        newDocuments: Document[]
    ) => Profile;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const CLIENT_DATA_KEY = 'charteredease_client_data';

// --- UTILITIES ---
export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const downloadFile = (fileName: string, dataUrl?: string) => {
    if (!dataUrl) {
        alert("File content is missing or corrupted.");
        return;
    }
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed", e);
        alert("Unable to download file.");
    }
};

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(CLIENT_DATA_KEY);
            if (storedData) {
                let parsedClients: Client[] = JSON.parse(storedData);
                
                // --- MIGRATION SCRIPT START ---
                let migrationNeeded = false;
                parsedClients = parsedClients.map(client => {
                    let updatedClient = { ...client };
                    if (!client.createdBy) {
                        updatedClient.createdBy = { type: 'admin', id: 'system_migration' };
                        updatedClient.assignedAgentId = null;
                        migrationNeeded = true;
                    }
                    return updatedClient;
                });
                
                if (migrationNeeded) {
                    localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(parsedClients));
                    console.log("Migration: Updated legacy clients with default ownership fields.");
                }
                // --- MIGRATION SCRIPT END ---

                setClients(parsedClients);
            }
        } catch (error) {
            console.error("Failed to parse client data from local storage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveClients = (updatedClients: Client[]) => {
        setClients(updatedClients);
        try {
            localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(updatedClients));
        } catch (error) {
            console.error("Failed to save client data to local storage", error);
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                alert("Storage limit exceeded. Please clear some data or use smaller files.");
            }
        }
    };

    const addClient = (
        name: string, 
        mobileNumber: string, 
        email: string, 
        entityType: string,
        creator: { type: 'customer' | 'agent' | 'admin'; id: string } = { type: 'admin', id: 'system' },
        assignedAgentId: string | null = null,
        profileType: 'salaried' | 'business' | null = null
    ): Client => {
        const newClient: Client = {
            id: `client_${Date.now()}`,
            name,
            mobileNumber,
            email,
            entityType,
            documents: [],
            profiles: [],
            createdBy: creator,
            assignedAgentId: assignedAgentId,
            profileType: profileType
        };
        const updatedClients = [...clients, newClient];
        saveClients(updatedClients);
        return newClient;
    };
    
    const getClient = (clientId: string) => {
        return clients.find(c => c.id === clientId);
    }

    const getClientsForAgent = useCallback((agentId: string) => {
        return clients.filter(client => {
            if (client.createdBy?.type === 'agent' && client.createdBy.id === agentId) return true;
            if (client.assignedAgentId === agentId) return true;
            return false;
        });
    }, [clients]);
    
    const findClientByMobile = (mobileNumber: string): Client | undefined => {
        return clients.find(c => c.mobileNumber === mobileNumber);
    };

    const findClientsByMobile = (mobileNumber: string): Client[] => {
        return clients.filter(c => c.mobileNumber === mobileNumber);
    };
    
    const updateClient = (clientId: string, updatedDetails: { name: string; mobileNumber: string; email: string; }) => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return {
                    ...client,
                    name: updatedDetails.name,
                    mobileNumber: updatedDetails.mobileNumber,
                    email: updatedDetails.email,
                };
            }
            return client;
        });
        saveClients(updatedClients);
    };
    
    const updateClientProfileType = (clientId: string, profileType: 'salaried' | 'business') => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return {
                    ...client,
                    profileType: profileType
                };
            }
            return client;
        });
        saveClients(updatedClients);
    };

    const updateClientGstCredentials = (clientId: string, credentials: { userId: string; password?: string } | null) => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return {
                    ...client,
                    gstCredentials: credentials || undefined
                };
            }
            return client;
        });
        saveClients(updatedClients);
    };

    const updateClientItrCredentials = (clientId: string, credentials: { pan: string; password?: string } | null) => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return {
                    ...client,
                    itrCredentials: credentials || undefined
                };
            }
            return client;
        });
        saveClients(updatedClients);
    };

    const addDocumentsToClient = (clientId: string, newDocuments: Document[]) => {
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                return {
                    ...client,
                    documents: [...(client.documents || []), ...newDocuments]
                };
            }
            return client;
        });
        saveClients(updatedClients);
    };

    const processServiceApplication = useCallback((
        clientId: string,
        profileId: string | null,
        serviceName: string,
        newData: Record<string, any>,
        newDocuments: Document[]
    ): Profile => {
        let updatedProfile: Profile | null = null;
        const updatedClients = clients.map(client => {
            if (client.id === clientId) {
                let targetProfile: Profile | undefined;
                if (profileId) {
                    targetProfile = client.profiles.find(p => p.id === profileId);
                }

                if (targetProfile) { // Update existing profile
                    const existingDocs = targetProfile.documents || [];
                    const combinedDocs = [
                        ...existingDocs,
                        ...newDocuments
                    ];
                    targetProfile.extractedData = { ...targetProfile.extractedData, ...newData };
                    targetProfile.documents = combinedDocs;
                    updatedProfile = targetProfile;
                } else { // Create new profile
                    const newProfile: Profile = {
                        id: `profile_${Date.now()}`,
                        name: `${serviceName} Application`,
                        extractedData: newData,
                        documents: newDocuments,
                    };
                    client.profiles.push(newProfile);
                    updatedProfile = newProfile;
                }
            }
            return client;
        });

        if (!updatedProfile) throw new Error("Could not create or update profile.");

        saveClients(updatedClients);
        return updatedProfile;
    }, [clients]);


    return (
        <ClientContext.Provider value={{ clients, isLoading, addClient, getClient, getClientsForAgent, findClientByMobile, findClientsByMobile, updateClient, updateClientProfileType, updateClientGstCredentials, updateClientItrCredentials, addDocumentsToClient, processServiceApplication }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClientManager = (): ClientContextType => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClientManager must be used within a ClientProvider');
    }
    return context;
};
