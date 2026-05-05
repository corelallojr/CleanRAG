import type { RuntimeConfig } from "../../shared";

type RuntimeBootstrapPanelProps = {
  runtimeConfig: RuntimeConfig;
  onRunSetupHelper: () => Promise<void>;
};

export function RuntimeBootstrapPanel({
  runtimeConfig,
  onRunSetupHelper
}: RuntimeBootstrapPanelProps): JSX.Element {
  return (
    <section className="panel setup-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Local setup</p>
          <h2>Start the local service layer</h2>
        </div>
        <button className="button" onClick={() => void onRunSetupHelper()} type="button">
          Run setup helper
        </button>
      </div>
      <div className="notice notice--warning">
        <p>CleanRAG could not reach its local backend yet.</p>
        <p>
          Preferred runtime: Docker container. Fallback runtime: local Python. Current mode: <strong>{runtimeConfig.backendMode}</strong>.
        </p>
      </div>
      <div className="checklist">
        <div className="checklist__item">
          <div className={`status-dot ${runtimeConfig.hasDocker ? "status-dot--ok" : "status-dot--warn"}`} />
          <span>Docker available</span>
        </div>
        <div className="checklist__item">
          <div className={`status-dot ${runtimeConfig.hasPython ? "status-dot--ok" : "status-dot--warn"}`} />
          <span>Python available</span>
        </div>
      </div>
      <div className="notice">
        <p>The setup helper installs or verifies Docker Desktop and Ollama, then builds and starts the backend container locally.</p>
      </div>
    </section>
  );
}
