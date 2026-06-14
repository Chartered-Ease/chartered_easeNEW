import React, { useMemo, useState } from "react";

type MonthKey =
  | "April" | "May" | "June" | "July" | "August" | "September"
  | "October" | "November" | "December" | "January" | "February" | "March";

const months: MonthKey[] = ["April","May","June","July","August","September","October","November","December","January","February","March"];

// Mock monthly dataset (numbers in INR)
const mockFYData: Record<string, { revenue: Record<MonthKey, number>, cogs: Record<MonthKey, number>, expenses: Record<MonthKey, number> }> = {
  "FY 2024-25": {
    revenue: { April:120000, May:150000, June:130000, July:140000, August:125000, September:135000, October:150000, November:160000, December:170000, January:155000, February:145000, March:180000},
    cogs:    { April:60000,  May:70000,  June:65000,  July:68000,  August:60000,  September:64000,  October:72000,  November:76000,  December:80000,  January:74000,  February:70000,  March:90000},
    expenses:{ April:20000,  May:22000,  June:21000,  July:23000,  August:19500,  September:20500,  October:21500,  November:22500,  December:24000,  January:23000,  February:22000,  March:26000}
  },
  "FY 2023-24": {
    revenue: { April:90000, May:110000, June:100000, July:105000, August:95000, September:98000, October:102000, November:110000, December:115000, January:108000, February:98000, March:125000},
    cogs:    { April:45000, May:55000, June:52000, July:54000, August:48000, September:50000, October:53000, November:56000, December:58000, January:54000, February:50000, March:65000},
    expenses:{ April:15000, May:16000, June:15500, July:16500, August:14800, September:15200, October:15800, November:16200, December:17500, January:16800, February:16000, March:18500}
  }
};

const formatINR = (v: number) => `₹${v.toLocaleString()}`;

const ProfitAndLoss: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2024-25" }) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<MonthKey | null>(null);

  // Fallback if selectedFY doesn't exist in mock data
  const data = mockFYData[selectedFY] || mockFYData["FY 2024-25"];

  const totals = useMemo(() => {
    const revenue = months.reduce((s, m) => s + (data.revenue[m] || 0), 0);
    const cogs = months.reduce((s, m) => s + (data.cogs[m] || 0), 0);
    const expenses = months.reduce((s, m) => s + (data.expenses[m] || 0), 0);
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - expenses;
    const netProfit = ebitda; // Simplified: ignoring tax/depreciation for mock
    return { revenue, cogs, expenses, grossProfit, ebitda, netProfit };
  }, [data]);

  const cardList = [
    { key: "Revenue", value: totals.revenue },
    { key: "COGS", value: totals.cogs },
    { key: "Gross Profit", value: totals.grossProfit },
    { key: "Expenses", value: totals.expenses },
    { key: "EBITDA", value: totals.ebitda },
    { key: "Net Profit", value: totals.netProfit }
  ];

  const monthRowsFor = (cardKey: string) => {
    return months.map(m => {
      let val = 0;
      if (cardKey === "Revenue") val = data.revenue[m];
      else if (cardKey === "COGS") val = data.cogs[m];
      else if (cardKey === "Gross Profit") val = (data.revenue[m] || 0) - (data.cogs[m] || 0);
      else if (cardKey === "Expenses") val = data.expenses[m];
      else if (cardKey === "EBITDA") val = ((data.revenue[m] || 0) - (data.cogs[m] || 0)) - (data.expenses[m] || 0);
      else if (cardKey === "Net Profit") val = ((data.revenue[m] || 0) - (data.cogs[m] || 0)) - (data.expenses[m] || 0);
      return { month: m, value: val };
    });
  };

  return (
    <div className="p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardList.map(card => (
          <div
            key={card.key}
            onClick={() => { setActiveCard(card.key === activeCard ? null : card.key); setActiveMonth(null); }}
            className={`p-4 rounded-lg cursor-pointer transition-all shadow-sm border ${
                activeCard === card.key 
                ? 'bg-ease-blue text-white border-ease-blue ring-2 ring-offset-2 ring-ease-blue' 
                : 'bg-white text-gray-800 border-gray-200 hover:shadow-md'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${activeCard === card.key ? 'text-blue-100' : 'text-gray-500'}`}>{card.key}</div>
            <div className="text-lg font-bold truncate">{formatINR(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Detail Section */}
      <div className="mt-6 animate-fade-in">
        {activeCard ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h4 className="font-bold text-gray-800">{activeCard} Breakdown <span className="text-gray-500 font-normal text-sm">({selectedFY})</span></h4>
                <button onClick={() => setActiveCard(null)} className="text-gray-400 hover:text-gray-600 font-bold px-2">&times;</button>
            </div>
            
            <div className="grid md:grid-cols-3">
                {/* Month List */}
                <div className="col-span-2 border-r border-gray-200 max-h-96 overflow-y-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold">Month</th>
                                <th className="p-3 font-semibold text-right">Amount</th>
                                <th className="p-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthRowsFor(activeCard).map(row => (
                                <tr key={row.month} className={`hover:bg-gray-50 transition-colors ${activeMonth === row.month ? 'bg-blue-50' : ''}`}>
                                    <td className="p-3 font-medium text-gray-700">{row.month}</td>
                                    <td className="p-3 text-right font-mono text-gray-800">{formatINR(row.value)}</td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => setActiveMonth(row.month as MonthKey)}
                                            className="text-xs text-ease-blue font-semibold hover:underline"
                                        >
                                            View Txns
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Transaction Drilldown */}
                <div className="col-span-1 bg-gray-50 p-4 overflow-y-auto max-h-96">
                    {activeMonth ? (
                        <div className="animate-fade-in">
                            <h5 className="font-bold text-gray-800 mb-3 text-sm border-b pb-2 border-gray-200">{activeCard} Details: {activeMonth}</h5>
                            <ul className="space-y-3">
                                {Array.from({length: 3}).map((_, i) => (
                                    <li key={i} className="bg-white p-3 rounded border border-gray-200 shadow-sm text-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-gray-700">
                                                {activeCard === 'Expenses' ? 'Vendor Pmt' : 'Invoice'} #{1000+i}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {activeMonth.slice(0,3)} {10+i}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {activeCard === 'Revenue' ? 'Sales to Client ABC' : 
                                             activeCard === 'COGS' ? 'Material Purchase' : 
                                             activeCard === 'Expenses' ? 'Office Rent / Utilities' : 'General Transaction'}
                                        </p>
                                        <div className="mt-2 text-right font-mono font-bold text-gray-800">
                                            {formatINR(Math.round(Math.random() * 20000) + 1000)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            <p className="text-sm">Select a month to view mock transaction details.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Click on any summary card above to drill down into the financial data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitAndLoss;