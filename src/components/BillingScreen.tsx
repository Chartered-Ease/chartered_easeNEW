import React, { useState } from "react";
import InvoiceCreator from "./InvoiceCreator";

type InvoiceRow = {
  id: string;
  date: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  status: "Draft" | "Sent" | "Paid";
  fy?: string;
};

const initialSample: Record<string, InvoiceRow[]> = {
  "April": [
    { id: "inv-001", date: "2025-04-05", invoiceNo: "CE-APR-001", customer: "ABC Traders", amount: 12500, status: "Paid", fy: "FY 2024-25" },
    { id: "inv-002", date: "2025-04-12", invoiceNo: "CE-APR-002", customer: "XYZ Enterprises", amount: 7200, status: "Sent", fy: "FY 2024-25" },
    { id: "inv-003", date: "2025-04-20", invoiceNo: "CE-APR-003", customer: "LMN Retail", amount: 4500, status: "Draft", fy: "FY 2024-25" }
  ],
  "May": [
    { id: "inv-011", date: "2025-05-03", invoiceNo: "CE-MAY-001", customer: "PQR Stores", amount: 9800, status: "Paid", fy: "FY 2024-25" }
  ]
};

const months = [
  "April","May","June","July","August","September","October","November","December","January","February","March"
];

const BillingScreen: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2024-25" }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("April");
  // maintain invoices per month in state so we can add new invoices
  const [invoicesByMonth, setInvoicesByMonth] = useState<Record<string, InvoiceRow[]>>(() => {
    // clone initial sample and ensure fy is set
    const clone: Record<string, InvoiceRow[]> = {};
    Object.keys(initialSample).forEach(k => clone[k] = initialSample[k].map(i => ({ ...i })));
    return clone;
  });

  const [showCreator, setShowCreator] = useState(false);

  const invoices = invoicesByMonth[selectedMonth] || [];

  const handleSaveInvoice = (invoiceObj: any) => {
    // build a row entry from InvoiceCreator's invoice object
    const row: InvoiceRow = {
      id: invoiceObj.invoiceNo || `inv-${Date.now()}`,
      date: invoiceObj.invoiceDate || new Date().toISOString().slice(0,10),
      invoiceNo: invoiceObj.invoiceNo || `CE-${Date.now()}`,
      customer: invoiceObj.customerName || "Unknown",
      amount: invoiceObj.totals?.total ?? 0,
      status: "Draft",
      fy: invoiceObj.fy || selectedFY
    };

    setInvoicesByMonth(prev => {
      const next = { ...prev };
      if (!next[selectedMonth]) next[selectedMonth] = [];
      // prepend newly created invoice
      next[selectedMonth] = [row, ...next[selectedMonth]];
      return next;
    });
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Billing</h3>
          <div className="text-sm text-gray-500 mt-1">{selectedFY}</div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Select Month</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select month"
              className="input py-2 px-3 text-sm border-gray-300 shadow-sm rounded-md bg-white"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            onClick={() => setShowCreator(true)}
            className="bg-ease-blue text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-ease-blue/90 transition-colors shadow-sm flex items-center"
          >
            <span className="mr-1 text-lg leading-none">+</span> Create Invoice
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg border-gray-200">
        <table className="min-w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Invoice No</th>
              <th className="py-3 px-4 font-semibold">Customer</th>
              <th className="py-3 px-4 font-semibold">Amount</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 italic">No invoices found for {selectedMonth}</td>
              </tr>
            ) : (
              invoices.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-700">{row.date}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{row.invoiceNo}</td>
                  <td className="py-3 px-4 text-gray-700">{row.customer}</td>
                  <td className="py-3 px-4 font-mono font-medium text-gray-800">₹{row.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      row.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button 
                        className="text-ease-blue hover:underline font-semibold text-xs" 
                        onClick={() => alert(JSON.stringify(row, null, 2))}
                    >
                        View
                    </button>
                    <button 
                        className="text-gray-500 hover:text-gray-700 font-semibold text-xs"
                        onClick={() => alert("Download placeholder")}
                    >
                        Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreator && (
        <InvoiceCreator
          selectedFY={selectedFY}
          onSave={(inv) => {
            handleSaveInvoice(inv);
            setShowCreator(false);
          }}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  );
};

export default BillingScreen;