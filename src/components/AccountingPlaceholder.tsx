import React, { useState } from "react";
import BalanceSheetPanel from "./BalanceSheetPanel";
import ProfitAndLoss from "./ProfitAndLoss";
import DocumentVault from "./DocumentVault";

interface AccountingPlaceholderProps {
  selectedFY?: string;
}

const AccountingPlaceholder: React.FC<AccountingPlaceholderProps> = ({ selectedFY = "FY 2024-25" }) => {
  const [selectedTab, setSelectedTab] = useState<"BalanceSheet" | "P&L" | "Documents">("BalanceSheet");

  return (
    <section className="bg-white shadow-md rounded-lg border border-gray-100" style={{ padding: 20, marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>Accounting & Financials</h3>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md">
            {selectedFY}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 16 }}>
        <button 
            onClick={() => setSelectedTab("BalanceSheet")} 
            style={{ 
                padding: "8px 16px", 
                borderRadius: 6, 
                background: selectedTab === "BalanceSheet" ? "#e0f2fe" : "transparent", 
                color: selectedTab === "BalanceSheet" ? "#0369a1" : "#6b7280", 
                border: "none", 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: "0.875rem" 
            }}
        >
          Balance Sheet
        </button>

        <button 
            onClick={() => setSelectedTab("P&L")} 
            style={{ 
                padding: "8px 16px", 
                borderRadius: 6, 
                background: selectedTab === "P&L" ? "#e0f2fe" : "transparent", 
                color: selectedTab === "P&L" ? "#0369a1" : "#6b7280", 
                border: "none", 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: "0.875rem" 
            }}
        >
          Profit & Loss
        </button>

        <button 
            onClick={() => setSelectedTab("Documents")} 
            style={{ 
                padding: "8px 16px", 
                borderRadius: 6, 
                background: selectedTab === "Documents" ? "#e0f2fe" : "transparent", 
                color: selectedTab === "Documents" ? "#0369a1" : "#6b7280", 
                border: "none", 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: "0.875rem" 
            }}
        >
          Documents
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {selectedTab === "BalanceSheet" && <BalanceSheetPanel selectedFY={selectedFY} />}
        {selectedTab === "P&L" && <ProfitAndLoss selectedFY={selectedFY} />}
        {selectedTab === "Documents" && <DocumentVault selectedFY={selectedFY} />}
      </div>
    </section>
  );
};

export default AccountingPlaceholder;