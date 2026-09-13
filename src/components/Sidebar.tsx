import {
  Columns3,
  LayoutGrid,
  Search,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Folder,
} from "lucide-react";
import type { Project } from "../domain/model";
import { tr } from "../i18n";
export function Sidebar({
  collapsed,
  toggle,
  projects,
  activeId,
  page,
  navigate,
  openProject,
  newProject,
  settings,
  profile,
  user,
  preview,
}: {
  collapsed: boolean;
  toggle: () => void;
  projects: Project[];
  activeId?: string;
  page: string;
  navigate: (page: "projects" | "search" | "archive") => void;
  openProject: (id: string) => void;
  newProject: () => void;
  settings: () => void;
  profile: () => void;
  user: { name: string; avatar?: string | null };
  preview: boolean;
}) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Columns3 size={20} />
        </span>
        <span className="sidebar-label">TaskHub</span>
        <span
          className="version sidebar-label"
          title="Testversion 0.1.0-preview.2"
        >
          0.1
        </span>
      </div>
      <button
        className="sidebar-toggle"
        aria-label={
          collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"
        }
        title={
          collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"
        }
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} />
        ) : (
          <>
            <PanelLeftClose size={17} />
          <span>{tr("Mehr Platz fürs Board")}</span>
          </>
        )}
      </button>
      <div className="workspace-label sidebar-label">{tr("DEIN ARBEITSPLATZ")}</div>
      <nav aria-label="Hauptnavigation">
        <button
          aria-label={tr("Projekte")}
          title={tr("Projekte")}
          className={page === "projects" ? "nav active" : "nav"}
          onClick={() => navigate("projects")}
        >
          <LayoutGrid size={17} />
          <span className="sidebar-label">{tr("Projekte")}</span>
        </button>
        <button
          className={page === "archive" ? "nav active" : "nav"}
          aria-label={tr("Archiv")}
          title={tr("Archiv")}
          onClick={() => navigate("archive")}
        >
          <Folder size={17} /><span className="sidebar-label">{tr("Archiv")}</span>
        </button>
        <button
          aria-label={tr("Suche")}
          title={tr("Suche")}
          className={page === "search" ? "nav active" : "nav"}
          onClick={() => navigate("search")}
        >
          <Search size={17} />
          <span className="sidebar-label">{tr("Suche")}</span>
        </button>
      </nav>
      <div className="section-label">
        <span className="sidebar-label">
          {tr("Projekte")} <small>{projects.length}</small>
        </span>
        <button
          aria-label={tr("Neues Projekt")}
          title={tr("Neues Projekt")}
          onClick={newProject}
        >
          <Plus size={16} />
        </button>
      </div>
      <nav className="project-list" aria-label="Projekte">
        {projects.map((p, i) => (
          <button
            key={p.id}
            className={
              p.id === activeId && page === "board"
                ? "nav active project"
                : "nav project"
            }
            title={p.name}
            aria-label={p.name}
            onClick={() => openProject(p.id)}
          >
            <Folder size={16} className={`color-${i % 4}`} />
            <span className="sidebar-label">{p.name}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div
          className="local-status"
          title={preview ? "Browser-Vorschau" : "Lokal auf deinem Gerät"}
        >
          <span className="status-dot" />
          <span className="sidebar-label">
            {preview ? "Browser-Vorschau" : "Lokal auf deinem Gerät"}
          </span>
        </div>
        <button
          className="nav"
          aria-label={tr("Einstellungen")}
          title={tr("Einstellungen")}
          onClick={settings}
        >
          <Settings size={17} />
          <span className="sidebar-label">{tr("Einstellungen")}</span>
        </button>
        <button className="profile" onClick={profile}>
          {user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.name.slice(0,1)}</span>}
          <div className="sidebar-label">
            {user.name}<small>{tr("Mein Profil")}</small>
          </div>
        </button>
      </div>
    </aside>
  );
}
