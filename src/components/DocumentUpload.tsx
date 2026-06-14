import React, { useCallback, useState } from "react";

type DocItem = {
  id: string;
  name: string;
  sizeKb: number;
  mimeType: string;
  assignedType: "Sales" | "Purchase" | "Expense" | "Bank" | "Other";
  fy: string;
  uploadedAt: string;
  ocrStatus: "Pending" | "Processing" | "Processed";
  extractedText?: string;
};

const makeId = (prefix = "") => `${prefix}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

const DocumentUpload: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2024-25" }) => {
  const [docs, setDocs] = useState<DocItem[]>([]);

  const onFilesSelected = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map(f => ({
      id: makeId("doc-"),
      name: f.name,
      sizeKb: Math.round(f.size / 1024),
      mimeType: f.type || "application/octet-stream",
      assignedType: "Other" as DocItem["assignedType"],
      fy: selectedFY,
      uploadedAt: new Date().toISOString(),
      ocrStatus: "Pending" as DocItem["ocrStatus"],
    }));
    setDocs(prev => [...arr, ...prev]);
  }, [selectedFY]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFilesSelected(e.dataTransfer.files);
  };

  const runOcr = async (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ocrStatus: "Processing" } : d));
    // mock OCR delay
    await new Promise(res => setTimeout(res, 1000));
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ocrStatus: "Processed", extractedText: `Sample extracted text for ${d.name}\nInvoice Date: 2024-04-01\nTotal: 12500` } : d));
  };

  const removeDoc = (id: string) => setDocs(prev => prev.filter(d => d.id !== id));

  const downloadMock = (d: DocItem) => {
    const blob = new Blob([d.extractedText || `Original file: ${d.name}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const total = docs.length;
  const processed = docs.filter(d => d.ocrStatus === "Processed").length;
  const pending = docs.filter(d => d.ocrStatus === "Pending" || d.ocrStatus === "Processing").length;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Document Upload</h3>
          <div className="text-sm text-gray-500 mt-1">Target FY: {selectedFY}</div>
        </div>

        <div className="flex gap-4 text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <div className="text-gray-600">Total: <span className="font-bold text-gray-900">{total}</span></div>
          <div className="text-green-600">Processed: <span className="font-bold">{processed}</span></div>
          <div className="text-orange-600">Pending: <span className="font-bold">{pending}</span></div>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors bg-white"
      >
        <p className="text-gray-600 mb-2">Drag & drop files here, or</p>
        <label className="cursor-pointer">
          <span className="bg-ease-blue text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-ease-blue/90 transition-colors inline-block">
            Select Files
          </span>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            accept=".pdf,.zip,.jpg,.jpeg,.png,.csv"
            onChange={(e) => onFilesSelected(e.target.files)} 
          />
        </label>
        <div className="text-xs text-gray-400 mt-3">Accepted formats: .pdf, .zip, .jpg, .jpeg, .png, .csv</div>
      </div>

      <div className="mt-8 overflow-x-auto border rounded-lg border-gray-200 bg-white">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
            <tr>
              <th className="p-3">Filename</th>
              <th className="p-3">Size (KB)</th>
              <th className="p-3">Type</th>
              <th className="p-3">FY</th>
              <th className="p-3">Uploaded At</th>
              <th className="p-3">OCR Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docs.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic">No files uploaded yet.</td></tr>
            ) : docs.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium text-gray-800 max-w-xs truncate" title={d.name}>{d.name}</td>
                <td className="p-3 text-gray-600">{d.sizeKb}</td>
                <td className="p-3">
                  <select 
                    value={d.assignedType} 
                    onChange={(e) => setDocs(prev => prev.map(x => x.id === d.id ? { ...x, assignedType: e.target.value as any } : x))}
                    className="input py-1 px-2 text-sm border-gray-300 rounded bg-white w-28"
                  >
                    <option>Sales</option>
                    <option>Purchase</option>
                    <option>Expense</option>
                    <option>Bank</option>
                    <option>Other</option>
                  </select>
                </td>
                <td className="p-3">
                  <input 
                    value={d.fy} 
                    onChange={(e) => setDocs(prev => prev.map(x => x.id === d.id ? { ...x, fy: e.target.value } : x))} 
                    className="input py-1 px-2 text-sm border-gray-300 rounded w-24"
                  />
                </td>
                <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(d.uploadedAt).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    d.ocrStatus === 'Processed' ? 'bg-green-100 text-green-800' :
                    d.ocrStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {d.ocrStatus}
                  </span>
                </td>
                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                  {d.ocrStatus === 'Pending' && (
                    <button onClick={() => runOcr(d.id)} className="text-ease-blue hover:underline font-medium text-xs">Run OCR</button>
                  )}
                  {d.ocrStatus === 'Processed' && (
                    <button onClick={() => downloadMock(d)} className="text-gray-600 hover:text-gray-900 font-medium text-xs">Download</button>
                  )}
                  <button onClick={() => removeDoc(d.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentUpload;