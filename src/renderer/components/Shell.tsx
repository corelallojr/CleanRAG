import type { ReactNode } from "react";
import { Database, FolderKanban, MessageSquare, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";

export type NavView = "chats" | "projects" | "sources" | "models" | "settings";

const navItems: Array<{ id: NavView; label: string; icon: typeof MessageSquare }> = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "sources", label: "Sources", icon: Database },
  { id: "models", label: "Models", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings }
];

type ShellProps = {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  children: ReactNode;
};

export function Shell({ activeView, onSelectView, children }: ShellProps): JSX.Element {
  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="brand">
          <div className="brand__mark">CR</div>
          <div>
            <p className="eyebrow">Local knowledge, kept clean</p>
            <h1>CleanRAG</h1>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={clsx("nav__item", item.id === activeView && "nav__item--active")}
                onClick={() => onSelectView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="shell__content">{children}</main>
    </div>
  );
}
