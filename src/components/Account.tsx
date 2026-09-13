import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type User } from "../data/account";
import { Dialog } from "./Dialog";

export function AccountGate({ children }: { children: (user: User, setUser: (user: User | null) => void) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [name, setName] = useState("Sascha"), [password, setPassword] = useState(""), [error, setError] = useState("");
  useEffect(() => { void api<User>("me").then(setUser).catch(() => undefined); }, []);
  if (user) return <>{children(user, setUser)}</>;
  return <main className="login-page"><form onSubmit={async event => { event.preventDefault(); setError(""); try { setUser(await api<User>("login", { name, password })); setPassword(""); } catch (error) { setError(String(error)); } }}>
    <span className="brand-mark">TH</span><h1>Willkommen bei TaskHub</h1><p>Deine Projekte. Dein Arbeitsplatz.</p>
    <label>Benutzer<select value={name} onChange={event => setName(event.target.value)}><option>Sascha</option><option>Jessica</option></select></label>
    <label>Passwort<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p role="alert" className="danger">{error}</p>}<button className="primary">Anmelden</button>
  </form></main>;
}

type MemberData = { members: Array<User & { role: "owner" | "editor" }>; users: User[]; suggested: User[] };
export function Members({ boardId, user, close }: { boardId: string; user: User; close: () => void }) {
  const [data, setData] = useState<MemberData | null>(null), [tab, setTab] = useState<"all" | "suggested" | "new">("all"), [query, setQuery] = useState(""), [name, setName] = useState(""), [password, setPassword] = useState("1234"), [error, setError] = useState("");
  const refresh = () => api<MemberData>("members", { boardId }).then(setData).catch(error => setError(String(error)));
  useEffect(() => { void refresh(); }, [boardId]);
  const candidates = useMemo(() => (tab === "suggested" ? data?.suggested ?? [] : data?.users ?? []).filter(candidate => !data?.members.some(member => member.id === candidate.id) && candidate.name.toLowerCase().includes(query.toLowerCase())), [data, query, tab]);
  const owner = data?.members.some(member => member.id === user.id && member.role === "owner");
  return <Dialog title="Board-Mitglieder" close={close}>
    <div className="member-tabs"><button className={tab === "all" ? "primary" : ""} onClick={() => setTab("all")}>Alle Benutzer</button><button className={tab === "suggested" ? "primary" : ""} onClick={() => setTab("suggested")}>Vorschläge</button><button className={tab === "new" ? "primary" : ""} onClick={() => setTab("new")}>Neuer Benutzer</button></div>
    <div className="member-list">{data?.members.map(member => <div className="member-row" key={member.id}><span className="member-avatar">{member.name.slice(0, 1)}</span><span>{member.name}<small>{member.role === "owner" ? "Eigentümer" : "Mitglied"}</small></span></div>)}</div>
    {owner && tab !== "new" && <><label className="member-search">Mitglieder suchen<input value={query} placeholder="Name eingeben …" onChange={event => setQuery(event.target.value)} /></label>{tab === "suggested" && <p className="muted">Personen, mit denen du bereits an anderen Boards arbeitest.</p>}<div className="member-candidates">{candidates.map(candidate => <button key={candidate.id} onClick={() => void api<MemberData>("invite", { boardId, userId: candidate.id }).then(setData)}><span>{candidate.name}</span><span>Hinzufügen</span></button>)}{!candidates.length && <p className="muted">Keine passenden Vorschläge.</p>}</div></>}
    {owner && tab === "new" && <form className="member-create" onSubmit={async event => { event.preventDefault(); setError(""); try { const created = await api<User>("users", { name, password }); setName(""); setPassword("1234"); setData(await api<MemberData>("invite", { boardId, userId: created.id })); setTab("all"); } catch (error) { setError(String(error)); } }}><p className="muted">Der neue Benutzer wird direkt diesem Board hinzugefügt.</p><label>Name<input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label><label>Startpasswort<input required minLength={4} type="password" value={password} onChange={event => setPassword(event.target.value)} /></label><button className="primary">Benutzer anlegen und hinzufügen</button></form>}
    {error && <p className="danger" role="alert">{error}</p>}
  </Dialog>;
}

export function Profile({ user, close, setUser }: { user: User; close: () => void; setUser: (user: User | null) => void }) {
  const [currentPassword, setCurrent] = useState(""), [newPassword, setNew] = useState(""), [avatar, setAvatar] = useState(user.avatar || ""), [error, setError] = useState("");
  return <Dialog title="Mein Profil" close={close}><form onSubmit={async event => { event.preventDefault(); try { const next = await api<User>("profile", { avatar: avatar || null, currentPassword, newPassword }); if (newPassword) setUser(null); else { setUser(next); close(); } } catch (error) { setError(String(error)); } }}>
    {avatar && <img className="profile-picture" src={avatar} alt="Profilbild" />}<label>Profilbild<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file && file.size < 2 * 1024 * 1024) { const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); } }} /></label>
    <label>Aktuelles Passwort<input type="password" value={currentPassword} onChange={event => setCurrent(event.target.value)} /></label><label>Neues Passwort<input type="password" value={newPassword} onChange={event => setNew(event.target.value)} /></label>{error && <p className="danger">{error}</p>}<div className="dialog-actions"><button type="button" onClick={async () => { await api("logout", {}); setUser(null); }}>Abmelden</button><button className="primary">Speichern</button></div>
  </form></Dialog>;
}
