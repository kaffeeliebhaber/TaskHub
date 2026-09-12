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
  archive,
  profile,
  user,
  preview,
}: {
  collapsed: boolean;
  toggle: () => void;
  projects: Project[];
  activeId?: string;
  page: string;
  navigate: (page: "projects" | "search") => void;
  openProject: (id: string) => void;
  newProject: () => void;
  settings: () => void;
  archive: () => void;
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
            <span>Mehr Platz fürs Board</span>
          </>
        )}
      </button>
      <div className="workspace-label sidebar-label">DEIN ARBEITSPLATZ</div>
      <nav aria-label="Hauptnavigation">
        <button
          aria-label="Projekte"
          title="Projekte"
          className={page === "projects" ? "nav active" : "nav"}
          onClick={() => navigate("projects")}
        >
          <LayoutGrid size={17} />
          <span className="sidebar-label">Projekte</span>
        </button>
        <button className="nav" aria-label="Archiv" title="Archiv" onClick={archive}>
          <Folder size={17} /><span className="sidebar-label">Archiv</span>
        </button>
        <button
          aria-label="Suche"
          title="Suche"
          className={page === "search" ? "nav active" : "nav"}
          onClick={() => navigate("search")}
        >
          <Search size={17} />
          <span className="sidebar-label">Suche</span>
        </button>
      </nav>
      <div className="section-label">
        <span className="sidebar-label">
          Projekte <small>{projects.length}</small>
        </span>
        <button
          aria-label="Neues Projekt"
          title="Neues Projekt"
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
          aria-label="Einstellungen"
          title="Einstellungen"
          onClick={settings}
        >
          <Settings size={17} />
          <span className="sidebar-label">Einstellungen</span>
        </button>
        <button className="profile" onClick={profile}>
          {user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.name.slice(0,1)}</span>}
          <div className="sidebar-label">
            {user.name}<small>Mein Profil</small>
          </div>
        </button>
      </div>
    </aside>
  );
}
