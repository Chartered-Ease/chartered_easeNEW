import React, { useState } from "react";
import DocumentFolderView from "./DocumentFolderView";

const folders = ["Purchase", "Sales", "Expenses", "Fixed Assets", "Others"];

const VaultCard: React.FC<{ title: string; count?: number; onClick: () => void }> = ({ title, count = 0, onClick }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    style={{
      padding: 20,
      borderRadius: 12,
      background: "#ffffff",
      cursor: "pointer",
      boxShadow: "0 8px 22px rgba(14, 30, 50, 0.06)",
      transition: "transform .18s ease, box-shadow .18s ease",
      display: "flex",
      alignItems: "center",
      gap: 12
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-6px)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
  >
    <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
      📁
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: "#0f1724" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{count} files</div>
    </div>
    <div style={{ color: "#0b74de", fontWeight: 700 }}>Open →</div>
  </div>
);

const DocumentVault: React.FC<{ selectedFY?: string }> = ({ selectedFY = "FY 2024-25" }) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (selectedFolder) {
    return <DocumentFolderView folderName={selectedFolder} onClose={() => setSelectedFolder(null)} selectedFY={selectedFY} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: "#0f1724" }}>Document Vault</h2>
          <div style={{ marginTop: 6, color: "#6b7280" }}>Central repository for all business documents — OCR, classify and manage files.</div>
        </div>

        <div style={{ minWidth: 240 }}>
          <input
            placeholder="Smart Search (OCR Enabled)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e6eef8", background: "#fbfdff",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)"
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {folders.map((f) => (
          <VaultCard key={f} title={f} count={Math.floor(Math.random() * 120)} onClick={() => setSelectedFolder(f)} />
        ))}

        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedFolder("Upload")}
          style={{
            padding: 20,
            borderRadius: 12,
            background: "linear-gradient(180deg,#ffffff,#fbfdff)",
            border: "1px dashed #dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0b74de",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(11,116,222,0.06)"
          }}
        >
          + Upload Documents
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;