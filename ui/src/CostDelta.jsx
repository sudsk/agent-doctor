import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_HISTORY = [
  { t: "14:15", tokens: 198 },
  { t: "14:17", tokens: 205 },
  { t: "14:19", tokens: 201 },
  { t: "14:21", tokens: 412 },
  { t: "14:23", tokens: 489 },
  { t: "14:25", tokens: 501 },
];

export default function CostDelta({ data }) {
  const flagged = data?.flagged;
  const pct = data?.regression_pct ?? 0;

  return (
    <div style={styles.card}>
      <div style={styles.header}>Token cost trend</div>
      <div style={styles.summary}>
        <span style={{ ...styles.pct, color: flagged ? "#E24B4A" : "#1D9E75" }}>
          {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
        </span>
        <span style={styles.label}>
          {flagged ? "Cost regression flagged" : "Within baseline"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={MOCK_HISTORY} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#555" }} />
          <YAxis tick={{ fontSize: 10, fill: "#555" }} />
          <Tooltip
            contentStyle={{ background: "#13151f", border: "1px solid #2a2a3a", fontSize: 11 }}
            labelStyle={{ color: "#888" }}
          />
          <Line
            type="monotone"
            dataKey="tokens"
            stroke={flagged ? "#E24B4A" : "#1D9E75"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  card: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, overflow: "hidden" },
  header: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #2a2a3a" },
  summary: { display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px 4px" },
  pct: { fontSize: 22, fontWeight: 700 },
  label: { fontSize: 12, color: "#666" },
};
