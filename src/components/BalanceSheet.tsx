import React, { useState, useMemo } from 'react';

type LineItemDetail = {
  id: string;
  desc: string;
  amount: number;
};

type LineItem = {
  key: string;
  value: number;
  details?: LineItemDetail[];
};

type BalanceSheetData = {
  assets: LineItem[];
  liabilities: LineItem[];
  equity: LineItem[];
};

const mockBSData: Record<string, BalanceSheetData> = {
  "FY 2024-25": {
    assets: [
      { key: "Cash & Bank", value: 320000, details: [{ id: "b-1", desc: "Bank A - Current", amount: 150000 }, { id: "b-2", desc: "Bank B - Savings", amount: 170000 }] },
      { key: "Debtors (Receivables)", value: 95000, details: [{ id: "d-1", desc: "Inv CE-APR-001", amount: 35000 }, { id: "d-2", desc: "Inv CE-MAY-001", amount: 60000 }] },
      { key: "Inventory", value: 45000, details: [{ id: "inv-01", desc: "Stock - Raw", amount: 25000 }, { id: "inv-02", desc: "Finished Goods", amount: 20000 }] },
      { key: "Fixed Assets (net)", value: 180000, details: [{ id: "f-1", desc: "Computer Equip", amount: 80000 }, { id: "f-2", desc: "Furniture", amount: 100000 }] }
    ],
    liabilities: [
      { key: "Creditors", value: 60000, details: [{ id: "c-1", desc: "Vendor X", amount: 40000 }, { id: "c-2", desc: "Vendor Y", amount: 20000 }] },
      { key: "Loans", value: 140000, details: [{ id: "L-1", desc: "Term Loan", amount: 140000 }] },
      { key: "Outstanding Expenses", value: 12000, details: [{ id: "oe-1", desc: "Utilities", amount: 5000 }, { id: "oe-2", desc: "TDS Payable", amount: 7000 }] },
      { key: "Taxes Payable", value: 8000, details: [{ id: "tx-1", desc: "GST Payable", amount: 5000 }, { id: "tx-2", desc: "Income Tax", amount: 3000 }] }
    ],
    equity: [
      { key: "Capital", value: 200000, details: [{ id: "cap-1", desc: "Owner Capital", amount: 200000 }] },
      { key: "Retained Earnings", value: 115000, details: [{ id: "re-1", desc: "Retained", amount: 115000 }] }
    ]
  },
  "FY 2023-24": {
    assets: [
      { key: "Cash & Bank", value: 220000, details: [{ id: "b-1", desc: "Bank A - Current", amount: 120000 }, { id: "b-2", desc: "Bank B - Savings", amount: 100000 }] },
      { key: "Debtors (Receivables)", value: 65000, details: [{ id: "d-1", desc: "Inv X", amount: 65000 }] },
      { key: "Inventory", value: 35000, details: [{ id: "inv-01", desc: "Stock - Raw", amount: 35000 }] },
      { key: "Fixed Assets (net)", value: 150000, details: [{ id: "f-1", desc: "Equip", amount: 150000 }] }
    ],
    liabilities: [
      { key: "Creditors", value: 45000, details: [{ id: "c-1", desc: "Vendor A", amount: 25000 }, { id: "c-2", desc: "Vendor B", amount: 20000 }] },
      { key: "Loans", value: 90000, details: [{ id: "L-1", desc: "Term Loan", amount: 90000 }] },
      { key: "Outstanding Expenses", value: 8000, details: [{ id: "oe-1", desc: "Utilities", amount: 3000 }, { id: "oe-2", desc: "TDS Payable", amount: 5000 }] },
      { key: "Taxes Payable", value: 6000, details: [{ id: "tx-1", desc: "GST Payable", amount: 6000 }] }
    ],
    equity: [
      { key: "Capital", value: 150000, details: [{ id: "cap-1", desc: "Owner Capital", amount: 150000 }] },
      { key: "Retained Earnings", value: 86000, details: [{ id: "re-1", desc: "Retained", amount: 86000 }] }
    ]
  }
};

const formatINR = (v: number) => `₹${v.toLocaleString()}`;

const BalanceSheet: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2024-25" }) => {
  const [selectedLine, setSelectedLine] = useState<LineItem | null>(null);
  
  const data = mockBSData[selectedFY] || mockBSData["FY 2024-25"];

  const totals = useMemo(() => ({
    assets: data.assets.reduce((acc, item) => acc + item.value, 0),
    liabilities: data.liabilities.reduce((acc, item) => acc + item.value, 0),
    equity: data.equity.reduce((acc, item) => acc + item.value, 0),
  }), [data]);

  return (
    <div className="p-4">
      {/* High Level Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="text-gray-500 text-sm font-semibold uppercase">Total Assets</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatINR(totals.assets)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <div className="text-gray-500 text-sm font-semibold uppercase">Total Liabilities</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatINR(totals.liabilities)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <div className="text-gray-500 text-sm font-semibold uppercase">Total Equity</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatINR(totals.equity)}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main BS View */}
        <div className="flex-1 space-y-6">
            {/* Assets */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b border-gray-200">Assets</div>
                <ul className="divide-y divide-gray-100">
                    {data.assets.map(item => (
                        <li 
                            key={item.key} 
                            onClick={() => setSelectedLine(item)}
                            className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors ${selectedLine?.key === item.key ? 'bg-blue-50' : ''}`}
                        >
                            <span className="text-gray-700 font-medium">{item.key}</span>
                            <span className="font-mono text-gray-800 font-bold">{formatINR(item.value)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liabilities */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b border-gray-200">Liabilities</div>
                    <ul className="divide-y divide-gray-100">
                        {data.liabilities.map(item => (
                            <li 
                                key={item.key} 
                                onClick={() => setSelectedLine(item)}
                                className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors ${selectedLine?.key === item.key ? 'bg-blue-50' : ''}`}
                            >
                                <span className="text-gray-700 font-medium">{item.key}</span>
                                <span className="font-mono text-gray-800 font-bold">{formatINR(item.value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Equity */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b border-gray-200">Equity</div>
                    <ul className="divide-y divide-gray-100">
                        {data.equity.map(item => (
                            <li 
                                key={item.key} 
                                onClick={() => setSelectedLine(item)}
                                className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors ${selectedLine?.key === item.key ? 'bg-blue-50' : ''}`}
                            >
                                <span className="text-gray-700 font-medium">{item.key}</span>
                                <span className="font-mono text-gray-800 font-bold">{formatINR(item.value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

        {/* Drilldown Panel */}
        <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full max-h-[600px] overflow-hidden flex flex-col sticky top-4">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800">
                    {selectedLine ? `${selectedLine.key} Details` : 'Item Details'}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedLine ? (
                        <>
                            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Total Amount</span>
                                <span className="text-xl font-bold text-ease-blue">{formatINR(selectedLine.value)}</span>
                            </div>
                            
                            {selectedLine.details && selectedLine.details.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-gray-500 text-xs text-left">
                                        <tr>
                                            <th className="pb-2">Description</th>
                                            <th className="pb-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedLine.details.map((detail) => (
                                            <tr key={detail.id}>
                                                <td className="py-2">
                                                    <div className="font-medium text-gray-700">{detail.desc}</div>
                                                    <div className="text-xs text-gray-400">ID: {detail.id}</div>
                                                </td>
                                                <td className="py-2 text-right font-mono text-gray-600">{formatINR(detail.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500 text-sm text-center py-4">No detailed breakdown available.</p>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-center">
                            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm">Select any line item from the left to view its detailed breakdown.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;