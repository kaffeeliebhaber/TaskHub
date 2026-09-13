import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type User } from "../data/account";
import { Dialog } from "./Dialog";

export function AccountGate({ children }: { children: (user: User, setUser: (user: User | null) => void) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [name, setName] = useState("Admin"), [password, setPassword] = useState(""), [repeatPassword, setRepeatPassword] = useState(""), [setupRequired, setSetupRequired] = useState<boolean | null>(null), [error, setError] = useState("");
  useEffect(() => { void api<User>("me").then(setUser).catch(() => undefined); void api<{ required: boolean }>("setup").then(data => setSetupRequired(data.required)).catch(() => setSetupRequired(false)); }, []);
  if (user) return <>{children(user, setUser)}</>;
  if (setupRequired === null) return <main className="login-page"><p>TaskHub wird vorbereitet …</p></main>;
  if (setupRequired) return <main className="login-page"><form onSubmit={async event => { event.preventDefault(); setError(""); if (password !== repeatPassword) return setError("Die Passwörter stimmen nicht überein."); try { setUser(await api<User>("setup", { password })); setPassword(""); setRepeatPassword(""); } catch (error) { setError(String(error)); } }}>
    <span className="brand-mark">TH</span><h1>TaskHub einrichten</h1><p>Lege das Passwort für den lokalen Admin fest.</p>
    <label>Benutzer<input value="Admin" readOnly /></label>
    <label>Passwort<input type="password" minLength={4} value={password} onChange={event => setPassword(event.target.value)} required /></label>
    <label>Passwort wiederholen<input type="password" minLength={4} value={repeatPassword} onChange={event => setRepeatPassword(event.target.value)} required /></label>{error && <p role="alert" className="danger">{error}</p>}<button className="primary">TaskHub starten</button>
  </form></main>;
  return <main className="login-page"><form onSubmit={async event => { event.preventDefault(); setError(""); try { setUser(await api<User>("login", { name, password })); setPassword(""); } catch (error) { setError(String(error)); } }}>
    <span className="brand-mark">TH</span><h1>Willkommen bei TaskHub</h1><p>Deine Projekte. Dein Arbeitsplatz.</p>
    <label>Benutzer<input required value={name} onChange={event => setName(event.target.value)} /></label>
    <label>Passwort<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p role="alert" className="danger">{error}</p>}<button className="primary">Anmelden</button>
  </form></main>;
}

type MemberData = { members: Array<User & { role: "owner" | "editor" }>; users: User[]; suggested: User[] };
export function Members({ boardId, user, close }: { boardId: string; user: User; close: () => void }) {
  const [data, setData] = useState<MemberData | null>(null), [tab, setTab] = useState<"all" | "suggested" | "new">("all"), [query, setQuery] = useState(""), [name, setName] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState("");
  const refresh = () => api<MemberData>("members", { boardId }).then(setData).catch(error => setError(String(error)));
  useEffect(() => { void refresh(); }, [boardId]);
  const candidates = useMemo(() => (tab === "suggested" ? data?.suggested ?? [] : data?.users ?? []).filter(candidate => !data?.members.some(member => member.id === candidate.id) && candidate.name.toLowerCase().includes(query.toLowerCase())), [data, query, tab]);
  const owner = data?.members.some(member => member.id === user.id && member.role === "owner");
  return <Dialog title="Board-Mitglieder" close={close}>
    <div className="member-tabs"><button className={tab === "all" ? "primary" : ""} onClick={() => setTab("all")}>Alle Benutzer</button><button className={tab === "suggested" ? "primary" : ""} onClick={() => setTab("suggested")}>Vorschläge</button>{owner && <button className={tab === "new" ? "primary" : ""} onClick={() => setTab("new")}>Neuer Benutzer</button>}</div>
    <div className="member-list">{data?.members.map(member => <div className="member-row" key={member.id}><span className="member-avatar">{member.name.slice(0, 1)}</span><span>{member.name}<small>{member.role === "owner" ? "Eigentümer" : "Mitglied"}</small></span></div>)}</div>
    {owner && tab !== "new" && <><label className="member-search">Mitglieder suchen<input value={query} placeholder="Name eingeben …" onChange={event => setQuery(event.target.value)} /></label>{tab === "suggested" && <p className="muted">Personen, mit denen du bereits an anderen Boards arbeitest.</p>}<div className="member-candidates">{candidates.map(candidate => <button key={candidate.id} onClick={() => void api<MemberData>("invite", { boardId, userId: candidate.id }).then(setData)}><span>{candidate.name}</span><span>Hinzufügen</span></button>)}{!candidates.length && <p className="muted">Keine passenden Vorschläge.</p>}</div></>}
    {owner && tab === "new" && <form className="member-create" onSubmit={async event => { event.preventDefault(); setError(""); try { const created = await api<User>("users", { name, password }); setName(""); setPassword(""); setData(await api<MemberData>("invite", { boardId, userId: created.id })); setTab("all"); } catch (error) { setError(String(error)); } }}><p className="muted">Der neue Benutzer wird direkt diesem Board hinzugefügt.</p><label>Name<input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label><label>Startpasswort<input required minLength={4} type="password" value={password} onChange={event => setPassword(event.target.value)} /></label><button className="primary">Benutzer anlegen und hinzufügen</button></form>}
    {data && !owner && <p className="muted">Nur der Eigentümer dieses Boards kann weitere Benutzer anlegen oder einladen.</p>}
    {error && <p className="danger" role="alert">{error}</p>}
  </Dialog>;
}

