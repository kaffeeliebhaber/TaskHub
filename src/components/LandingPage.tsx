import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Columns3,
  ListChecks,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import "../landing.css";

const enterApp = () => {
  window.location.assign("/app");
};

function ProductBoard() {
  return (
    <div className="landing-product" aria-label="Vorschau eines TaskHub Boards">
      <div className="product-sidebar">
        <div className="product-brand">
          <span>TH</span>
          <strong>TaskHub</strong>
        </div>
        <div className="product-nav active">
          <Columns3 size={13} /> Projekte
        </div>
        <div className="product-nav">
          <Search size={13} /> Suche
        </div>
        <small>PROJEKTE</small>
        <div className="product-project active">
          <i /> Website Launch
        </div>
        <div className="product-project">
          <i /> Produktideen
        </div>
        <div className="product-project">
          <i /> Persönlich
        </div>
      </div>
      <div className="product-main">
        <div className="product-topline">
          <span>Mein Arbeitsplatz / Website Launch</span>
          <span>
            <Check size={11} /> Lokal gespeichert
          </span>
        </div>
        <div className="product-title">
          <small>PROJEKTBOARD</small>
          <h3>Website Launch</h3>
          <p>Ein klarer Kopf beginnt mit einem guten Überblick.</p>
        </div>
        <div className="product-board">
          <div className="mini-column">
            <header>
              <i className="violet" /> Ideen <span>3</span>
            </header>
            <article>
              <b>Landingpage Konzept</b>
              <em>HOCH</em>
              <p>Story, Nutzen und visuelle Richtung definieren.</p>
            </article>
            <article>
              <b>Farbwelt finalisieren</b>
              <em className="low">NIEDRIG</em>
            </article>
            <article>
              <b>Mobile Navigation</b>
            </article>
          </div>
          <div className="mini-column raised">
            <header>
              <i className="gold" /> In Arbeit <span>2</span>
            </header>
            <article className="glow">
              <b>Hero-Bereich gestalten</b>
              <em>HOCH</em>
              <p>Klare Botschaft, starke Vorschau, ein Ziel.</p>
              <div className="mini-progress">
                <span style={{ width: "67%" }} />
              </div>
              <small>
                <ListChecks size={10} /> 2 / 3
              </small>
            </article>
            <article>
              <b>Produkttexte schreiben</b>
              <em className="medium">MITTEL</em>
            </article>
          </div>
          <div className="mini-column">
            <header>
              <i className="green" /> Erledigt <span>2</span>
            </header>
            <article className="done">
              <b>
                <CheckCircle2 size={12} /> Zielgruppe festlegen
              </b>
            </article>
            <article className="done">
              <b>
                <CheckCircle2 size={12} /> Domain sichern
              </b>
            </article>
          </div>
        </div>
      </div>
      <div className="cursor-note">
        <span>↗</span> Alles im Fluss
      </div>
    </div>
  );
}

