
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useClientManager, fileToDataURL, Document as ProfileDocument } from '../../hooks/useProfile';
import { LoaderIcon } from '../icons/LoaderIcon';

// Icons
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const CloudUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

interface Seller {
    pan: string;
    email: string;
    mobile: string;
    sharePercent: number;
}

const TdsOnPropertyPage: React.FC = () => {
    const { setPage, selectedClientId } = useAppContext();
    const { getClient, processServiceApplication } = useClientManager();
    const client = selectedClientId ? getClient(selectedClientId) : null;

    const [step, setStep] = useState<'form' | 'success'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [numSellers, setNumSellers] = useState(1);
    const [propertyValue, setPropertyValue] = useState('');
    const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);
    const [sellers, setSellers] = useState<Seller[]>([
        { pan: '', email: '', mobile: '', sharePercent: 100 }
    ]);

    const [stagedFiles, setStagedFiles] = useState<File[]>([]);

    useEffect(() => {
        if (!selectedClientId) setPage('user-dashboard');
    }, [selectedClientId, setPage]);

    // Handle number of sellers change
    const handleNumSellersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value);
        setNumSellers(val);
        const newSellers = Array.from({ length: val }, (_, i) => sellers[i] || {
            pan: '', email: '', mobile: '', sharePercent: Math.floor(100 / val)
        });
        // Adjust the last one to make sure total is 100
        if (newSellers.length > 0) {
            const sum = newSellers.slice(0, -1).reduce((acc, curr) => acc + curr.sharePercent, 0);
            newSellers[newSellers.length - 1].sharePercent = Math.max(0, 100 - sum);
        }
        setSellers(newSellers);
    };

    const handleSellerChange = (index: number, field: keyof Seller, value: any) => {
        const updated = [...sellers];
        if (field === 'pan') value = value.toUpperCase();
        updated[index] = { ...updated[index], [field]: value };
        setSellers(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setStagedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const calculatedTdsBreakdown = useMemo(() => {
        const totalValue = parseFloat(propertyValue) || 0;
        return sellers.map(s => {
            const shareAmount = (totalValue * s.sharePercent) / 100;
            return {
                ...s,
                shareAmount,
                tdsAmount: Math.round(shareAmount * 0.01)
            };
        });
    }, [propertyValue, sellers]);

    const totalCalculatedTds = calculatedTdsBreakdown.reduce((acc, curr) => acc + curr.tdsAmount, 0);

    const validateForm = () => {
        if (stagedFiles.length === 0) return 'Please upload at least one property document.';
        if (!propertyValue || parseFloat(propertyValue) <= 0) return 'Invalid Property Value.';

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        for (let i = 0; i < sellers.length; i++) {
            const s = sellers[i];
            if (!panRegex.test(s.pan)) return `Invalid PAN format for Seller ${i + 1}.`;
            if (!s.email.includes('@')) return `Invalid Email for Seller ${i + 1}.`;
            if (!/^\d{10}$/.test(s.mobile)) return `Seller ${i + 1} mobile must be 10 digits.`;
        }

        const totalShare = sellers.reduce((acc, curr) => acc + curr.sharePercent, 0);
        if (totalShare !== 100) return 'Total share percentage must equal 100%.';

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateForm();
        if (err) { setError(err); return; }
        setError('');
        setIsSubmitting(true);

        try {
            const docs: ProfileDocument[] = await Promise.all(stagedFiles.map(async file => ({
                type: 'Property Document',
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                fileData: await fileToDataURL(file)
            })));

            const serviceBaseName = "TDS on Property (Section 194-IA)";
            const existingSubmissions = JSON.parse(localStorage.getItem("charteredease_submissions") || "[]");

            // For each seller, create a separate application entry
            for (let i = 0; i < calculatedTdsBreakdown.length; i++) {
                const s = calculatedTdsBreakdown[i];
                const sellerData = {
                    ...s,
                    totalPropertyValue: propertyValue,
                    agreementDate,
                };

                const newProfile = processServiceApplication(client!.id, null, `${serviceBaseName} - Seller ${i + 1}`, sellerData, docs);

                existingSubmissions.push({
                    id: Date.now() + i, // Unique ID for each
                    service: `${serviceBaseName} (Seller: ${s.pan})`,
                    clientName: client!.name,
                    clientId: client!.id,
                    profileName: `Form 26QB Filing - Seller ${i + 1}`,
                    profileId: newProfile.id,
                    mobile: client!.mobileNumber,
                    entityType: client!.entityType,
                    extractedData: sellerData,
                    documents: docs,
                    status: "In Progress",
                    submittedAt: new Date().toLocaleString(),
                });
            }

            localStorage.setItem("charteredease_submissions", JSON.stringify(existingSubmissions));

            setIsSubmitting(false);
            setStep('success');
        } catch (e) {
            console.error(e);
            setError('Failed to process application. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-2xl w-full text-center animate-fade-in">
                    <div className="flex justify-center mb-6"><CheckCircleIcon /></div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Filing Initialized!</h2>
                    <p className="text-gray-600 mb-8">
                        We have received your TDS on Property request for <strong>{numSellers} seller(s)</strong>. 
                        We will generate {numSellers} separate Form 26QB filings.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-left mb-8">
                        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Seller-wise Breakdown</h3>
                        <div className="space-y-4">
                            {calculatedTdsBreakdown.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">Seller {idx + 1}: {s.pan}</p>
                                        <p className="text-xs text-gray-500">{s.sharePercent}% Share</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-ease-blue">TDS: ₹{s.tdsAmount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Value: ₹{s.shareAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t flex justify-between items-center">
                                <span className="font-bold text-gray-800">Total TDS Payable</span>
                                <span className="text-xl font-extrabold text-ease-green">₹{totalCalculatedTds.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setPage('user-dashboard')}
                        className="w-full bg-ease-blue text-white py-3 rounded-xl font-bold hover:bg-ease-blue/90 transition-all shadow-md"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <button onClick={() => setPage('user-dashboard')} className="flex items-center text-sm text-gray-600 hover:text-ease-blue mb-8">
                <BackArrowIcon /> <span className="ml-2">Back to Dashboard</span>
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-ease-blue p-8 text-white">
                    <h1 className="text-3xl font-bold">TDS on Property Purchased</h1>
                    <p className="text-blue-100 mt-2">Section 194-IA Compliance Manager – Multiple Sellers Support</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-12">
                    
                    {/* SECTION 1: TRANSACTION BASICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-3 border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <span className="bg-blue-100 text-ease-blue w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                                Transaction Details
                            </h2>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Property Value (₹)</label>
                            <input
                                type="number"
                                placeholder="e.g. 7500000"
                                className="input"
                                value={propertyValue}
                                onChange={(e) => setPropertyValue(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Number of Sellers</label>
                            <select 
                                className="input" 
                                value={numSellers} 
                                onChange={handleNumSellersChange}
                            >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Agreement</label>
                            <input
                                type="date"
                                className="input"
                                value={agreementDate}
                                onChange={(e) => setAgreementDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* SECTION 2: PROPERTY DOCUMENTS */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="bg-blue-100 text-ease-blue w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                            Property Documents
                        </h2>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                            <div className="flex flex-col items-center">
                                <CloudUploadIcon />
                                <p className="mt-3 text-gray-700 font-medium">Click or drag to upload Index II / Sale Deed</p>
                                <p className="text-xs text-gray-400 mt-1">Upload at least one document for verification.</p>
                            </div>
                        </div>
                        {stagedFiles.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {stagedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                        <span className="text-xs font-medium truncate">{f.name}</span>
                                        <button type="button" onClick={() => removeFile(i)} className="p-1"><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: SELLER(S) DETAILS */}
                    <div className="space-y-8">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <span className="bg-blue-100 text-ease-blue w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                                Seller Information & Share Breakdown
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {sellers.map((seller, idx) => (
                                <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative animate-fade-in-up">
                                    <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-gray-200">
                                        <div className="bg-ease-blue text-white w-6 h-6 rounded text-xs flex items-center justify-center font-bold">S{idx + 1}</div>
                                        <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">Details for Seller {idx + 1}</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">PAN of Seller</label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                placeholder="ABCDE1234F"
                                                className="input uppercase text-sm"
                                                value={seller.pan}
                                                onChange={(e) => handleSellerChange(idx, 'pan', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email ID</label>
                                            <input
                                                type="email"
                                                placeholder="seller@mail.com"
                                                className="input lowercase text-sm"
                                                value={seller.email}
                                                onChange={(e) => handleSellerChange(idx, 'email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Number</label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="9988776655"
                                                className="input text-sm"
                                                value={seller.mobile}
                                                onChange={(e) => handleSellerChange(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Share (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    className="input text-sm pr-8"
                                                    value={seller.sharePercent}
                                                    onChange={(e) => handleSellerChange(idx, 'sharePercent', parseInt(e.target.value) || 0)}
                                                    required
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 text-xs">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Row for this seller */}
                                    <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center bg-blue-50/50 -mx-6 -mb-6 px-6 py-3 rounded-b-2xl">
                                        <p className="text-xs text-gray-500">Seller {idx + 1} Share: <span className="font-bold text-gray-700">₹{calculatedTdsBreakdown[idx].shareAmount.toLocaleString()}</span></p>
                                        <p className="text-xs text-ease-blue font-bold">1% TDS to be deducted: ₹{calculatedTdsBreakdown[idx].tdsAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: CONSOLIDATED CALCULATION */}
                    <div className="bg-ease-blue text-white p-8 rounded-2xl shadow-xl">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold opacity-80">Total Summary</h3>
                                <p className="text-sm opacity-60">Consolidated TDS for {numSellers} Seller(s)</p>
                            </div>
                            <div className="mt-4 md:mt-0 text-center md:text-right">
                                <p className="text-4xl font-black">₹{totalCalculatedTds.toLocaleString()}</p>
                                <p className="text-xs opacity-70 mt-1 uppercase font-bold tracking-widest">Total TDS Amount to be Filed</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-ease-green text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:bg-green-700 transition-all transform hover:-translate-y-0.5 flex justify-center items-center disabled:opacity-50"
                        >
                            {isSubmitting ? <LoaderIcon /> : `Confirm & File for ${numSellers} Seller(s)`}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4 italic">
                            By confirming, you authorize Chartered Ease to prepare {numSellers} Form 26QB filings.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TdsOnPropertyPage;
