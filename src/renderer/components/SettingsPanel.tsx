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
          <p>Python detected: {runtimeConfig.hasPython ? "Yes" : "No"}</p>
          <p>CleanRAG runs fully local after Ollama and the recommended models are ready.</p>
        </div>
        <div className="card">
          <h3>Local backend</h3>
          <p>CleanRAG uses a local Python virtual environment under <code>backend\.venv</code> and starts the API directly on your machine.</p>
        </div>
      </div>
    </section>
  );
}
