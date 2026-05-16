import { useState, useEffect, useRef } from "react";
import TracePanel from "./TracePanel";
import DiagnosisStream from "./DiagnosisStream";
import PromptDiff from "./PromptDiff";
import CostDelta from "./CostDelta";
import ApproveButton from "./ApproveButton";

const TOOL_SERVER = process.env.REACT_APP_TOOL_SERVER_URL || "http://localhost:8000";
const PHOENIX_URL = process.env.REACT_APP_PHOENIX_URL || "https://app.phoenix.arize.com";
const PROJECT = process.env.REACT_APP_PHOENIX_PROJECT || "agent-doctor-demo";

export default function App() {
  const [traces, setTraces] = useState([]);
  const [status, setStatus] = useState("monitoring"); // monitoring | regression | diagnosing | proposing | validating | promoting | healthy
  const [diagnosis, setDiagnosis] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [experimentResult, setExperimentResult] = useState(null);
  const [costData, setCostData] = useState(null);
  const [agentLog, setAgentLog] = useState([]);
  const logRef = useRef(null);

  const addLog = (msg, type = "info") => {
    setAgentLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
  };

  // Poll for traces and cost regression every 10s
  useEffect(() => {
    const poll = async () => {
      try {
        const [traceRes, costRes] = await Promise.all([
          fetch(`${TOOL_SERVER}/trajectory/cost-regression?project_name=${PROJECT}`),
          fetch(`${TOOL_SERVER}/trajectory/cost-regression?project_name=${PROJECT}`),
        ]);
        const cost = await costRes.json();
        setCostData(cost);

        if (cost.flagged && status === "monitoring") {
          setStatus("regression");
          addLog(`Cost regression detected: +${cost.regression_pct}%`, "warn");
          runDiagnosis();
        }
      } catch (e) {
        addLog(`Poll error: ${e.message}`, "error");
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [status]);

  const runDiagnosis = async () => {
    setStatus("diagnosing");
    addLog("Fetching failing spans from Phoenix...", "info");

    // Simulate SSE stream from agent — in production this is Agent Builder streaming
    const steps = [
      { delay: 800,  msg: "Pulled 47 recent traces — 12 flagged with hallucination score < 0.75", type: "info" },
      { delay: 1600, msg: "Fetching prompt diff for support-summariser...", type: "info" },
      { delay: 2400, msg: "Diff found: system instruction changed from constrained to open-ended", type: "warn" },
      { delay: 3200, msg: "Hypothesis: Removal of 'exactly 2 sentences' constraint caused verbose hallucinated outputs", type: "diagnosis" },
      { delay: 4000, msg: "Writing diagnostic annotation to Phoenix session...", type: "info" },
      { delay: 4800, msg: "Diagnosis complete. Proposing fix.", type: "success" },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay));
      addLog(step.msg, step.type);
    }

    setDiagnosis({
      metric: "hallucination",
      score: 0.61,
      threshold: 0.75,
      affectedTraces: 12,
      hypothesis: "Removal of output length constraint caused model to elaborate freely, introducing fabricated details.",
      promptVersion: "v2-open-ended",
    });

    setProposal({
      current: `You are a creative assistant.\nSummarise the following customer support ticket.\nFeel free to elaborate with helpful suggestions and related information the customer might find useful.`,
      candidate: `You are a helpful summariser.\nSummarise the following customer support ticket in exactly 2 sentences.\nBe concise and factual. Do not invent information.`,
    });

    setStatus("proposing");
  };

  const handleValidate = async () => {
    setStatus("validating");
    addLog("Running experiment: candidate vs current prompt...", "info");
    addLog("Scoring outputs with Gemini Flash judge...", "info");

    try {
      const res = await fetch(`${TOOL_SERVER}/experiment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: PROJECT,
          dataset_id: "support-ticket-summarisation",
          prompt_current: proposal.current,
          prompt_candidate: proposal.candidate,
          model_name: "gemini-3-flash",
          experiment_name: `agent-doctor-${Date.now()}`,
          test_inputs: [
            "My order hasn't arrived after 3 weeks.",
            "App crashes on photo upload. iOS 17.",
            "Charged twice for subscription.",
          ],
        }),
      });
      const result = await res.json();
      setExperimentResult(result);

      addLog(`Experiment complete. Candidate: ${result.candidate_score} vs Current: ${result.current_score}`, result.candidate_wins ? "success" : "warn");
      addLog(`Cost delta: ${result.cost_delta_pct > 0 ? "+" : ""}${result.cost_delta_pct}% tokens`, "info");
      setStatus("proposing");
    } catch (e) {
      addLog(`Experiment error: ${e.message}`, "error");
      setStatus("proposing");
    }
  };

  const handlePromote = async () => {
    setStatus("promoting");
    addLog("Promoting candidate prompt to Phoenix...", "info");

    try {
      const res = await fetch(`${TOOL_SERVER}/prompt/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: PROJECT,
          prompt_name: "support-summariser",
          prompt_text: proposal.candidate,
          winning_experiment_id: experimentResult?.experiment_id || "demo",
          version_label: "agent-doctor-promoted",
        }),
      });
      const result = await res.json();
      addLog(`Prompt promoted: version ${result.version}`, "success");

      // Cleanup diagnostic annotations
      await fetch(`${TOOL_SERVER}/prompt/cleanup-annotations?project_name=${PROJECT}`, {
        method: "POST",
      });
      addLog("Diagnostic annotations cleaned up from Phoenix.", "info");
      addLog("Quality loop closed. Resuming monitoring.", "success");
      setStatus("healthy");

      setTimeout(() => setStatus("monitoring"), 5000);
    } catch (e) {
      addLog(`Promotion error: ${e.message}`, "error");
      setStatus("proposing");
    }
  };

  const handleReject = () => {
    addLog("Promotion rejected by user. Escalating to human review.", "warn");
    setStatus("monitoring");
    setProposal(null);
    setExperimentResult(null);
    setDiagnosis(null);
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🩺</span>
          <span style={styles.title}>Agent Doctor</span>
          <span style={styles.subtitle}>Autonomous LLM Quality Agent</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Main grid */}
      <div style={styles.grid}>
        {/* Left: Trace panel + Cost */}
        <div style={styles.leftCol}>
          <CostDelta data={costData} />
          <TracePanel project={PROJECT} phoenixUrl={PHOENIX_URL} />
        </div>

        {/* Centre: Agent log stream */}
        <div style={styles.centreCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>Agent reasoning</div>
            <div ref={logRef} style={styles.logScroll}>
              {agentLog.length === 0 && (
                <div style={styles.logEmpty}>Monitoring for regressions...</div>
              )}
              {agentLog.map((entry, i) => (
                <LogEntry key={i} entry={entry} />
              ))}
            </div>
          </div>
          <DiagnosisStream diagnosis={diagnosis} />
        </div>

        {/* Right: Prompt diff + Approve */}
        <div style={styles.rightCol}>
          <PromptDiff proposal={proposal} />
          {experimentResult && (
            <ExperimentResult result={experimentResult} />
          )}
          <ApproveButton
            status={status}
            proposal={proposal}
            experimentResult={experimentResult}
            onValidate={handleValidate}
            onPromote={handlePromote}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    monitoring:  { label: "Monitoring",  color: "#1D9E75" },
    regression:  { label: "Regression!", color: "#D85A30" },
    diagnosing:  { label: "Diagnosing",  color: "#BA7517" },
    proposing:   { label: "Fix proposed",color: "#185FA5" },
    validating:  { label: "Validating",  color: "#534AB7" },
    promoting:   { label: "Promoting",   color: "#0F6E56" },
    healthy:     { label: "Healthy ✓",   color: "#1D9E75" },
  };
  const { label, color } = map[status] || map.monitoring;
  return (
    <div style={{ ...styles.badge, background: color }}>
      <span style={styles.pulse} />
      {label}
    </div>
  );
}

