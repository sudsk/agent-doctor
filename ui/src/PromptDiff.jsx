export default function PromptDiff({ proposal }) {
  if (!proposal) return (
    <div style={styles.empty}>
      <div style={styles.emptyText}>Prompt diff will appear when a fix is proposed</div>
    </div>
  );

  const currentLines = proposal.current.split("\n");
  const candidateLines = proposal.candidate.split("\n");

  return (
    <div style={styles.card}>
      <div style={styles.header}>Prompt diff</div>
      <div style={styles.cols}>
        <div style={styles.col}>
          <div style={styles.colLabel}>Current (failing)</div>
          {currentLines.map((line, i) => (
            <div key={i} style={{
              ...styles.line,
              background: !candidateLines.includes(line) ? "#2d1515" : "transparent",
              color:      !candidateLines.includes(line) ? "#E24B4A" : "#888",
            }}>
              {line || " "}
            </div>
          ))}
        </div>
        <div style={styles.divider} />
        <div style={styles.col}>
          <div style={styles.colLabel}>Candidate (proposed)</div>
          {candidateLines.map((line, i) => (
            <div key={i} style={{
              ...styles.line,
              background: !currentLines.includes(line) ? "#0d2318" : "transparent",
              color:      !currentLines.includes(line) ? "#1D9E75" : "#888",
            }}>
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, overflow: "hidden" },
  empty: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20 },
  emptyText: { fontSize: 12, color: "#555", fontStyle: "italic", textAlign: "center" },
  header: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #2a2a3a" },
  cols: { display: "flex" },
  col: { flex: 1, padding: "10px 12px", overflowX: "auto" },
  colLabel: { fontSize: 11, color: "#555", marginBottom: 8, fontWeight: 600 },
  line: { fontSize: 11, fontFamily: "monospace", padding: "2px 6px", borderRadius: 3, marginBottom: 2, whiteSpace: "pre", lineHeight: 1.6 },
  divider: { width: 1, background: "#2a2a3a" },
};
