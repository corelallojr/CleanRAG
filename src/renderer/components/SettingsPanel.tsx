import type { RuntimeConfig } from "../../shared";

type SettingsPanelProps = {
  runtimeConfig: RuntimeConfig;
};

export function SettingsPanel({ runtimeConfig }: SettingsPanelProps): JSX.Element {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Local runtime notes</h2>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <h3>Desktop runtime</h3>
          <p>Backend mode: {runtimeConfig.backendMode}</p>
          <p>Docker detected: {runtimeConfig.hasDocker ? "Yes" : "No"}</p>
          <p>Python detected: {runtimeConfig.hasPython ? "Yes" : "No"}</p>
          <p>CleanRAG runs fully local after Ollama and the recommended models are ready.</p>
        </div>
        <div className="card">
          <h3>Containerized backend</h3>
          <p>The preferred local setup uses Docker Desktop for the backend container so users do not have to install Python or OCR dependencies manually.</p>
        </div>
      </div>
    </section>
  );
}
