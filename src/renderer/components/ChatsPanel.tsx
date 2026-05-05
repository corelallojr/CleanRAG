import { useState } from "react";
import type { ChatRecord, MessageRecord, ProjectRecord, SourceRecord } from "../../shared";

type ChatsPanelProps = {
  activeProject: ProjectRecord | null;
  chats: ChatRecord[];
  activeChatId: string | null;
  messages: MessageRecord[];
  models: string[];
  sources: SourceRecord[];
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => Promise<void>;
  onSendMessage: (input: { message: string; model: string; useRetrieval: boolean; sourceId: string | null }) => Promise<void>;
};

export function ChatsPanel({
  activeProject,
  chats,
  activeChatId,
  messages,
  models,
  sources,
  onSelectChat,
  onCreateChat,
  onSendMessage
}: ChatsPanelProps): JSX.Element {
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(models[0] ?? "qwen2.5:3b");
  const [useRetrieval, setUseRetrieval] = useState(true);
  const [sourceId, setSourceId] = useState<string>("__all__");

  return (
    <div className="chat-layout">
      <aside className="panel panel--sidebar">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Chats</p>
            <h2>{activeProject?.name ?? "Choose a project"}</h2>
          </div>
          <button className="button button--ghost" onClick={() => void onCreateChat()} type="button" disabled={!activeProject}>
            New chat
          </button>
        </div>
        <div className="stack">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={`card card--interactive ${chat.id === activeChatId ? "card--active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="card__title-row">
                <h3>{chat.title}</h3>
                <span>{new Date(chat.updatedAt).toLocaleTimeString()}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <section className="panel panel--chat">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Conversation</p>
            <h2>{activeProject ? `Inside ${activeProject.name}` : "Pick a project to begin"}</h2>
          </div>
          <div className="chat-toolbar">
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {models.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="toggle">
              <input type="checkbox" checked={useRetrieval} onChange={(event) => setUseRetrieval(event.target.checked)} />
              <span>Use project sources</span>
            </label>
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} disabled={!useRetrieval}>
              <option value="__all__">All sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="messages">
          {messages.map((message) => (
            <article key={message.id} className={`message message--${message.role}`}>
              <div className="message__role">{message.role}</div>
              <div className="message__content">{message.content}</div>
              {message.citations.length > 0 ? (
                <div className="citation-list">
                  {message.citations.map((citation) => (
                    <div key={`${message.id}-${citation.sourceId}-${citation.locator}`} className="citation">
                      <strong>{citation.sourceName}</strong>
                      <span>{citation.locator}</span>
                      <p>{citation.excerpt}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) {
              return;
            }
            void onSendMessage({
              message: draft,
              model,
              useRetrieval,
              sourceId: sourceId === "__all__" ? null : sourceId
            }).then(() => setDraft(""));
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question, summarize a source, or chat without retrieval."
          />
          <button className="button" type="submit" disabled={!activeProject || !activeChatId || !draft.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

