import React, { useMemo, useState } from "react";

// Icons
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export type ItemRow = {
  id: string;
  description: string;
  qty: number;
  rate: number;
  gstPercent: number;
  amount: number;
};

export type Invoice = {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  customerGstin: string;
  items: ItemRow[];
  totals: {
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  fy?: string;
};

const makeId = (prefix = "") => `${prefix}${Date.now().toString().slice(-6)}`;

const defaultItem = (): ItemRow => ({
  id: makeId("it-"),
  description: "",
  qty: 1,
  rate: 0,
  gstPercent: 0,
  amount: 0,
});

const calcTotals = (items: ItemRow[]) => {
  const taxable = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  // simple split CGST/SGST
  const totalGstAmount = items.reduce((s, it) => s + ((it.qty * it.rate) * (it.gstPercent / 100)), 0);
  const cgst = Number((totalGstAmount / 2).toFixed(2));
  const sgst = Number((totalGstAmount / 2).toFixed(2));
  const total = Number((taxable + totalGstAmount).toFixed(2));
  return { taxable: Number(taxable.toFixed(2)), cgst, sgst, total };
};

const InvoiceCreator: React.FC<{
  selectedFY?: string;
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}> = ({ selectedFY = "FY 2024-25", onSave, onClose }) => {
  const [invoiceNo] = useState<string>(`CE-INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState<string>("");
  const [customerGstin, setCustomerGstin] = useState<string>("");
  const [items, setItems] = useState<ItemRow[]>([defaultItem()]);

  const updateItem = (id: string, patch: Partial<ItemRow>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch, amount: (patch.qty ?? it.qty) * (patch.rate ?? it.rate) } : it));
  };

  const addItem = () => setItems(prev => [...prev, defaultItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const totals = useMemo(() => {
    // ensure amounts are current
    const normalized = items.map(it => ({ ...it, amount: Number((it.qty * it.rate).toFixed(2)) }));
    return calcTotals(normalized);
  }, [items]);

  const handleSave = () => {
    const invoice: Invoice = {
      invoiceNo,
      invoiceDate,
      customerName,
      customerGstin,
      items: items.map(it => ({ ...it, amount: Number((it.qty * it.rate).toFixed(2)) })),
      totals,
      fy: selectedFY,
    };
    onSave(invoice);
  };

  const downloadCSV = () => {
    const header = ["Invoice No","Invoice Date","Customer","Customer GSTIN","Item Desc","Qty","Rate","GST%","Line Amount"];
    const rows: string[] = [];
    items.forEach(it => {
      rows.push([invoiceNo, invoiceDate, customerName, customerGstin, it.description, it.qty.toString(), it.rate.toString(), it.gstPercent.toString(), it.amount.toString()].map(v => `"${String(v).replace(/\"/g, "'")}"`).join(","));
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Create Invoice</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                    <input value={invoiceNo} readOnly className="input bg-gray-50 text-gray-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                    <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input" placeholder="Enter customer name" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer GSTIN</label>
                    <input value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} placeholder="Optional" className="input" />
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Rate</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">GST %</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map(it => (
                            <tr key={it.id}>
                                <td className="px-4 py-2">
                                    <input value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} className="input text-sm py-1" placeholder="Item details" />
                                </td>
                                <td className="px-4 py-2">
                                    <input type="number" value={it.qty} min={0} onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })} className="input text-sm py-1" />
                                </td>
                                <td className="px-4 py-2">
                                    <input type="number" value={it.rate} min={0} onChange={(e) => updateItem(it.id, { rate: Number(e.target.value) })} className="input text-sm py-1" />
                                </td>
                                <td className="px-4 py-2">
                                    <input type="number" value={it.gstPercent} min={0} onChange={(e) => updateItem(it.id, { gstPercent: Number(e.target.value) })} className="input text-sm py-1" />
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-gray-700">₹{(it.qty * it.rate).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => removeItem(it.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Remove Item"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <button onClick={addItem} className="text-ease-blue font-semibold text-sm flex items-center hover:underline"><PlusIcon /> <span className="ml-1">Add Item</span></button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500">FY: {selectedFY}</div>
                <div className="text-right space-y-1">
                    <div className="text-sm text-gray-600">Taxable: <span className="font-medium text-gray-800">₹{totals.taxable.toLocaleString()}</span></div>
                    <div className="text-sm text-gray-600">CGST: <span className="font-medium text-gray-800">₹{totals.cgst.toLocaleString()}</span> | SGST: <span className="font-medium text-gray-800">₹{totals.sgst.toLocaleString()}</span></div>
                    <div className="text-lg font-bold text-ease-blue mt-2 border-t border-gray-300 pt-2">Total: ₹{totals.total.toLocaleString()}</div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
            <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 bg-ease-blue text-white rounded-md font-bold hover:bg-ease-blue/90 shadow-sm">Save Draft</button>
            <button onClick={downloadCSV} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 flex items-center"><DownloadIcon /> <span className="ml-2">Download CSV</span></button>
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreator;