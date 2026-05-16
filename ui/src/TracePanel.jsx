import { useState, useEffect } from "react";

const MOCK_TRACES = [
  { id: "tr_001", score: 0.61, status: "fail", prompt: "v2-open-ended", tokens: 412, ts: "14:23:01" },
  { id: "tr_002", score: 0.58, status: "fail", prompt: "v2-open-ended", tokens: 489, ts: "14:23:15" },
  { id: "tr_003", score: 0.92, status: "pass", prompt: "v1-baseline",   tokens: 198, ts: "14:21:44" },
  { id: "tr_004", score: 0.63, status: "fail", prompt: "v2-open-ended", tokens: 501, ts: "14:22:30" },
  { id: "tr_005", score: 0.94, status: "pass", prompt: "v1-baseline",   tokens: 201, ts: "14:20:11" },
  { id: "tr_006", score: 0.59, status: "fail", prompt: "v2-open-ended", tokens: 467, ts: "14:22:55" },
];

export default function TracePanel({ project, phoenixUrl }) {
  const [traces, setTraces] = useState(MOCK_TRACES);
  const [selected, setSelected] = useState(null);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        Phoenix traces
        
          href={`${phoenixUrl}/projects/${project}`}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          Open ↗
        </a>
      </div>
      <div style={styles.list}>
        {traces.map(t => (
          <div
            key={t.id}
            style={{
              ...styles.row,
              background: selected?.id === t.id ? "#1e2135" : "transparent",
              borderLeft: `3px solid ${t.status === "fail" ? "#A32D2D" : "#0F6E56"}`,
            }}
            onClick={() => setSelected(t)}
          >
            <div style={styles.rowTop}>
              <span style={styles.traceId}>{t.id}</span>
              <span style={{
                ...styles.badge,
                background: t.status === "fail" ? "#2d1515" : "#0d2318",
                color: t.status === "fail" ? "#E24B4A" : "#1D9E75",
              }}>
                {t.score.toFixed(2)}
              </span>
            </div>
            <div style={styles.rowBot}>
              <span style={styles.meta}>{t.prompt}</span>
              <span style={styles.meta}>{t.tokens} tok · {t.ts}</span>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div style={styles.detail}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Trace ID</span>
            <span style={styles.detailVal}>{selected.id}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Hallucination</span>
            <span style={{ ...styles.detailVal, color: selected.score < 0.75 ? "#E24B4A" : "#1D9E75" }}>
              {selected.score.toFixed(3)}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Prompt ver.</span>
            <span style={styles.detailVal}>{selected.prompt}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Tokens</span>
            <span style={styles.detailVal}>{selected.tokens}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, overflow: "hidden" },
  header: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #2a2a3a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  link: { color: "#378ADD", fontSize: 11, textDecoration: "none" },
  list: { maxHeight: 280, overflowY: "auto" },
  row: { padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #1e2030", transition: "background 0.15s" },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  rowBot: { display: "flex", justifyContent: "space-between" },
  traceId: { fontSize: 12, fontFamily: "monospace", color: "#aaa" },
  badge: { fontSize: 11, padding: "2px 7px", borderRadius: 10, fontWeight: 600 },
  meta: { fontSize: 11, color: "#555" },
  detail: { padding: "10px 14px", borderTop: "1px solid #2a2a3a", background: "#13151f" },
  detailRow: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  detailLabel: { fontSize: 11, color: "#555" },
  detailVal: { fontSize: 12, fontFamily: "monospace", color: "#ccc" },
};