export function Profile({ user, close, setUser }: { user: User; close: () => void; setUser: (user: User | null) => void }) {
  const [tab, setTab] = useState<"profile" | "security">("profile"), [name, setName] = useState(user.name), [email, setEmail] = useState(user.email ?? ""), [avatar, setAvatar] = useState(user.avatar || ""), [currentPassword, setCurrent] = useState(""), [newPassword, setNew] = useState(""), [repeatPassword, setRepeat] = useState(""), [error, setError] = useState(""), [saved, setSaved] = useState("");
  const selectImage = (file?: File) => { if (!file) return; if (file.size > 2 * 1024 * 1024) return setError("Das Bild darf maximal 2 MB groß sein."); const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); };
  const saveProfile = async () => { setError(""); const next = await api<User>("profile", { name, email, avatar: avatar || null }); setUser(next); setSaved("Profil gespeichert."); };
  const savePassword = async () => { setError(""); if (newPassword !== repeatPassword) throw Error("Die neuen Passwörter stimmen nicht überein."); await api<User>("profile", { currentPassword, newPassword }); setUser(null); };
  return <Dialog title="Mein Profil" close={close}><div className="profile-tabs"><button className={tab === "profile" ? "primary" : ""} onClick={() => setTab("profile")}>Profil</button><button className={tab === "security" ? "primary" : ""} onClick={() => setTab("security")}>Sicherheit</button></div>
    {tab === "profile" ? <form className="profile-form" onSubmit={event => { event.preventDefault(); void saveProfile().catch(error => setError(String(error))); }}>
      <div className="avatar-editor">{avatar ? <img className="profile-picture" src={avatar} alt="Profilbild" /> : <span className="profile-fallback">{name.slice(0, 1).toUpperCase()}</span>}<div><label className="upload-button">Profilbild auswählen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => selectImage(event.target.files?.[0])} /></label>{avatar && <button type="button" className="text-button" onClick={() => setAvatar("")}>Profilbild entfernen</button>}<small>PNG, JPG oder WebP · maximal 2 MB</small></div></div>
      <label>Name<input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label><label>E-Mail-Adresse <small>optional</small><input type="email" value={email} placeholder="name@beispiel.de" onChange={event => setEmail(event.target.value)} /></label><div className="dialog-actions"><button type="button" onClick={async () => { await api("logout", {}); setUser(null); }}>Abmelden</button><button className="primary">Profil speichern</button></div>
    </form> : <form className="profile-form" onSubmit={event => { event.preventDefault(); void savePassword().catch(error => setError(String(error))); }}><h3>Passwort ändern</h3><p className="muted">Nach dem Speichern meldest du dich mit dem neuen Passwort wieder an.</p><label>Aktuelles Passwort<input required type="password" value={currentPassword} onChange={event => setCurrent(event.target.value)} /></label><label>Neues Passwort<input required minLength={4} type="password" value={newPassword} onChange={event => setNew(event.target.value)} /></label><label>Neues Passwort wiederholen<input required minLength={4} type="password" value={repeatPassword} onChange={event => setRepeat(event.target.value)} /></label><div className="dialog-actions"><button className="primary">Passwort speichern</button></div></form>}
    {saved && <p className="success">{saved}</p>}{error && <p className="danger" role="alert">{error}</p>}
  </Dialog>;
}
