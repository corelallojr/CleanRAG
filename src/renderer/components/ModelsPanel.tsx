import type { ModelRecord } from "../../shared";

type ModelsPanelProps = {
  models: ModelRecord[];
  onInstall: (model: string) => Promise<void>;
  onRemove: (model: string) => Promise<void>;
};

export function ModelsPanel({ models, onInstall, onRemove }: ModelsPanelProps): JSX.Element {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Models</p>
          <h2>Manage local Ollama models</h2>
        </div>
      </div>
      <div className="model-grid">
        {models.map((model) => (
          <article key={model.tag} className="card">
            <div className="card__title-row">
              <h3>{model.name}</h3>
              <span>{model.kind}</span>
            </div>
            <p>{model.size}</p>
            <p>Status: {model.status}</p>
            <div className="row">
              <button
                className="button"
                type="button"
                onClick={() => void onInstall(model.tag)}
                disabled={model.installed || model.status === "installing"}
              >
                {model.installed ? "Installed" : "Install"}
              </button>
              <button className="button button--ghost" type="button" onClick={() => void onRemove(model.tag)} disabled={!model.installed}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

