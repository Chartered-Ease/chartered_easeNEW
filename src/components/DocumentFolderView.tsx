// components/DocumentFolderView.tsx
import React, { useMemo, useState } from "react";
import { useDocContext, DocItem } from "../context/DocumentContext";

/**
 * DocumentFolderView — connected and with improved uploader modal
 *
 * - Uses global DocumentContext
 * - Upload modal: drag/drop, preview list, per-file date/type, bulk-set, simulated progress
 * - After Confirm, calls addDocs() to add files to global store
 */

type LocalPick = {
  file: File;
  id: string;
  name: string;
  sizeKb: number;
  assignedType: DocItem["assignedType"];
  date: string; // yyyy-mm-dd
  progress?: number;
  error?: string | null;
};

const monthsOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const makeId = (p = "") => `${p}${Date.now().toString().slice(-6)}`;

const formatMonth = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${monthsOrder[d.getMonth()]} ${d.getFullYear()}`;
};

const groupByMonthAndDate = (items: DocItem[]) => {
  const months: Record<string, Record<string, DocItem[]>> = {};
  items.forEach(it => {
    const uploaded = it.uploadedAt || new Date().toISOString();
    const monthKey = formatMonth(uploaded);
    const dateKey = new Date(uploaded).toISOString().slice(0,10);
    months[monthKey] = months[monthKey] || {};
    months[monthKey][dateKey] = months[monthKey][dateKey] || [];
    months[monthKey][dateKey].push(it);
  });
  return months;
};

const humanSize = (kb: number) => `${kb.toLocaleString()} KB`;

const allowedExt = [".pdf", ".zip", ".jpg", ".jpeg", ".png", ".csv"];

const DocumentFolderView: React.FC<{ folderName: string; onClose: () => void; selectedFY?: string }> = ({ folderName, onClose, selectedFY = "FY 2024-25" }) => {
  const ctx = useDocContext();
  const { docs, addDocs, updateDoc, removeDoc, runOcrOnDoc } = ctx;

  const folderToAssignedType = (f: string): DocItem["assignedType"] => {
    if (f === "Purchase") return "Purchase";
    if (f === "Sales") return "Sales";
    if (f === "Expenses") return "Expenses";
    if (f === "Fixed Assets") return "Fixed Assets";
    return "Others";
  };
  const assignedTypeForFolder = folderToAssignedType(folderName);

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [groupBy, setGroupBy] = useState<"month" | "date">("month");
  const [filterType, setFilterType] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // Uploader modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [picked, setPicked] = useState<LocalPick[]>([]);
  const [bulkType, setBulkType] = useState<DocItem["assignedType"] | "">("");
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [uploading, setUploading] = useState(false);

  // docs for this folder
  const docsForFolder = useMemo(() => docs.filter(d => d.assignedType === assignedTypeForFolder), [docs, assignedTypeForFolder]);

  const visibleDocs = useMemo(() => {
    let visible = docsForFolder;
    if (filterType !== "All") visible = visible.filter(f => f.assignedType === filterType);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      visible = visible.filter(f => (f.name || "").toLowerCase().includes(s) || (f.extracted?.vendor || "").toLowerCase().includes(s));
    }
    return visible;
  }, [docsForFolder, filterType, search]);

  const grouped = useMemo(() => groupByMonthAndDate(visibleDocs), [visibleDocs]);
  const monthKeys = useMemo(() => {
    const keys = Object.keys(grouped);
    keys.sort((a,b) => {
      const [ma, ya] = a.split(" ");
      const [mb, yb] = b.split(" ");
      const da = new Date(`${ma} 1, ${ya}`);
      const db = new Date(`${mb} 1, ${yb}`);
      return db.getTime() - da.getTime();
    });
    return keys;
  }, [grouped]);

  // ---------- UPLOAD helpers ----------
  const openUpload = () => { setPicked([]); setBulkType(""); setBulkDate(new Date().toISOString().slice(0,10)); setUploadOpen(true); };
  const closeUpload = () => { if (!uploading) setUploadOpen(false); };

  const validateFile = (file: File) => {
    const name = file.name.toLowerCase();
    return allowedExt.some(ext => name.endsWith(ext));
  };

  const addLocalFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map(f => {
      const extOk = validateFile(f);
      return {
        file: f,
        id: makeId("pick-"),
        name: f.name,
        sizeKb: Math.round(f.size / 1024),
        assignedType: assignedTypeForFolder,
        date: new Date().toISOString().slice(0,10),
        progress: 0,
        error: extOk ? null : "Unsupported type"
      } as LocalPick;
    });
    setPicked(prev => [...arr, ...prev]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addLocalFiles(e.dataTransfer.files);
  };

  const removePick = (id: string) => setPicked(prev => prev.filter(p => p.id !== id));

  const applyBulk = () => {
    setPicked(prev => prev.map(p => ({ ...p, assignedType: bulkType || p.assignedType, date: bulkDate || p.date })));
  };

  const startUpload = async () => {
    // validate none have errors
    const anyError = picked.some(p => p.error);
    if (anyError) {
      alert("Please remove or fix files marked unsupported.");
      return;
    }
    if (picked.length === 0) { setUploadOpen(false); return; }

    setUploading(true);
    // simulate per-file upload progress and then add to context
    const toAdd: DocItem[] = [];
    for (let i = 0; i < picked.length; i++) {
      const p = picked[i];
      // simulate progress
      for (let prog = 10; prog <= 100; prog += Math.floor(30 + Math.random()*40)) {
        setPicked(prev => prev.map(x => x.id === p.id ? { ...x, progress: Math.min(prog,100) } : x));
        // short delay
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 120));
      }
      // prepare DocItem metadata
      const doc: DocItem = {
        id: makeId("doc-"),
        name: p.name,
        sizeKb: p.sizeKb,
        mimeType: p.file.type || "application/octet-stream",
        assignedType: p.assignedType,
        fy: selectedFY,
        uploadedAt: new Date(p.date + "T12:00:00").toISOString(),
        ocrStatus: "Pending",
        extracted: undefined
      };
      toAdd.push(doc);
    }

    // Add all docs to context
    addDocs(toAdd);
    setUploading(false);
    setPicked([]);
    setUploadOpen(false);
    // small success hint
    alert(`${toAdd.length} file(s) uploaded to ${folderName}. Run OCR to extract transactions.`);
  };

  // ---------- month actions using context ----------
  const runOcrForMonth = async (monthKey: string) => {
    const dates: Record<string, DocItem[]> = grouped[monthKey] || {};
    const allIds: string[] = [];
    Object.values(dates).forEach(arr => arr.forEach(f => allIds.push(f.id)));
    for (const id of allIds) {
      // eslint-disable-next-line no-await-in-loop
      await runOcrOnDoc(id);
    }
    alert(`Finished OCR for ${allIds.length} file(s) in ${monthKey}.`);
  };

  const downloadAllForMonth = (monthKey: string) => {
    const dates: Record<string, DocItem[]> = grouped[monthKey] || {};
    const names: string[] = [];
    Object.values(dates).forEach(arr => arr.forEach(f => names.push(`${f.name} • ${f.extracted?.vendor || ""} • ${f.extracted?.amount ?? ""}`)));
    const blob = new Blob([names.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}-${monthKey.replace(/ /g,"_")}-files.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadFile = (d: DocItem) => {
    const blob = new Blob([d.extracted?.rawText || `Mock content of ${d.name}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.name.replace(/\./g,"_")}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const monthSummary = (monthKey: string) => {
    const dates: Record<string, DocItem[]> = grouped[monthKey] || {};
    let count = 0; let size = 0;
    Object.values(dates).forEach(arr => arr.forEach(f => { count++; size += f.sizeKb; }));
    return { count, size };
  };

  // ---------- Render ----------
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, background: "#fff", border: "1px solid #eef2f7" }}>← Back</button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{folderName}</div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>{selectedFY} • {docsForFolder.length} files</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Search filename / vendor / OCR..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eef8" }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eef8" }}>
            <option value="All">All types</option>
            <option>Sales</option><option>Purchase</option><option>Expense</option><option>Bank</option><option>Other</option><option>Fixed Assets</option>
          </select>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eef8" }}>
            <option value="month">Group by Month</option>
            <option value="date">Group by Date</option>
          </select>

          <button onClick={openUpload} style={{ background: "#0b74de", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none" }}>
            Upload
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {monthKeys.length === 0 ? (
          <div style={{ padding: 28, borderRadius: 12, background: "#fff", textAlign: "center", color: "#6b7280" }}>
            No files found in {folderName}. Use Upload to add documents.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {monthKeys.map(monthKey => {
              const { count, size } = monthSummary(monthKey);
              const expanded = !!expandedMonths[monthKey];
              const dates = grouped[monthKey];
              const dateKeys = Object.keys(dates).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
              return (
                <div key={monthKey} style={{ background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 8px 22px rgba(14,30,50,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button onClick={() => setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }))} style={{ padding: 8, borderRadius: 8, border: "1px solid #eef2f7", background: "#fbfdff" }}>
                        {expanded ? "▾" : "▸"}
                      </button>
                      <div>
                        <div style={{ fontWeight: 700 }}>{monthKey}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>{count} files • {humanSize(size)}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => runOcrForMonth(monthKey)} style={{ padding: "8px 10px", borderRadius: 8 }}>Run OCR (All)</button>
                      <button onClick={() => downloadAllForMonth(monthKey)} style={{ padding: "8px 10px", borderRadius: 8 }}>Download All</button>
                      <label style={{ padding: "8px 10px", borderRadius: 8, background: "#0b74de", color: "#fff", cursor: "pointer" }}>
                        Upload to month
                        <input type="file" multiple style={{ display: "none" }} onChange={(e) => {
                          const monParts = monthKey.split(" ");
                          const assigned = `${monParts[1]}-${String(monthsOrder.indexOf(monParts[0]) + 1).padStart(2,"0")}-01`;
                          // convert FileList -> LocalPick and directly add to context with assigned date
                          const fl = e.target.files;
                          if (!fl) return;
                          const items: DocItem[] = Array.from(fl).map((f: File) => ({
                            id: makeId("doc-"),
                            name: f.name,
                            sizeKb: Math.round(f.size/1024),
                            mimeType: f.type || "application/octet-stream",
                            assignedType: assignedTypeForFolder,
                            fy: selectedFY,
                            uploadedAt: new Date(assigned + "T12:00:00").toISOString(),
                            ocrStatus: "Pending",
                            extracted: undefined
                          }));
                          addDocs(items);
                          alert(`${items.length} file(s) uploaded to ${monthKey}.`);
                        }} />
                      </label>
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {dateKeys.map(dateKey => (
                        <div key={dateKey} style={{ borderRadius: 8, padding: 8, background: "#fbfdff" }}>
                          <div style={{ fontSize: 13, color: "#0b1724", fontWeight: 700, marginBottom: 8 }}>{new Date(dateKey).toLocaleDateString()}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 160px 140px 180px", gap: 8, alignItems: "center" }}>
                            <div style={{ fontWeight: 700 }}>Filename</div>
                            <div style={{ fontWeight: 700 }}>Size</div>
                            <div style={{ fontWeight: 700 }}>Type</div>
                            <div style={{ fontWeight: 700 }}>OCR Status</div>
                            <div style={{ fontWeight: 700 }}>Actions</div>

                            {dates[dateKey].map(f => (
                              <React.Fragment key={f.id}>
                                <div style={{ padding: "6px 0" }}>
                                  {f.name}
                                  {f.extracted?.vendor ? <div style={{ fontSize: 12, color: "#6b7280" }}>{f.extracted.vendor} • {f.extracted.amount ? `₹${f.extracted.amount}` : ""}</div> : null}
                                </div>
                                <div>{humanSize(f.sizeKb)}</div>
                                <div>
                                  <select value={f.assignedType} onChange={(e) => updateDoc(f.id, { assignedType: e.target.value as any })} style={{ padding: 6, borderRadius: 6 }}>
                                    <option>Sales</option><option>Purchase</option><option>Expense</option><option>Bank</option><option>Other</option><option>Fixed Assets</option>
                                  </select>
                                </div>
                                <div>
                                  <span style={{ padding: "6px 10px", borderRadius: 8, background: f.ocrStatus === "Processed" ? "#ecfdf5" : f.ocrStatus === "Processing" ? "#fef9c3" : "#f3f4f6", color: f.ocrStatus === "Processed" ? "#065f46" : "#92400e" }}>
                                    {f.ocrStatus}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => runOcrOnDoc(f.id)} style={{ padding: "6px 10px", borderRadius: 6 }}>Run OCR</button>
                                  <button onClick={() => downloadFile(f)} style={{ padding: "6px 10px", borderRadius: 6 }}>Download</button>
                                  <button onClick={() => removeDoc(f.id)} style={{ padding: "6px 10px", borderRadius: 6, color: "#c00" }}>Delete</button>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload modal (simple inline modal) */}
      {uploadOpen && (
        <div style={{ position: "fixed", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(10,10,12,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ width: 860, background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 20px 60px rgba(2,6,23,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Upload files to {folderName}</div>
                <div style={{ color: "#6b7280", marginTop: 4 }}>Drag & drop or choose files. Assign date & type before confirming.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={closeUpload} style={{ padding: "8px 10px", borderRadius: 8 }}>Cancel</button>
                <button onClick={startUpload} disabled={uploading} style={{ background: "#0b74de", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>{uploading ? "Uploading..." : "Confirm Upload"}</button>
              </div>
            </div>

            <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ marginTop: 12, padding: 12, borderRadius: 8, border: "2px dashed #e6eef8", minHeight: 120, display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>Files</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Drop files here or use selector below. Supported: PDF, JPG, PNG, ZIP, CSV.</div>
                <label style={{ marginTop: "auto", background: "#fff", border: "1px solid #e6eef8", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}>
                  Select files
                  <input type="file" multiple style={{ display: "none" }} onChange={(e) => addLocalFiles(e.target.files)} />
                </label>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Bulk assign type</div>
                    <select value={bulkType as any} onChange={(e) => setBulkType(e.target.value as any)} style={{ padding: 8, borderRadius: 8, marginTop: 6 }}>
                      <option value="">— choose —</option>
                      <option>Sales</option><option>Purchase</option><option>Expense</option><option>Fixed Assets</option><option>Others</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Bulk date</div>
                    <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} style={{ padding: 8, borderRadius: 8, marginTop: 6 }} />
                  </div>

                  <div style={{ alignSelf: "flex-end" }}>
                    <button onClick={applyBulk} style={{ padding: "8px 10px", borderRadius: 8 }}>Apply to selected</button>
                  </div>
                </div>

                <div style={{ marginTop: 12, maxHeight: 320, overflow: "auto", paddingRight: 8 }}>
                  {picked.length === 0 ? (
                    <div style={{ padding: 28, textAlign: "center", color: "#6b7280" }}>No files selected yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid #eef2f7" }}>
                          <th style={{ padding: 8 }}>Preview</th>
                          <th style={{ padding: 8 }}>Filename</th>
                          <th style={{ padding: 8 }}>Size</th>
                          <th style={{ padding: 8 }}>Type</th>
                          <th style={{ padding: 8 }}>Date</th>
                          <th style={{ padding: 8 }}>Progress</th>
                          <th style={{ padding: 8 }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {picked.map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f7fafc" }}>
                            <td style={{ padding: 8 }}>{p.name.toLowerCase().endsWith(".pdf") ? "📄" : p.name.toLowerCase().endsWith(".jpg") || p.name.toLowerCase().endsWith(".png") ? "🖼️" : "📦"}</td>
                            <td style={{ padding: 8 }}>{p.name}{p.error ? <div style={{ color: "#c00", fontSize: 12 }}>{p.error}</div> : null}</td>
                            <td style={{ padding: 8 }}>{humanSize(p.sizeKb)}</td>
                            <td style={{ padding: 8 }}>
                              <select value={p.assignedType} onChange={(e) => setPicked(prev => prev.map(x => x.id === p.id ? { ...x, assignedType: e.target.value as any } : x))}>
                                <option>Sales</option><option>Purchase</option><option>Expense</option><option>Fixed Assets</option><option>Others</option>
                              </select>
                            </td>
                            <td style={{ padding: 8 }}>
                              <input type="date" value={p.date} onChange={(e) => setPicked(prev => prev.map(x => x.id === p.id ? { ...x, date: e.target.value } : x))} />
                            </td>
                            <td style={{ padding: 8 }}>
                              <div style={{ width: 160, background: "#f3f4f6", borderRadius: 6 }}>
                                <div style={{ width: `${p.progress ?? 0}%`, background: "#0b74de", height: 8, borderRadius: 6 }} />
                              </div>
                            </td>
                            <td style={{ padding: 8 }}>
                              <button onClick={() => removePick(p.id)} style={{ color: "#c00" }}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFolderView;