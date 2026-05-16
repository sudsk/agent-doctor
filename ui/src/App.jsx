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

function ExperimentR
