export default function DiagnosisStream({ diagnosis }) {
  if (!diagnosis) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>Diagnosis</div>
      <div style={styles.body}>
        <Row label="Metric failed" value={diagnosis.metric} color="#E24B4A" />
        <Row label="Score" value={`${diagnosis.score} (threshold: ${diagnosis.threshold})`} color="#E24B4A" />
        <Row label="Affected traces" value={diagnosis.affectedTraces} />
        <Row label="Prompt version" value={diagnosis.promptVersion} />
        <div style={styles.hyp}>
          <div style={styles.hypLabel}>Hypothesis</div>
          <div style={styles.hypText}>{diagnosis.hypothesis}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color: color || "#ccc" }}>{value}</span>
    </div>
  );
}

const styles = {
  card: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, overflow: "hidden" },
  header: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #2a2a3a" },
  body: { padding: 14 },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 12, color: "#555" },
  value: { fontSize: 12, fontFamily: "monospace", color: "#ccc", textAlign: "right", maxWidth: "60%" },
  hyp: { marginTop: 10, padding: 10, background: "#13151f", borderRadius: 8, borderLeft: "3px solid #534AB7" },
  hypLabel: { fontSize: 11, color: "#534AB7", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" },
  hypText: { fontSize: 13, color: "#bbb", lineHeight: 1.6 },
};
