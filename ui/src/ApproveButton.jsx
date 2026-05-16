export default function ApproveButton({
  status, proposal, experimentResult,
  onValidate, onPromote, onReject,
}) {
  if (!proposal) return null;

  const canValidate = status === "proposing" && !experimentResult;
  const canPromote  = status === "proposing" && experimentResult?.candidate_wins;
  const isWorking   = status === "validating" || status === "promoting";

  return (
    <div style={styles.card}>
      <div style={styles.header}>Human in the loop</div>
      <div style={styles.body}>
        <div style={styles.notice}>
          Agent Doctor requires your approval before making changes.
        </div>

        {canValidate && (
          <button style={styles.btnPrimary} onClick={onValidate}>
            ✓ Validate candidate against dataset
          </button>
        )}

        {canPromote && (
          <>
            <div style={styles.winnerNotice}>
              Candidate wins — ready to promote to Phoenix
            </div>
            <button style={styles.btnSuccess} onClick={onPromote}>
              🚀 Approve promotion
            </button>
          </>
        )}

        {experimentResult && !experimentResult.candidate_wins && (
          <div style={styles.loserNotice}>
            Candidate did not outperform current prompt. No promotion recommended.
          </div>
        )}

        {isWorking && (
          <div style={styles.working}>Working...</div>
        )}

        {proposal && !isWorking && (
          <button style={styles.btnDanger} onClick={onReject}>
            ✗ Reject — escalate to human review
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#1a1d2e", border: "1px solid #2a2a3a", borderRadius: 10, overflow: "hidden" },
  header: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #2a2a3a" },
  body: { padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  notice: { fontSize: 12, color: "#666", lineHeight: 1.5 },
  winnerNotice: { fontSize: 12, color: "#1D9E75", padding: "8px 10px", background: "#0d2318", borderRadius: 6 },
  loserNotice: { fontSize: 12, color: "#BA7517", padding: "8px 10px", background: "#2d1f0d", borderRadius: 6 },
  working: { fontSize: 13, color: "#534AB7", textAlign: "center", padding: 8 },
  btnPrimary: { background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  btnSuccess: { background: "#0F6E56", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  btnDanger:  { background: "transparent", color: "#A32D2D", border: "1px solid #A32D2D", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" },
};
