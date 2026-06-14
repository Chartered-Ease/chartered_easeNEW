
import React, { useState } from "react";
import { useDocContext, DocItem } from "../context/DocumentContext";

const monthOptions = (() => {
  const now = new Date();
  const arr = [];
  for (let i=0; i<36; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString(undefined, { month: "short", year: "numeric" });
    arr.push({ key, label });
  }
  return arr;
})();

const BalanceSheetPanel: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2023-24" }) => {
  const { addDocs, mapUploadedDocsToLedger, transactions } = useDocContext();

  const [step, setStep] = useState<null | "bank" | "purchase" | "sales" | "expenses">(null);
  const [bankCount, setBankCount] = useState<number>(1);
  const [bankNames, setBankNames] = useState<string[]>([""]);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].key);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploading, setUploading] = useState(false);

  const openStep = (s: NonNullable<typeof step>) => { setStep(s); };

  const handleBankCount = (n: number) => {
    setBankCount(n);
    setBankNames(Array.from({length: n}, (_,i) => bankNames[i] || ""));
  };

  const updateBankName = (idx: number, v: string) => {
    setBankNames(prev => { const copy = [...prev]; copy[idx] = v; return copy; });
  };

  const onFilesUploadAndMap = async (files: FileList | null, assignedType: "Purchase"|"Sales"|"Expenses"|"Bank") => {
    if (!files || files.length === 0) return;
    setUploading(true);
    // create DocItem metadata and add to context
    /* Fix: Explicitly type arr as DocItem[] and cast assignedType to the expected literal union */
    const arr: DocItem[] = Array.from(files).map(f => ({
      id: `doc-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2,6)}`,
      name: f.name,
      sizeKb: Math.round(f.size/1024),
      mimeType: f.type || "application/octet-stream",
      assignedType: (assignedType === "Bank" ? "Others" : (assignedType === "Sales" ? "Sales" : assignedType === "Purchase" ? "Purchase" : "Expenses")) as DocItem["assignedType"],
      fy: selectedFY,
      uploadedAt: (assignedType === "Bank") ? new Date().toISOString() : (new Date(selectedMonth + "-01T12:00:00").toISOString()),
      ocrStatus: "Pending" as const,
      extracted: undefined
    }));
    addDocs(arr);
    // map uploaded docs to ledger entries / transactions
    for (const doc of arr) {
      await mapUploadedDocsToLedger(doc, { bankNames: assignedType === "Bank" ? bankNames : undefined, selectedMonth });
    }
    setUploading(false);
    alert(`${arr.length} file(s) uploaded and mapped to ledger.`);
    setStep(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Balance Sheet (Schedule III) — Overview</h3>
        <p style={{ color: "#6b7280" }}>Assets and Liabilities view. Upload supporting documents and they will be mapped to ledgers and flow into the Balance Sheet and P&L automatically.</p>

        <div style={{ marginTop: 12 }}>
          {/* Placeholder for rendered balance sheet summary from transactions */}
          <div style={{ borderRadius: 8, background: "#fff", padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
            <strong>Assets</strong>
            <div style={{ marginTop: 8, color: "#6b7280" }}>Bank balances, Fixed assets, Inventories — values computed from ledger (see right).</div>
            <div style={{ marginTop: 12 }}>
              <strong>Liabilities & Equity</strong>
              <div style={{ marginTop: 8, color: "#6b7280" }}>Loans, capital, retained earnings — aggregated from ledger.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Recent Transactions (preview)</h4>
          <div style={{ background: "#fff", borderRadius: 8, padding: 12 }}>
            {transactions.slice(0,8).map(tx => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{tx.description || tx.type}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{new Date(tx.date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>{tx.amount ? `₹${tx.amount.toLocaleString()}` : "-"}</div>
              </div>
            ))}
            {transactions.length === 0 && <div style={{ color: "#6b7280" }}>No transactions yet. Upload documents using the right panel.</div>}
          </div>
        </div>
      </div>

      <aside style={{ background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
        <h4 style={{ marginTop: 0 }}>Supporting Documents</h4>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>Upload documents that feed ledger automatically.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => openStep("bank")} style={{ padding: 10, borderRadius: 8, textAlign: "left", background: step === 'bank' ? '#f0f9ff' : 'transparent', border: '1px solid #e5e7eb' }}>1. Bank Statement</button>
          <button onClick={() => openStep("purchase")} style={{ padding: 10, borderRadius: 8, textAlign: "left", background: step === 'purchase' ? '#f0f9ff' : 'transparent', border: '1px solid #e5e7eb' }}>2. Purchase Register</button>
          <button onClick={() => openStep("sales")} style={{ padding: 10, borderRadius: 8, textAlign: "left", background: step === 'sales' ? '#f0f9ff' : 'transparent', border: '1px solid #e5e7eb' }}>3. Sales Register</button>
          <button onClick={() => openStep("expenses")} style={{ padding: 10, borderRadius: 8, textAlign: "left", background: step === 'expenses' ? '#f0f9ff' : 'transparent', border: '1px solid #e5e7eb' }}>4. Expenses Register</button>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
          {step === "bank" && (
            <div>
              <h5 style={{ marginTop: 0 }}>Bank Statement — Accounts</h5>
              <div style={{ marginBottom: 8, fontSize: 14 }}>No. of bank accounts:</div>
              <input type="number" min={1} value={bankCount} onChange={(e) => handleBankCount(Math.max(1, Number(e.target.value || 1)))} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6eef8" }} />
              <div style={{ marginTop: 8 }}>
                {Array.from({ length: bankCount }).map((_, i) => (
                  <input key={i} placeholder={`Bank ${i+1} name`} value={bankNames[i] || ""} onChange={(e) => updateBankName(i, e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6eef8", marginTop: 8 }} />
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <input type="file" multiple onChange={(e) => onFilesUploadAndMap(e.target.files, "Bank")} />
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>Upload bank statements for each account. They will be mapped to bank ledgers and closing balance computed.</div>
              </div>
            </div>
          )}

          {step === "purchase" && (
            <div>
              <h5 style={{ marginTop: 0 }}>Purchase Register — Month</h5>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6eef8" }}>
                {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <div style={{ marginTop: 8 }}>
                <input type="file" multiple onChange={(e) => onFilesUploadAndMap(e.target.files, "Purchase")} />
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>Upload purchase bills (tagged to selected month). These will create purchase ledger entries.</div>
              </div>
            </div>
          )}

          {step === "sales" && (
            <div>
              <h5 style={{ marginTop: 0 }}>Sales Register — Month</h5>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6eef8" }}>
                {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <div style={{ marginTop: 8 }}>
                <input type="file" multiple onChange={(e) => onFilesUploadAndMap(e.target.files, "Sales")} />
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>Upload sales invoices (tagged to selected month). These will create revenue ledger entries.</div>
              </div>
            </div>
          )}

          {step === "expenses" && (
            <div>
              <h5 style={{ marginTop: 0 }}>Expenses Register — Month</h5>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6eef8" }}>
                {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <div style={{ marginTop: 8 }}>
                <input type="file" multiple onChange={(e) => onFilesUploadAndMap(e.target.files, "Expenses")} />
                <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>Upload expense bills (tagged to selected month). These will create expense ledger entries.</div>
              </div>
            </div>
          )}

          {!step && <div style={{ color: "#6b7280", fontSize: 13 }}>Click a document type to begin uploading and mapping to financial ledgers.</div>}
        </div>
      </aside>
    </div>
  );
};

export default BalanceSheetPanel;
