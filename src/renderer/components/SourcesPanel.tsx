import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { ProjectRecord, SourceRecord } from "../../shared";

type SourcesPanelProps = {
  activeProject: ProjectRecord | null;
  sources: SourceRecord[];
  onUpload: (files: File[]) => Promise<void>;
  onPickFiles: () => Promise<void>;
  onReindex: (sourceId: string) => Promise<void>;
};

export function SourcesPanel({ activeProject, sources, onUpload, onPickFiles, onReindex }: SourcesPanelProps): JSX.Element {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      void onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !activeProject
  });

  return (
    <div className="view-grid">
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Source setup</p>
            <h2>{activeProject ? `Add files to ${activeProject.name}` : "Choose a project first"}</h2>
          </div>
          <button className="button button--ghost" onClick={() => void onPickFiles()} type="button" disabled={!activeProject}>
            Pick files
          </button>
        </div>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? "dropzone--active" : ""}`}>
          <input {...getInputProps()} />
          <h3>Drag documents here</h3>
          <p>PDF, DOCX, TXT, Markdown, CSV, XLSX, JSON, PNG, JPG</p>
        </div>
      </section>
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Current sources</p>
            <h2>Ready for retrieval</h2>
          </div>
        </div>
        <div className="stack">
          {sources.map((source) => (
            <article key={source.id} className="card">
              <div className="card__title-row">
                <h3>{source.name}</h3>
                <span>{source.fileType.toUpperCase()}</span>
              </div>
              <p>Status: {source.status}</p>
              <p>Chunks: {source.chunkCount}</p>
              <p>Last indexed: {source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleString() : "Not indexed yet"}</p>
              <button className="button button--ghost" onClick={() => void onReindex(source.id)} type="button">
                Reindex
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