function FocusPreview() {
  return (
    <div className="focus-preview-card">
      <div className="focus-orbit orbit-one" />
      <div className="focus-orbit orbit-two" />
      <div className="focus-preview-top">
        <span>
          <Zap size={13} /> FOCUS SESSION
        </span>
        <X size={15} />
      </div>
      <div className="focus-preview-content">
        <small>JETZT KONZENTRIEREN</small>
        <strong>24:36</strong>
        <p>Hero-Bereich gestalten</p>
        <div className="focus-controls">
          <button aria-label="Timer pausieren">Ⅱ</button>
          <button aria-label="Timer zurücksetzen">
            <TimerReset size={15} />
          </button>
        </div>
      </div>
      <div className="focus-checklist">
        <span>
          <Circle size={12} /> Headline formulieren
        </span>
        <span className="checked">
          <CheckCircle2 size={12} /> Vorschau aufbauen
        </span>
        <span>
          <Circle size={12} /> Mobile Ansicht prüfen
        </span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("landing-document");
    return () => document.documentElement.classList.remove("landing-document");
  }, []);
  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Hauptnavigation">
        <a className="landing-logo" href="#top" aria-label="TaskHub Startseite">
          <span>
            <Columns3 size={17} />
          </span>
          TaskHub<small>0.1</small>
        </a>
        <div className={`landing-links ${menuOpen ? "open" : ""}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#focus" onClick={() => setMenuOpen(false)}>
            Focus
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            So funktioniert’s
          </a>
          <button className="landing-ghost" onClick={enterApp}>
            Dashboard öffnen <ArrowRight size={14} />
          </button>
        </div>
        <button
          className="landing-menu"
          aria-label="Navigation öffnen"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      <main id="top">
        <section className="landing-hero">
          <div className="hero-noise" />
          <div className="hero-copy">
            <div className="landing-pill">
              <Sparkles size={13} /> DEIN SYSTEM. DEIN TEMPO.
            </div>
            <h1>
              Weniger verwalten.
              <br />
              <span>Mehr erledigen.</span>
            </h1>
            <p>
              TaskHub bringt Projekte, Aufgaben und Fokus an einen Ort. Klar
              genug für deinen Kopf. Flexibel genug für deinen Alltag.
            </p>
            <div className="hero-actions">
              <button className="landing-primary" onClick={enterApp}>
                TaskHub ausprobieren <ArrowRight size={17} />
              </button>
              <a href="#features">
                Entdecke die Features <ChevronRight size={15} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={15} /> Ohne Anmeldung
              </span>
              <span>
                <ShieldCheck size={15} /> Lokal gespeichert
              </span>
              <span>
                <Zap size={15} /> Sofort startklar
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-glow" />
            <ProductBoard />
            <div className="hero-arrow" aria-hidden="true">
              <span>
                Dein Board.
                <br />
                Genau so, wie du denkst.
              </span>
              <svg viewBox="0 0 150 75">
                <path d="M4 7 C52 2, 70 58, 135 53" />
                <path d="m122 43 14 10-15 7" />
              </svg>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>ENTWICKELT FÜR</span>
          <div>Solopreneure</div>
          <i />
          <div>Kreative Köpfe</div>
          <i />
          <div>Private Projekte</div>
          <i />
          <div>Deep Work</div>
        </section>

        <section className="landing-section feature-section" id="features">
          <div className="section-heading">
            <small>KLARHEIT STATT CHAOS</small>
            <h2>
              Alles, was du brauchst.
              <br />
              <span>Nichts, was dich ablenkt.</span>
            </h2>
            <p>
              TaskHub hält die wichtigen Dinge sichtbar und den Rest angenehm im
              Hintergrund.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-large">
              <div className="feature-icon">
                <Columns3 />
              </div>
              <small>FLEXIBLE BOARDS</small>
              <h3>Dein Workflow passt sich dir an.</h3>
              <p>
                Erstelle Spalten, ändere ihre Breite und verschiebe Karten und
                ganze Listen mit einer natürlichen Drag-and-Drop-Bewegung.
              </p>
              <div className="feature-board-demo">
                <span>IDEEN</span>
                <span>IN ARBEIT</span>
                <span>ERLEDIGT</span>
                <i className="moving-card">
                  Launch planen <ArrowRight size={11} />
                </i>
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-icon warm">
                <ListChecks />
              </div>
              <small>AUFGABEN MIT TIEFE</small>
              <h3>Vom Gedanken zum nächsten Schritt.</h3>
              <p>
                Beschreibungen, Prioritäten, Notizen und Checklisten geben jeder
                Aufgabe genau so viel Struktur wie nötig.
              </p>
              <div className="check-demo">
                <span className="complete">
                  <Check /> Inhalte sammeln
                </span>
                <span className="complete">
                  <Check /> Struktur festlegen
                </span>
                <span>
                  <i /> Details ausarbeiten
                </span>
                <div>
                  <b style={{ width: "66%" }} />
                </div>
                <small>2 von 3 erledigt</small>
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-icon green">
                <Search />
              </div>
              <small>SCHNELL GEFUNDEN</small>
              <h3>Behalte den Überblick.</h3>
              <p>
                Durchsuche alle Projekte und filtere Aufgaben nach ihrer
                Priorität. In Sekunden beim richtigen nächsten Schritt.
              </p>
              <div className="search-demo">
                <Search size={14} />
                <span>Website</span>
                <kbd>⌘ K</kbd>
              </div>
              <div className="result-demo">
                <i /> Landingpage Konzept <em>HOCH</em>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-section focus-section" id="focus">
          <div className="focus-visual-wrap">
            <div className="focus-backdrop" />
            <FocusPreview />
            <div className="focus-callout">
              <svg viewBox="0 0 110 70">
                <path d="M104 8 C50 5, 69 54, 10 58" />
                <path d="m22 48-13 10 14 6" />
              </svg>
              <span>
                Eine Aufgabe.
                <br />
                Deine volle Aufmerksamkeit.
              </span>
            </div>
          </div>
          <div className="focus-copy">
            <small>FOCUS TIMER</small>
            <h2>
              Wenn es zählt,
              <br />
              <span>wird alles andere leise.</span>
            </h2>
            <p>
              Ziehe eine Aufgabe direkt in den Focus Timer, stelle deine Zeit
              ein und arbeite ohne Ablenkung. Notizen und Checklisten bleiben
              mit der Aufgabe verbunden.
            </p>
            <ul>
              <li>
                <Clock3 /> Frei einstellbare Focus-Zeit
              </li>
              <li>
                <ListChecks /> Checkliste direkt im Focus-Modus
              </li>
              <li>
                <Sparkles /> Notizen automatisch an der Aufgabe
              </li>
            </ul>
            <button className="landing-text-button" onClick={enterApp}>
              Focus-Modus testen <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <section className="landing-section workflow-section" id="workflow">
          <div className="section-heading centered">
            <small>SO EINFACH KANN PRODUKTIVITÄT SEIN</small>
            <h2>Von der Idee zum Ergebnis.</h2>
          </div>
          <div className="workflow-grid">
            <article>
              <b>01</b>
              <span>
                <Sparkles />
              </span>
              <h3>Festhalten</h3>
              <p>
                Erstelle in Sekunden eine Aufgabe, bevor der Gedanke wieder weg
                ist.
              </p>
            </article>
            <ArrowRight className="workflow-arrow" />
            <article>
              <b>02</b>
              <span>
                <Columns3 />
              </span>
              <h3>Ordnen</h3>
              <p>
                Bring Aufgaben per Drag & Drop in deinen persönlichen Workflow.
              </p>
            </article>
            <ArrowRight className="workflow-arrow" />
            <article>
              <b>03</b>
              <span>
                <Clock3 />
              </span>
              <h3>Fokussieren</h3>
              <p>
                Wähle eine Aufgabe und gib ihr deine ungeteilte Aufmerksamkeit.
              </p>
            </article>
            <ArrowRight className="workflow-arrow" />
            <article>
              <b>04</b>
              <span>
                <CheckCircle2 />
              </span>
              <h3>Abschließen</h3>
              <p>
                Sieh deinen Fortschritt und schaffe Raum für das, was als
                Nächstes kommt.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-cta">
          <div className="cta-glow" />
          <small>BEREIT FÜR EINEN KLAREN KOPF?</small>
          <h2>
            Deine Projekte warten.
            <br />
            <span>Mach den nächsten Schritt.</span>
          </h2>
          <p>
            Öffne die aktuelle Vorschau direkt und entdecke TaskHub ohne
            Anmeldung.
          </p>
          <button className="landing-primary" onClick={enterApp}>
            Dashboard jetzt öffnen <ArrowRight size={17} />
          </button>
          <div>
            <Check size={13} /> Kostenlos testen <i /> Keine Anmeldung <i />{" "}
            Daten bleiben lokal
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="landing-logo" href="#top">
          <span>
            <Columns3 size={16} />
          </span>
          TaskHub
        </a>
        <p>Dein Tempo. Dein System.</p>
        <small>© 2026 TaskHub · Version 0.1</small>
      </footer>
    </div>
  );
}
