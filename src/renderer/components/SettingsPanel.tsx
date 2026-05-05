type SettingsPanelProps = {
  hasPython: boolean;
};

export function SettingsPanel({ hasPython }: SettingsPanelProps): JSX.Element {
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
          <p>Python detected: {hasPython ? "Yes" : "No"}</p>
          <p>CleanRAG runs fully local after Ollama and the recommended models are ready.</p>
        </div>
        <div className="card">
          <h3>Need Ollama?</h3>
          <p>Use the setup screen to confirm installation, or open the official installer from the README instructions.</p>
        </div>
      </div>
    </section>
  );
}