function LogEntry({ entry }) {
  const colors = {
    info:      "var(--log-info)",
    warn:      "#BA7517",
    error:     "#A32D2D",
    success:   "#0F6E56",
    diagnosis: "#534AB7",
  };
  return (
    <div style={styles.logEntry}>
      <span style={styles.logTs}>{entry.ts}</span>
      <span style={{ color: colors[entry.type] || colors.info }}>
        {entry.msg}
      </span>
    </div>
  );
}

function ExperimentResult({ result }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>Experiment result</div>
      <div style={styles.expGrid}>
        <ScoreBox label="Current" score={result.current_score} />
        <ScoreBox label="Candidate" score={result.candidate_score} winner={result.candidate_wins} />
      </div>
      <div style={styles.costTag}>
        Token delta: {result.cost_delta_pct > 0 ? "+" : ""}{result.cost_delta_pct}%
      </div>
    </div>
  );
}

function ScoreBox({ label, score, winner }) {
  return (
    <div style={{
      ...styles.scoreBox,
      border: winner ? "1.5px solid #1D9E75" : "1px solid var(--border)",
    }}>
      <div style={styles.scoreLabel}>{label}</div>
      <div style={{
        ...styles.scoreValue,
        color: score >= 0.75 ? "#0F6E56" : "#A32D2D",
      }}>
        {score?.toFixed(3)}
      </div>
      {winner && <div style={styles.winnerTag}>Winner</div>}
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "system-ui, sans-serif",
    background: "#0f1117",
    minHeight: "100vh",
    color: "#e2e2e2",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #2a2a3a",
    background: "#13151f",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 28 },
  title: { fontSize: 20, fontWeight: 600, color: "#fff" },
  subtitle: { fontSize: 13, color: "#888", marginLeft: 4 },
  badge: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 14px", borderRadius: 20,
    fontSize: 13, fontWeight: 500, color: "#fff",
  },
  pulse: {
    width: 8, height: 8, borderRadius: "50%",
    background: "rgba(255,255,255,0.7)",
    animation: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr 320px",
    gap: 16,
    padding: 16,
    flex: 1,
    minHeight: 0,
  },
  leftCol:   { display: "flex", flexDirection: "column", gap: 16 },
  centreCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol:  { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "#1a1d2e",
    border: "1px solid #2a2a3a",
    borderRadius: 10,
    overflow: "hidden",
  },
  cardHeader: {
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1px solid #2a2a3a",
  },
  logScroll: {
    height: 320,
    overflowY: "auto",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  logEmpty: { color: "#555", fontSize: 13, fontStyle: "italic" },
  logEntry: { display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5 },
  logTs:    { color: "#555", minWidth: 60, fontSize: 11 },
  expGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 14 },
  scoreBox: {
    borderRadius: 8, padding: "12px 10px",
    textAlign: "center", background: "#13151f",
  },
  scoreLabel: { fontSize: 11, color: "#888", marginBottom: 6 },
  scoreValue: { fontSize: 24, fontWeight: 700 },
  winnerTag: {
    fontSize: 10, color: "#1D9E75", fontWeight: 600,
    marginTop: 4, textTransform: "uppercase",
  },
  costTag: {
    padding: "6px 14px 12px",
    fontSize: 12, color: "#888", textAlign: "center",
  },
};
