import { useState } from "react";
import type { ProjectRecord } from "../../shared";

type ProjectsPanelProps = {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (input: { name: string; description: string }) => Promise<void>;
};

export function ProjectsPanel({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject
}: ProjectsPanelProps): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="view-grid view-grid--two">
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>Organize work by topic</h2>
          </div>
        </div>
        <div className="stack">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className={`card card--interactive ${project.id === activeProjectId ? "card--active" : ""}`}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="card__title-row">
                <h3>{project.name}</h3>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
              <p>{project.description || "No description yet."}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">New project</p>
            <h2>Start a clean workspace</h2>
          </div>
        </div>
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreateProject({ name, description }).then(() => {
              setName("");
              setDescription("");
            });
          }}
        >
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Quarterly reporting" />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this project is for."
            />
          </label>
          <button className="button" type="submit" disabled={!name.trim()}>
            Create project
          </button>
        </form>
      </section>
    </div>
  );
}

