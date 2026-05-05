import type { RuntimeConfig, SetupStatus } from "../../shared";

type SetupChecklistProps = {
  setupStatus: SetupStatus;
  runtimeConfig: RuntimeConfig;
  onRetry: () => void;
  onRunSetupHelper: () => Promise<void>;
};

export function SetupChecklist({
  setupStatus,
  runtimeConfig,
  onRetry,
  onRunSetupHelper
}: SetupChecklistProps): JSX.Element {
  const steps = [
    { label: "Local data folder ready", ok: setupStatus.appDataReady },
    { label: "Ollama installed", ok: setupStatus.ollamaInstalled },
    { label: "Ollama reachable", ok: setupStatus.ollamaReachable },
    { label: `Chat model ready (${setupStatus.recommendedChatModel})`, ok: setupStatus.chatModelReady },
    { label: `Embedding model ready (${setupStatus.recommendedEmbeddingModel})`, ok: setupStatus.embeddingModelReady }
  ];

  return (
    <section className="panel setup-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">First-run setup</p>
          <h2>Make this machine ready</h2>
        </div>
        <div className="row">
          <button className="button button--ghost" onClick={onRetry} type="button">
            Retry checks
          </button>
          <button className="button" onClick={() => void onRunSetupHelper()} type="button">
            Setup helper
          </button>
        </div>
      </div>
      {runtimeConfig.backendMode === "docker" ? (
        <div className="notice notice--ok">Backend runtime: Docker container</div>
      ) : null}
      {!runtimeConfig.hasPython && !runtimeConfig.hasDocker ? (
        <div className="notice notice--warning">
          Neither Docker nor Python is available yet. Use the setup helper to install the local runtime CleanRAG needs.
        </div>
      ) : null}
      <div className="checklist">
        {steps.map((step) => (
          <div key={step.label} className="checklist__item">
            <div className={`status-dot ${step.ok ? "status-dot--ok" : "status-dot--warn"}`} />
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      {setupStatus.issues.length > 0 ? (
        <div className="notice notice--warning">
          {setupStatus.issues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      ) : (
        <div className="notice notice--ok">The app is ready for fully local chat and retrieval.</div>
      )}
    </section>
  );
}
