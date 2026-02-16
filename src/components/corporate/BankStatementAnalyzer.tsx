
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type, Schema, GenerateContentResponse } from '@google/genai';
import { PDFDocument } from 'pdf-lib';
import { LoaderIcon } from '../icons/LoaderIcon';
import { downloadFile, fileToDataURL } from '../../hooks/useProfile';

// --- ICONS ---
const CloudUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const DocumentDownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3A12.02 12.02 0 0021 7.923z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

// --- TYPES ---
type TransactionType = 'Credit' | 'Debit';
type Category = 'Revenue' | 'Purchases' | 'Salaries' | 'Rent' | 'Utilities' | 'Travel' | 'Marketing' | 'Banking Charges' | 'GST Payment' | 'Loans/EMI' | 'Personal' | 'Interest Income' | 'Unknown';

interface Invoice {
    id: string;
    type: 'Sales' | 'Purchase';
    invoiceNo: string;
    invoiceDate: string;
    partyName: string;
    gstin?: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    status: 'Unpaid' | 'Paid' | 'Partially Paid';
    linkedTransactionId?: string; // If fully matched
}

interface Transaction {
    id: string;
    date: string;
    description: string;
    refNo: string;
    amount: number;
    type: TransactionType;
    category: Category;
    mode: string;
    counterparty: string;
    gstin?: string;
    flags?: string[];
    balance?: number;
    matchedInvoiceId?: string; // For reconciliation
    matchScore?: number;
}

interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    transactionRef?: string;
}

interface AiInsights {
    riskScore: number; 
    auditRecommendations: string[];
    gstInsights: string;
    cashflowSummary: string;
}

interface FinancialStatements {
    profit_and_loss: any;
    cash_flow: any;
    balance_sheet: any;
    vendor_customer_summary: any;
}

const CATEGORY_COLORS: Record<Category, string> = {
    'Revenue': 'bg-green-100 text-green-800',
    'Interest Income': 'bg-emerald-100 text-emerald-800',
    'Purchases': 'bg-orange-100 text-orange-800',
    'Salaries': 'bg-blue-100 text-blue-800',
    'Rent': 'bg-purple-100 text-purple-800',
    'Utilities': 'bg-gray-100 text-gray-800',
    'Travel': 'bg-teal-100 text-teal-800',
    'Marketing': 'bg-pink-100 text-pink-800',
    'Banking Charges': 'bg-red-50 text-red-600',
    'GST Payment': 'bg-indigo-100 text-indigo-800',
    'Loans/EMI': 'bg-yellow-100 text-yellow-800',
    'Personal': 'bg-red-100 text-red-800',
    'Unknown': 'bg-gray-200 text-gray-600'
};

// --- HELPER: Retry Logic ---
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(res => setTimeout(res, delay));
        return retry(fn, retries - 1, delay * 2);
    }
}

// --- HELPER: CSV Parsing ---
const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {} as any);
    });
};

// --- HELPER: Similarity Score ---
const calculateMatchScore = (tx: Transaction, inv: Invoice): number => {
    let score = 0;
    // 1. Amount Match (40%)
    const diff = Math.abs(tx.amount - inv.totalAmount);
    if (diff < 1) score += 40;
    else if (diff < 10) score += 30;

    // 2. UTR / Ref Match (30%)
    if (tx.refNo && inv.invoiceNo && (tx.refNo.includes(inv.invoiceNo) || tx.description.includes(inv.invoiceNo))) {
        score += 30;
    }

    // 3. Party Name Fuzzy Match (15%)
    const txName = tx.counterparty.toLowerCase();
    const invName = inv.partyName.toLowerCase();
    if (txName.includes(invName) || invName.includes(txName)) score += 15;

    // 4. Date Proximity (10%) - within 5 days
    const d1 = new Date(tx.date).getTime();
    const d2 = new Date(inv.invoiceDate).getTime();
    const dayDiff = Math.abs(d1 - d2) / (1000 * 3600 * 24);
    if (dayDiff <= 5) score += 10;

    // 5. GSTIN Match (5%)
    if (tx.gstin && inv.gstin && tx.gstin === inv.gstin) score += 5;

    return score;
};

