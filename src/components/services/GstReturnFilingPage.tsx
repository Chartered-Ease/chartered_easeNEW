
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager, fileToDataURL } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { LoaderIcon } from '../icons/LoaderIcon';

// --- ICONS ---
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const DocumentZipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

type Step = 'init' | 'login' | 'dashboard' | 'return-type-selection' | 'upload' | 'nil-confirmation' | 'processing';

const GstReturnFilingPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient, updateClientGstCredentials, processServiceApplication } = useClientManager();
    const { user } = useAuth();
    
    const client = selectedClientId ? getClient(selectedClientId) : null;

    // State
    const [step, setStep] = useState<Step>('init');
    const [credentials, setCredentials] = useState({ userId: '', password: '' });
    const [fy, setFy] = useState('2024-2025');
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
    const [returnType, setReturnType] = useState<'regular' | 'nil' | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // Upload State
    const [salesFile, setSalesFile] = useState<File | null>(null);
    const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!client) {
            setPage('client-list');
        } else {
            // Auto-redirect logic
            if (step === 'init') {
                if (client.gstCredentials?.userId) {
                    setStep('dashboard');
                } else {
                    setStep('login');
                }
            }
        }
    }, [client, setPage, step]);

    if (!client) return <div className="p-12 text-center">Loading client context...</div>;

    // --- HANDLERS ---

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (credentials.userId && credentials.password) {
            // Save credentials
            updateClientGstCredentials(client.id, credentials);
            setStep('dashboard');
        }
    };

    const handleDisconnect = () => {
        if (window.confirm("Are you sure you want to disconnect? You will need to enter credentials again for the next filing.")) {
            updateClientGstCredentials(client.id, null);
            setCredentials({ userId: '', password: '' });
            setShowSettings(false);
            setStep('login');
        }
    };

    const handleUpdateCredentials = () => {
        setCredentials(prev => ({ ...prev, userId: client.gstCredentials?.userId || '' }));
        setShowSettings(false);
        setStep('login');
    };

    const handlePeriodSelect = (month: string, status: string) => {
        if (status === 'Filed') return; 
        setSelectedPeriod(month);
        setStep('return-type-selection');
    };

    const handleSelectReturnType = (type: 'regular' | 'nil') => {
        setReturnType(type);
        if (type === 'regular') {
            setStep('upload');
        } else {
            setStep('nil-confirmation');
        }
    };

    const handleUploadSubmit = async () => {
        if (!salesFile || !purchaseFile) {
            alert("Please upload both Sales and Purchase invoice files.");
            return;
        }
        setIsSubmitting(true);

        try {
            // Convert files to data URLs for storage
            const salesDataUrl = await fileToDataURL(salesFile);
            const purchaseDataUrl = await fileToDataURL(purchaseFile);
            
            const documents = [
                { type: 'Sales Invoices', fileName: salesFile.name, uploadedAt: new Date().toISOString(), fileData: salesDataUrl },
                { type: 'Purchase Invoices', fileName: purchaseFile.name, uploadedAt: new Date().toISOString(), fileData: purchaseDataUrl }
            ];

            const profileName = `GST Return - ${selectedPeriod} ${fy}`;
            const extractedData = {
                returnType: 'Regular',
                period: selectedPeriod,
                financialYear: fy
            };

            const newProfile = processServiceApplication(
                client.id, null, "GST Return Filing", extractedData, documents
            );

            createApplicationRecord(newProfile, documents, "Processing", 'Regular');

            setTimeout(() => {
                setIsSubmitting(false);
                setStep('processing');
            }, 1000);
        } catch (error) {
            console.error("Error processing regular return", error);
            setIsSubmitting(false);
        }
    };

    const handleNilSubmit = async () => {
        setIsSubmitting(true);

        try {
            // No documents for Nil Return
            const profileName = `GST Return - ${selectedPeriod} ${fy} (Nil)`;
            const extractedData = {
                returnType: 'Nil',
                period: selectedPeriod,
                financialYear: fy,
                isNil: true
            };

            const newProfile = processServiceApplication(
                client.id, 
                null, 
                "GST Return Filing",
                extractedData,
                [] 
            );

            createApplicationRecord(newProfile, [], "Nil Return – Under Processing", 'Nil');

            setTimeout(() => {
                setIsSubmitting(false);
                setStep('processing');
            }, 1000);
        } catch (error) {
            console.error("Error processing nil return", error);
            setIsSubmitting(false);
        }
    };

    const createApplicationRecord = (profile: any, documents: any[], status: string, filingType: string) => {
        const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");
        const newSubmission = {
            id: Date.now(),
            service: "GST Return Filing",
            clientName: client.name,
            clientId: client.id,
            profileName: profile.name,
            profileId: profile.id,
            mobile: user?.mobileNumber || client.mobileNumber,
            entityType: client.entityType,
            extractedData: profile.extractedData,
            documents: documents,
            status: status,
            submittedAt: new Date().toLocaleString(),
            filingType: filingType,
            createdByType: 'customer'
        };
        
        existingSubmissions.push(newSubmission);
        localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));
    };

    const handleBack = () => {
        if (step === 'dashboard') setStep('login'); 
        if (step === 'return-type-selection') {
            setSelectedPeriod(null);
            setStep('dashboard');
        }
        if (step === 'upload') {
            setSalesFile(null); 
            setPurchaseFile(null);
            setStep('return-type-selection');
        }
        if (step === 'nil-confirmation') {
            setStep('return-type-selection');
        }
        if (step === 'processing') setPage('user-dashboard');
    };

    const handleExitToServices = () => {
        setPage('services');
    };

    // --- RENDERERS ---

    // 0. LOADING INIT
    if (step === 'init') {
        return <div className="min-h-screen flex items-center justify-center"><LoaderIcon /></div>;
    }

    // 1. LOGIN SCREEN
    if (step === 'login') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <button onClick={() => setPage('gst-service-selection')} className="absolute top-24 left-4 md:left-20 text-sm text-gray-500 hover:text-ease-blue">&larr; Back</button>
                
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">GST Return Filing</h2>
                        <p className="mt-2 text-sm text-gray-600">Connect your GST Account to proceed.</p>
                    </div>
                    
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="relative">
                                <label htmlFor="userId" className="sr-only">GST User ID</label>
                                <input
                                    id="userId"
                                    name="userId"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-ease-blue focus:border-ease-blue focus:z-10 sm:text-sm"
                                    placeholder="GST User ID"
                                    value={credentials.userId}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, userId: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">GST Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-ease-blue focus:border-ease-blue focus:z-10 sm:text-sm"
                                    placeholder="GST Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                            <LockClosedIcon />
                            <span className="ml-2">Credentials are encrypted and saved for future filings.</span>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue transition-colors"
                            >
                                Connect & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 2. DASHBOARD SCREEN
    if (step === 'dashboard') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
                    <button onClick={handleExitToServices} className="text-sm text-ease-blue hover:underline font-medium">← Back to Services</button>
                    
                    {/* Account Status / Settings */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-sm text-gray-700 font-medium">GST Connected: {client.gstCredentials?.userId}</span>
                            <SettingsIcon />
                        </button>
                        
                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100 ring-1 ring-black ring-opacity-5 animate-fade-in-up">
                                <button onClick={handleUpdateCredentials} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Update Credentials</button>
                                <button onClick={handleDisconnect} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Disconnect Account</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">GST Dashboard</h1>
                            <p className="text-gray-600 mt-1">Client: <span className="font-semibold">{client.name}</span></p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <select 
                                value={fy} 
                                onChange={(e) => setFy(e.target.value)}
                                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-ease-blue focus:border-ease-blue sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="2024-2025">FY 2024-25</option>
                                <option value="2023-2024">FY 2023-24</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {MONTHS.map((month, idx) => {
                            // Mock status logic for demo
                            let status = 'Not Started';
                            let statusColor = 'bg-gray-100 text-gray-600';
                            
                            if (idx < 2) { status = 'Filed'; statusColor = 'bg-green-100 text-green-800'; }
                            else if (idx === 2) { status = 'Due'; statusColor = 'bg-yellow-100 text-yellow-800'; }

                            return (
                                <div 
                                    key={month}
                                    onClick={() => handlePeriodSelect(month, status)}
                                    className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer flex flex-col justify-between h-32 ${
                                        status === 'Filed' 
                                            ? 'border-green-100 hover:border-green-200' 
                                            : 'border-transparent hover:border-ease-blue hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-gray-800">{month}</h3>
                                        {status === 'Filed' && <CheckCircleIcon />}
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                            {status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // 3. RETURN TYPE SELECTION (NEW STEP)
    if (step === 'return-type-selection') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue hover:underline">← Back to Dashboard</button>
                        <button onClick={handleExitToServices} className="text-sm text-ease-blue hover:underline font-medium">Back to Services</button>
                    </div>
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">GST Return Type</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Select the type of return for <span className="font-semibold text-ease-blue">{selectedPeriod} ({fy})</span>
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Regular Return Option */}
                        <div 
                            onClick={() => handleSelectReturnType('regular')}
                            className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-ease-blue hover:shadow-lg transition-all group text-center"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-blue-50 rounded-full group-hover:scale-110 transition-transform">
                                    <DocumentTextIcon />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-ease-blue">Regular GST Return</h3>
                            <p className="text-gray-500 text-sm">For periods with sales, purchases, or input tax credit (ITC) claims.</p>
                            <div className="mt-6">
                                <span className="text-ease-blue font-semibold text-sm">Proceed to Upload &rarr;</span>
                            </div>
                        </div>

                        {/* Nil Return Option */}
                        <div 
                            onClick={() => handleSelectReturnType('nil')}
                            className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-gray-400 hover:shadow-lg transition-all group text-center"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-gray-100 rounded-full group-hover:scale-110 transition-transform">
                                    <BanIcon />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-600">Nil GST Return</h3>
                            <p className="text-gray-500 text-sm">For periods with NO outward supplies (Sales) and NO inward supplies (Purchases).</p>
                            <div className="mt-6">
                                <span className="text-gray-600 font-semibold text-sm">Select Nil Return &rarr;</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. NIL CONFIRMATION (NEW STEP)
    if (step === 'nil-confirmation') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Nil Filing</h2>
                    <p className="text-gray-600 mb-6">
                        You have selected <strong>Nil GST Return</strong> for <span className="font-semibold">{selectedPeriod}</span>.
                        <br/><br/>
                        This implies you had <strong>zero sales</strong> and <strong>zero purchases</strong> during this period. No documents are required.
                    </p>
                    
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={handleNilSubmit}
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-ease-green hover:bg-ease-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-green transition-colors disabled:opacity-70"
                        >
                            {isSubmitting ? <LoaderIcon /> : 'Submit Nil Return for Processing'}
                        </button>
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel & Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. UPLOAD SCREEN (Existing - Logic kept same)
    if (step === 'upload') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handleBack} className="text-sm text-gray-600 hover:text-ease-blue hover:underline">← Back to Return Type</button>
                        <button onClick={handleExitToServices} className="text-sm text-ease-blue hover:underline font-medium">Back to Services</button>
                    </div>
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Filing Regular Return for <span className="font-semibold text-ease-blue">{selectedPeriod} ({fy})</span>
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-8 space-y-8">
                            
                            {/* Sales Upload */}
                            <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${salesFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-ease-blue'}`}>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                                        {salesFile ? <CheckCircleIcon /> : <DocumentZipIcon />}
                                    </div>
                                    <div className="ml-5 flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">Sales Invoices</h3>
                                        <p className="text-sm text-gray-500 mb-2">Upload ZIP containing all sales invoices for the period.</p>
                                        
                                        {salesFile ? (
                                            <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-green-200">
                                                <span className="font-medium text-gray-700 truncate">{salesFile.name}</span>
                                                <button onClick={() => setSalesFile(null)} className="text-red-500 hover:text-red-700 ml-4 font-bold">&times;</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ease-blue hover:bg-ease-blue/90">
                                                <span>Select File</span>
                                                <input type="file" className="hidden" accept=".zip,.rar,.pdf,.xls,.xlsx,.csv" onChange={(e) => e.target.files && setSalesFile(e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Upload */}
                            <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${purchaseFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-ease-blue'}`}>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                                        {purchaseFile ? <CheckCircleIcon /> : <DocumentZipIcon />}
                                    </div>
                                    <div className="ml-5 flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">Purchase Invoices</h3>
                                        <p className="text-sm text-gray-500 mb-2">Upload ZIP containing all purchase bills/invoices.</p>
                                        
                                        {purchaseFile ? (
                                            <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-green-200">
                                                <span className="font-medium text-gray-700 truncate">{purchaseFile.name}</span>
                                                <button onClick={() => setPurchaseFile(null)} className="text-red-500 hover:text-red-700 ml-4 font-bold">&times;</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ease-blue hover:bg-ease-blue/90">
                                                <span>Select File</span>
                                                <input type="file" className="hidden" accept=".zip,.rar,.pdf,.xls,.xlsx,.csv" onChange={(e) => e.target.files && setPurchaseFile(e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="bg-gray-50 px-8 py-6 flex justify-end">
                            <button
                                onClick={handleUploadSubmit}
                                disabled={!salesFile || !purchaseFile || isSubmitting}
                                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-ease-green hover:bg-ease-green/90 md:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                {isSubmitting ? <LoaderIcon /> : 'Submit for Processing'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 6. PROCESSING / SUCCESS SCREEN (Updated)
    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                        <CheckCircleIcon />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        {returnType === 'nil' ? 'Nil Return – Under Processing' : 'Processing Started'}
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        {returnType === 'nil' 
                            ? `We are preparing your Nil GST Return for ${selectedPeriod}. No invoices needed.`
                            : `We are extracting invoice data and preparing your GST return for ${selectedPeriod}.`
                        }
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left text-sm text-blue-800 mb-8">
                        <p className="font-semibold">Next Steps:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {returnType === 'nil' ? (
                                <>
                                    <li>Our system will validate your Nil status.</li>
                                    <li>A draft return will be generated automatically.</li>
                                    <li>You will receive an acknowledgement shortly.</li>
                                </>
                            ) : (
                                <>
                                    <li>Our AI will analyze your invoices.</li>
                                    <li>A draft return will be generated for your review.</li>
                                    <li>You will be notified once the draft is ready.</li>
                                </>
                            )}
                        </ul>
                    </div>

                    <button
                        onClick={() => setPage('user-dashboard')}
                        className="w-full inline-flex justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                        Go to My Applications
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default GstReturnFilingPage;
