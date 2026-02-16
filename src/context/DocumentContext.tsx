
import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * DocumentContext (updated)
 * - docs: DocItem[]
 * - transactions: Transaction[]  (used for P&L / Balance Sheet summaries)
 * - ledgers: LedgerEntry[]  (hidden ledgers aggregated)
 * - addDocs, updateDoc, removeDoc, runOcrOnDoc (existing)
 * - mapUploadedDocsToLedger(doc, meta) -> creates ledger entries and transactions
 */

export type DocItem = {
  id: string;
  name: string;
  sizeKb: number;
  mimeType: string;
  assignedType: "Purchase" | "Sales" | "Expenses" | "Fixed Assets" | "Others";
  fy: string;
  uploadedAt: string;
  ocrStatus: "Pending" | "Processing" | "Processed";
  extracted?: {
    vendor?: string;
    date?: string; // ISO
    amount?: number;
    invoiceNo?: string;
    rawText?: string;
  };
};

export type Transaction = {
  id: string;
  date: string; // ISO
  amount: number;
  type: "purchase" | "sale" | "expense" | "fixed_asset" | "bank" | "other";
  description?: string;
  sourceDocId?: string;
};

export type LedgerEntry = {
  id: string;
  ledgerName: string; // e.g., "Purchases", "Sales", "Bank - HDFC"
  date: string;
  debit?: number;
  credit?: number;
  sourceDocId?: string;
};

type DocContextShape = {
  docs: DocItem[];
  transactions: Transaction[];
  ledgers: LedgerEntry[];
  addDocs: (files: DocItem[]) => void;
  updateDoc: (id: string, patch: Partial<DocItem>) => void;
  removeDoc: (id: string) => void;
  runOcrOnDoc: (id: string) => Promise<void>;
  addTransaction: (tx: Transaction) => void;
  mapUploadedDocsToLedger: (doc: DocItem, meta?: any) => Promise<void>;
};

const DocContext = createContext<DocContextShape | null>(null);

export const useDocContext = () => {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error("useDocContext must be used within DocumentProvider");
  return ctx;
};

const makeId = (p = "") => `${p}${Date.now().toString().slice(-6)}`;

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);

  const addDocs = (files: DocItem[]) => setDocs(prev => [...files, ...prev]);

  const updateDoc = (id: string, patch: Partial<DocItem>) => setDocs(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    setTransactions(prev => prev.filter(t => t.sourceDocId !== id));
    setLedgers(prev => prev.filter(l => l.sourceDocId !== id));
  };

  const addTransaction = (tx: Transaction) => setTransactions(prev => [tx, ...prev]);

  // Simple mock OCR parser heuristics (for demo)
  const parseMockFromName = (name: string) => {
    const amountMatch = name.match(/(\d{3,7})(?:\.\d{1,2})?(\b|$)/);
    const amount = amountMatch ? Number(amountMatch[1]) : undefined;
    const dateMatch = name.match(/(20\d{2}[-_]?\d{2}[-_]?\d{2})|(20\d{2})|(\d{2}[-/]?\d{2}[-/]?20\d{2})/);
    const date = dateMatch ? new Date(dateMatch[0].replace(/[_]/g,'-')).toISOString().slice(0,10) : undefined;
    return { amount, date, vendor: undefined };
  };

  const runOcrOnDoc = async (id: string) => {
    const d = docs.find(x => x.id === id);
    if (!d) return;
    updateDoc(id, { ocrStatus: "Processing" });
    await new Promise(r => setTimeout(r, 900));
    const heur = parseMockFromName(d.name);
    const extracted = {
      vendor: heur.vendor || d.name.split(/[_-]/)[0],
      date: heur.date || new Date().toISOString().slice(0,10),
      amount: heur.amount ?? 0,
      invoiceNo: undefined,
      rawText: `Simulated OCR for ${d.name}`
    };
    updateDoc(id, { ocrStatus: "Processed", extracted });

    const mapType = (assigned: DocItem["assignedType"]) => {
      if (assigned === "Purchase") return "purchase";
      if (assigned === "Sales") return "sale";
      if (assigned === "Expenses") return "expense";
      if (assigned === "Fixed Assets") return "fixed_asset";
      return "other";
    };

    const tx: Transaction = {
      id: makeId("tx-"),
      date: extracted.date || new Date().toISOString().slice(0,10),
      amount: Number(extracted.amount || 0),
      type: mapType(d.assignedType) as Transaction["type"],
      description: `${extracted.vendor || ""} — OCR`,
      sourceDocId: d.id
    };

    addTransaction(tx);

    // create a ledger entry too
    const ledgerName = d.assignedType === "Purchase" ? "Purchases" : d.assignedType === "Sales" ? "Sales" : d.assignedType === "Expenses" ? "Expenses" : "Other";
    const ledgerEntry: LedgerEntry = {
      id: makeId("leg-"),
      ledgerName,
      date: tx.date,
      debit: tx.type === "purchase" || tx.type === "expense" ? tx.amount : undefined,
      credit: tx.type === "sale" ? tx.amount : undefined,
      sourceDocId: d.id
    };
    setLedgers(prev => [ledgerEntry, ...prev]);
  };

  const mapUploadedDocsToLedger = async (doc: DocItem, meta?: any) => {
    // store doc if not present
    setDocs(prev => [doc, ...prev]);

    // Attempt to create a simple ledger entry immediately
    // heuristic: if doc.extracted exists, use its amount else 0
    const amount = doc.extracted?.amount ?? 0;
    const date = doc.uploadedAt || new Date().toISOString();
    const ledgerName = doc.assignedType === "Purchase" ? "Purchases" : doc.assignedType === "Sales" ? "Sales" : doc.assignedType === "Expenses" ? "Expenses" : (doc.assignedType === "Fixed Assets" ? "Fixed Assets" : "Bank");

    // Create a ledger entry
    const ledgerEntry = {
      id: makeId("leg-"),
      ledgerName,
      date,
      debit: doc.assignedType === "Purchase" || doc.assignedType === "Expenses" ? amount || undefined : undefined,
      credit: doc.assignedType === "Sales" ? amount || undefined : undefined,
      sourceDocId: doc.id
    };
    setLedgers(prev => [ledgerEntry, ...prev]);

    // Also create a matching transaction
    const tx = {
      id: makeId("tx-"),
      date,
      amount: amount || 0,
      /* Fix: Cast ternary string result to valid Transaction type union */
      type: (doc.assignedType === "Purchase" ? "purchase" : doc.assignedType === "Sales" ? "sale" : doc.assignedType === "Expenses" ? "expense" : doc.assignedType === "Fixed Assets" ? "fixed_asset" : "other") as Transaction["type"],
      description: `${doc.name} (auto-mapped)`,
      sourceDocId: doc.id
    };
    setTransactions(prev => [tx, ...prev]);

    // If meta includes bankNames and the doc is bank, map to each bank ledger as needed (simple approach: add entries for first bank)
    if (meta?.bankNames && meta.bankNames.length > 0) {
      const bankLedger: LedgerEntry = {
        id: makeId("leg-"),
        ledgerName: `Bank - ${meta.bankNames[0]}`,
        date,
        debit: undefined,
        credit: amount || undefined,
        sourceDocId: doc.id
      };
      setLedgers(prev => [bankLedger, ...prev]);
    }
  };

  const value = useMemo(() => ({
    docs, transactions, ledgers, addDocs, updateDoc, removeDoc, runOcrOnDoc, addTransaction, mapUploadedDocsToLedger
  }), [docs, transactions, ledgers]);

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>;
};