// --- COMPONENT ---
export const BankStatementAnalyzer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [processingStage, setProcessingStage] = useState<'idle' | 'extracting' | 'classifying' | 'analyzing' | 'financials' | 'reconciling' | 'complete'>('idle');
    const [progressText, setProgressText] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    
    const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
    const [financialStatements, setFinancialStatements] = useState<FinancialStatements | null>(null);
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'purchases' | 'reconciliation' | 'gstr' | 'financials' | 'transactions'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    // --- 1. SALES UPLOAD ---
    const handleSalesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                const rawData = parseCSV(text);
                const invoices: Invoice[] = rawData.map((row: any, idx: number) => ({
                    id: `inv_sales_${Date.now()}_${idx}`,
                    type: 'Sales',
                    invoiceNo: row['Invoice No'] || row['Invoice Number'] || `INV-${idx}`,
                    invoiceDate: row['Invoice Date'] || row['Date'] || new Date().toISOString().split('T')[0],
                    partyName: row['Customer Name'] || row['Party Name'] || 'Unknown Customer',
                    gstin: row['GSTIN'] || row['Customer GSTIN'],
                    taxableValue: parseFloat(row['Taxable Value'] || row['Taxable'] || '0'),
                    cgst: parseFloat(row['CGST'] || '0'),
                    sgst: parseFloat(row['SGST'] || '0'),
                    igst: parseFloat(row['IGST'] || '0'),
                    totalAmount: parseFloat(row['Total Amount'] || row['Invoice Value'] || '0'),
                    status: 'Unpaid'
                }));
                setSalesInvoices(prev => [...prev, ...invoices]);
                alert(`Uploaded ${invoices.length} sales invoices.`);
            } catch (err) {
                alert('Failed to parse Sales CSV. Please ensure headers: Invoice No, Invoice Date, Customer Name, Taxable Value, CGST, SGST, IGST, Total Amount');
            }
        };
        reader.readAsText(file);
    };

    // --- 2. PURCHASE UPLOAD (OCR + CSV) ---
    const handlePurchaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setProcessingStage('extracting');
        setProgressText('Processing Purchase Documents...');

        for (const file of files) {
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                // AI Extraction
                await processPurchaseInvoiceAI(file);
            } else if (file.type.includes('csv')) {
                // CSV Parsing
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    const rawData = parseCSV(text);
                    const invoices: Invoice[] = rawData.map((row: any, idx: number) => ({
                        id: `inv_pur_${Date.now()}_${idx}`,
                        type: 'Purchase',
                        invoiceNo: row['Invoice No'] || `PUR-${idx}`,
                        invoiceDate: row['Date'] || new Date().toISOString().split('T')[0],
                        partyName: row['Vendor Name'] || 'Unknown Vendor',
                        gstin: row['GSTIN'],
                        taxableValue: parseFloat(row['Taxable'] || '0'),
                        cgst: parseFloat(row['CGST'] || '0'),
                        sgst: parseFloat(row['SGST'] || '0'),
                        igst: parseFloat(row['IGST'] || '0'),
                        totalAmount: parseFloat(row['Total'] || '0'),
                        status: 'Unpaid'
                    }));
                    setPurchaseInvoices(prev => [...prev, ...invoices]);
                };
                reader.readAsText(file);
            }
        }
        setProcessingStage('complete');
        setProgressText('');
    };

    const processPurchaseInvoiceAI = async (file: File) => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                invoiceNo: { type: Type.STRING },
                date: { type: Type.STRING },
                vendorName: { type: Type.STRING },
                vendorGstin: { type: Type.STRING },
                taxable: { type: Type.NUMBER },
                cgst: { type: Type.NUMBER },
                sgst: { type: Type.NUMBER },
                igst: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
            }
        };

        try {
            const res = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: "Extract invoice details" }, { inlineData: { mimeType: file.type, data: (await fileToDataURL(file)).split(',')[1] } }] },
                config: { responseMimeType: "application/json", responseSchema: schema }
            });
            const data = JSON.parse(res.text!);
            const newInv: Invoice = {
                id: `inv_ocr_${Date.now()}`,
                type: 'Purchase',
                invoiceNo: data.invoiceNo || 'Unknown',
                invoiceDate: data.date || new Date().toISOString().split('T')[0],
                partyName: data.vendorName || 'Unknown Vendor',
                gstin: data.vendorGstin,
                taxableValue: data.taxable || 0,
                cgst: data.cgst || 0,
                sgst: data.sgst || 0,
                igst: data.igst || 0,
                totalAmount: data.total || 0,
                status: 'Unpaid'
            };
            setPurchaseInvoices(prev => [...prev, newInv]);
        } catch (e) { console.error("OCR Failed", e); }
    };

    // --- 3. RECONCILIATION ENGINE ---
    const runAutoReconciliation = () => {
        setProcessingStage('reconciling');
        setProgressText('Matching Bank Transactions with Invoices...');
        
        const updatedTransactions = transactions.map(tx => {
            if (tx.matchedInvoiceId) return tx; // Already matched

            // Find candidates
            const targetInvoices = tx.type === 'Credit' ? salesInvoices : purchaseInvoices;
            let bestMatch: Invoice | null = null;
            let bestScore = 0;

            targetInvoices.forEach(inv => {
                if (inv.status === 'Paid') return;
                const score = calculateMatchScore(tx, inv);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = inv;
                }
            });

            // Auto-Accept Threshold: 92
            if (bestMatch && bestScore >= 92) {
                // Mark Invoice as Paid
                if (tx.type === 'Credit') {
                    setSalesInvoices(prev => prev.map(i => i.id === (bestMatch as Invoice).id ? { ...i, status: 'Paid', linkedTransactionId: tx.id } : i));
                } else {
                    setPurchaseInvoices(prev => prev.map(i => i.id === (bestMatch as Invoice).id ? { ...i, status: 'Paid', linkedTransactionId: tx.id } : i));
                }
                
                // Create Ledger Entry
                const ledger: LedgerEntry = {
                    id: `ldg_${Date.now()}_${tx.id}`,
                    date: tx.date,
                    description: `Payment for ${(bestMatch as Invoice).invoiceNo}`,
                    debitAccount: tx.type === 'Debit' ? (bestMatch as Invoice).partyName : 'Bank',
                    creditAccount: tx.type === 'Debit' ? 'Bank' : (bestMatch as Invoice).partyName,
                    amount: tx.amount,
                    transactionRef: tx.id
                };
                setLedgerEntries(prev => [...prev, ledger]);

                return { ...tx, matchedInvoiceId: (bestMatch as Invoice).id, matchScore: bestScore };
            } else if (bestMatch && bestScore >= 60) {
                // Suggestion Only
                return { ...tx, matchScore: bestScore, suggestedInvoiceId: (bestMatch as Invoice).id };
            }

            return tx;
        });

        setTransactions(updatedTransactions);
        setProcessingStage('complete');
        setProgressText('');
        setActiveTab('reconciliation');
    };

    const manualMatch = (txId: string, invId: string) => {
        setTransactions(prev => prev.map(t => t.id === txId ? { ...t, matchedInvoiceId: invId, matchScore: 100 } : t));
        // Update invoice status logic here...
    };

    // --- 4. GSTR GENERATION ---
    const gstr1Data = useMemo(() => {
        // Aggregate B2B and B2C
        const b2b = salesInvoices.filter(i => i.gstin);
        const b2c = salesInvoices.filter(i => !i.gstin);
        
        const sum = (invs: Invoice[], key: keyof Invoice) => invs.reduce((acc, curr) => acc + (curr[key] as number), 0);

        return {
            b2bCount: b2b.length,
            b2bTaxable: sum(b2b, 'taxableValue'),
            b2bTax: sum(b2b, 'cgst') + sum(b2b, 'sgst') + sum(b2b, 'igst'),
            b2cCount: b2c.length,
            b2cTaxable: sum(b2c, 'taxableValue'),
            b2cTax: sum(b2c, 'cgst') + sum(b2c, 'sgst') + sum(b2c, 'igst'),
        };
    }, [salesInvoices]);

    const gstr3bData = useMemo(() => {
        const totalSalesTax = salesInvoices.reduce((acc, i) => acc + i.cgst + i.sgst + i.igst, 0);
        const totalPurchaseTax = purchaseInvoices.reduce((acc, i) => acc + i.cgst + i.sgst + i.igst, 0); // ITC
        return {
            outwardTax: totalSalesTax,
            itcAvailable: totalPurchaseTax,
            netPayable: Math.max(0, totalSalesTax - totalPurchaseTax)
        };
    }, [salesInvoices, purchaseInvoices]);


    // --- EXISTING BANK ANALYSIS LOGIC (Preserved) ---
    const processWithAI = async (file: File) => {
        if (!process.env.API_KEY) { setError("API Key missing"); return; }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';
        
        const transactionSchema: Schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "YYYY-MM-DD" },
                    description: { type: Type.STRING },
                    refNo: { type: Type.STRING },
                    debit_amount: { type: Type.NUMBER },
                    credit_amount: { type: Type.NUMBER },
                    balance: { type: Type.NUMBER },
                    mode: { type: Type.STRING },
                    counterparty_name: { type: Type.STRING },
                    gstin_detected: { type: Type.STRING },
                    category: { type: Type.STRING, enum: Object.keys(CATEGORY_COLORS) },
                    flags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        };

        try {
            setProcessingStage('extracting');
            setProgressText("Analyzing Bank Statement...");
            
            let allTransactions: any[] = [];
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                const totalPages = pdfDoc.getPageCount();
                const BATCH_SIZE = 2;
                
                const processBatch = async (start: number, end: number) => {
                    const subDoc = await PDFDocument.create();
                    const indices = Array.from({ length: end - start }, (_, i) => start + i);
                    const copied = await subDoc.copyPages(pdfDoc, indices);
                    copied.forEach(p => subDoc.addPage(p));
                    const b64 = await subDoc.saveAsBase64({ dataUri: false });
                    
                    return retry(async () => {
                        const res = await ai.models.generateContent({
                            model,
                            contents: { parts: [{ text: "Extract table rows. Merge multiline desc. Extract Date, Ref, Debit, Credit, Balance. Categorize." }, { inlineData: { mimeType: 'application/pdf', data: b64 } }] },
                            config: { responseMimeType: "application/json", responseSchema: transactionSchema }
                        });
                        return JSON.parse(res.text!);
                    });
                };

                for (let i = 0; i < totalPages; i += BATCH_SIZE) {
                    const batchRes = await processBatch(i, Math.min(i + BATCH_SIZE, totalPages));
                    allTransactions.push(...batchRes);
                }
            } else {
                // Image flow...
                const dataUrl = await fileToDataURL(file);
                const res = await ai.models.generateContent({
                    model,
                    contents: { parts: [{ text: "Extract table." }, { inlineData: { mimeType: file.type, data: dataUrl.split(',')[1] } }] },
                    config: { responseMimeType: "application/json", responseSchema: transactionSchema }
                });
                allTransactions = JSON.parse(res.text!);
            }

            const normalized = allTransactions.map((t, i) => ({
                id: `tx_${Date.now()}_${i}`,
                date: t.date,
                description: t.description,
                refNo: t.refNo || '',
                amount: (t.debit_amount || 0) > 0 ? t.debit_amount : (t.credit_amount || 0),
                type: (t.credit_amount || 0) > 0 ? 'Credit' as const : 'Debit' as const,
                category: t.category || 'Unknown',
                mode: t.mode || 'AUTO',
                counterparty: t.counterparty_name || 'Unknown',
                gstin: t.gstin_detected,
                flags: t.flags || [],
                balance: t.balance
            })).filter(t => t.amount > 0);

            setTransactions(normalized);
            setProcessingStage('complete');
            setProgressText('');
        } catch (e: any) {
            console.error(e);
            setError("Processing failed. Try a simpler file.");
            setProcessingStage('idle');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            processWithAI(e.target.files[0]);
        }
    };

    const handleDownloadReport = (title: string) => {
        const data = title === 'GSTR-1' ? JSON.stringify(gstr1Data, null, 2) : 
                     title === 'GSTR-3B' ? JSON.stringify(gstr3bData, null, 2) :
                     JSON.stringify(transactions, null, 2);
        downloadFile(`${title}.json`, `data:application/json;base64,${btoa(data)}`);
    };

    // --- RENDERERS ---

    if (!file || processingStage === 'idle') {
        return (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-4xl mx-auto mt-8 animate-fade-in">
                <button onClick={onBack} className="absolute top-6 left-6 text-sm text-gray-500 hover:underline">&larr; Back</button>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Accounting & Compliance Hub</h2>
                <p className="text-gray-600 mb-8">End-to-end financial automation: Bank Analysis, Reconciliation, and GSTR Filing.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors bg-gray-50">
                        <h3 className="font-bold text-gray-700 mb-2">1. Upload Bank Statement</h3>
                        <p className="text-xs text-gray-500 mb-4">PDF / Excel</p>
                        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 text-sm font-bold">
                            Select Statement
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                        </label>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-8 opacity-50">
                        <h3 className="font-bold text-gray-700 mb-2">2. Upload Invoices</h3>
                        <p className="text-xs text-gray-500">Sales & Purchases</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-8 opacity-50">
                        <h3 className="font-bold text-gray-700 mb-2">3. Auto-Reconcile</h3>
                        <p className="text-xs text-gray-500">AI Match & GSTR</p>
                    </div>
                </div>
                
                {error && <p className="text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            </div>
        );
    }

    /* Fix: Removed processingStage !== 'idle' because redundant with block above */
    if (processingStage !== 'complete') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoaderIcon />
                <p className="mt-4 text-gray-600 font-medium">{progressText}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 rounded-lg mb-6 flex justify-between items-center">
                <div>
                    <button onClick={onBack} className="text-xs text-gray-500 hover:underline">&larr; Back</button>
                    <h1 className="text-xl font-bold text-gray-800">Financial Hub: {file.name}</h1>
                </div>
                <div className="flex space-x-2">
                    <label className="bg-white border px-3 py-1.5 rounded text-sm font-medium cursor-pointer hover:bg-gray-50">
                        + Upload Sales (CSV)
                        <input type="file" className="hidden" onChange={handleSalesUpload} accept=".csv" />
                    </label>
                    <label className="bg-white border px-3 py-1.5 rounded text-sm font-medium cursor-pointer hover:bg-gray-50">
                        + Upload Purchase (PDF/CSV)
                        <input type="file" className="hidden" multiple onChange={handlePurchaseUpload} accept=".csv,.pdf,.jpg,.png" />
                    </label>
                    <button onClick={runAutoReconciliation} className="bg-ease-blue text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-blue-700">
                        Run Auto-Reconcile
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-lg border-b border-gray-200 px-4">
                <nav className="flex space-x-4">
                    {['dashboard', 'sales', 'purchases', 'reconciliation', 'gstr', 'transactions'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                                activeTab === tab ? 'border-ease-blue text-ease-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="bg-white rounded-b-lg shadow p-6 min-h-[500px]">
                
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-blue-800 mb-2">Bank Summary</h3>
                            <p className="text-sm text-blue-600">Transactions: {transactions.length}</p>
                            <p className="text-sm text-blue-600">Unreconciled: {transactions.filter(t => !t.matchedInvoiceId).length}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-green-800 mb-2">Sales Register</h3>
                            <p className="text-sm text-green-600">Invoices: {salesInvoices.length}</p>
                            <p className="text-sm text-green-600">Total Value: ₹ {salesInvoices.reduce((a,b)=>a+b.totalAmount, 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-orange-800 mb-2">Purchase Register</h3>
                            <p className="text-sm text-orange-600">Invoices: {purchaseInvoices.length}</p>
                            <p className="text-sm text-orange-600">Total Value: ₹ {purchaseInvoices.reduce((a,b)=>a+b.totalAmount, 0).toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* RECONCILIATION */}
                {activeTab === 'reconciliation' && (
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <h3 className="font-bold text-gray-700">Unreconciled Bank Transactions</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Showing transactions with > 60% match confidence</span>
                        </div>
                        
                        {transactions.filter(t => !t.matchedInvoiceId && (t as any).suggestedInvoiceId).length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No high-probability suggestions found. Manual check required.</p>
                        ) : (
                            transactions.filter(t => !t.matchedInvoiceId && (t as any).suggestedInvoiceId).map(tx => {
                                const suggestionId = (tx as any).suggestedInvoiceId;
                                const invoice = tx.type === 'Credit' ? salesInvoices.find(i => i.id === suggestionId) : purchaseInvoices.find(i => i.id === suggestionId);
                                if (!invoice) return null;

                                return (
                                    <div key={tx.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="w-1/3">
                                            <p className="font-bold text-sm">{tx.date}</p>
                                            <p className="text-xs text-gray-600 truncate" title={tx.description}>{tx.description}</p>
                                            <p className={`font-mono font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>₹ {tx.amount.toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-center w-1/6 text-gray-400">
                                            <LinkIcon />
                                            <span className="text-xs font-bold ml-1 text-ease-blue">{(tx.matchScore || 0).toFixed(0)}% Match</span>
                                        </div>

                                        <div className="w-1/3 text-right">
                                            <p className="font-bold text-sm">{invoice.partyName}</p>
                                            <p className="text-xs text-gray-600">Inv: {invoice.invoiceNo} ({invoice.invoiceDate})</p>
                                            <p className="font-mono font-bold text-gray-800">₹ {invoice.totalAmount.toLocaleString()}</p>
                                        </div>

                                        <div className="ml-4">
                                            <button onClick={() => manualMatch(tx.id, invoice.id)} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-600">Accept</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* SALES / PURCHASES LISTS */}
                {(activeTab === 'sales' || activeTab === 'purchases') && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Invoice No</th>
                                    <th className="p-2">Party</th>
                                    <th className="p-2">GSTIN</th>
                                    <th className="p-2 text-right">Taxable</th>
                                    <th className="p-2 text-right">Tax</th>
                                    <th className="p-2 text-right">Total</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'sales' ? salesInvoices : purchaseInvoices).map(inv => (
                                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{inv.invoiceDate}</td>
                                        <td className="p-2">{inv.invoiceNo}</td>
                                        <td className="p-2">{inv.partyName}</td>
                                        <td className="p-2 text-xs">{inv.gstin || 'N/A'}</td>
                                        <td className="p-2 text-right">₹ {inv.taxableValue.toLocaleString()}</td>
                                        <td className="p-2 text-right">₹ {(inv.cgst + inv.sgst + inv.igst).toLocaleString()}</td>
                                        <td className="p-2 text-right font-bold">₹ {inv.totalAmount.toLocaleString()}</td>
                                        <td className="p-2">
                                            {inv.status === 'Paid' 
                                                ? <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">Paid</span>
                                                : <span className="text-yellow-600 text-xs font-bold bg-yellow-100 px-2 py-1 rounded">Unpaid</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* GSTR DRAFTS */}
                {activeTab === 'gstr' && (
                    <div className="space-y-8">
                        {/* GSTR-1 */}
                        <div className="border rounded-lg p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">GSTR-1 Summary (Sales)</h3>
                                <button onClick={() => handleDownloadReport('GSTR-1')} className="text-ease-blue text-sm hover:underline">Download JSON</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="font-bold text-gray-600">B2B Invoices</p>
                                    <p>Count: {gstr1Data.b2bCount}</p>
                                    <p>Taxable: ₹ {gstr1Data.b2bTaxable.toLocaleString()}</p>
                                    <p>Tax: ₹ {gstr1Data.b2bTax.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="font-bold text-gray-600">B2C Invoices</p>
                                    <p>Count: {gstr1Data.b2cCount}</p>
                                    <p>Taxable: ₹ {gstr1Data.b2cTaxable.toLocaleString()}</p>
                                    <p>Tax: ₹ {gstr1Data.b2cTax.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* GSTR-3B */}
                        <div className="border rounded-lg p-6">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">GSTR-3B Draft (Monthly)</h3>
                                <button onClick={() => handleDownloadReport('GSTR-3B')} className="text-ease-blue text-sm hover:underline">Download JSON</button>
                            </div>
                            <table className="w-full text-sm border">
                                <thead className="bg-gray-100 font-bold text-left">
                                    <tr><th className="p-2">Description</th><th className="p-2 text-right">Amount</th></tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b"><td className="p-2">3.1 Tax on Outward Supplies (Sales)</td><td className="p-2 text-right text-red-600">₹ {gstr3bData.outwardTax.toLocaleString()}</td></tr>
                                    <tr className="border-b"><td className="p-2">4. Eligible ITC (Purchases)</td><td className="p-2 text-right text-green-600">₹ {gstr3bData.itcAvailable.toLocaleString()}</td></tr>
                                    <tr className="bg-blue-50 font-bold"><td className="p-2">Net Tax Payable</td><td className="p-2 text-right">₹ {gstr3bData.netPayable.toLocaleString()}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TRANSACTIONS LIST (Fallback) */}
                {activeTab === 'transactions' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-bold">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="p-3">{tx.date}</td>
                                        <td className="p-3 truncate max-w-xs" title={tx.description}>{tx.description}</td>
                                        <td className={`p-3 text-right font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-gray-800'}`}>
                                            {tx.type === 'Credit' ? '+' : '-'} {tx.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[tx.category]}`}>
                                                {tx.category}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};
