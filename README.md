# TaskHub 0.1 – erster sichtbarer Zwischenstand

Eine lokale Desktop-App mit Tauri 2, React, TypeScript und SQLite. Dunkles, minimalistisches Board für persönliche Projekte. **Dies ist der angeforderte erste Zwischenstand, noch nicht der gesamte Funktionsumfang der im Chat beschriebenen 0.1.**

## Enthalten

- Projektübersicht und dauerhafte linke Navigation; Projekte erstellen, umbenennen und nach Bestätigung löschen.
- Genau ein Board je Projekt; neue Projekte starten mit Offen, In Arbeit und Erledigt.
- Bis zu 15 frei benennbare Spalten, horizontales Scrollen, Drag & Drop, alternativ links/rechts im Spaltenmenü.
- Spalten einklappen, Breite zwischen 220 und 600 px durch Ziehen oder den Regler im Menü ändern.
- Aufgaben direkt in einer Spalte anlegen, Titel und Beschreibung bearbeiten, nach Bestätigung löschen.
- Karten innerhalb einer Spalte sortieren und zwischen Spalten verschieben; alternativ Spalte im Bearbeitungsdialog wählen.
- Board-Suche und Suche über alle Projekte nach Titel/Beschreibung. Zum Sortieren die Board-Suche leeren.
- SQLite-Persistenz für Inhalte, Reihenfolgen, Breiten, eingeklappte Spalten und das zuletzt geöffnete Projekt.
- Lokale Speicheranzeige und verständliche Fehlerzustände. Im einfachen Aufgabeneditor ausdrücklich **Speichern** wählen; Board-Aktionen werden unmittelbar gespeichert.

## Neu: Zieh-Animation und erste Checkliste

Karte am Titel oder Beschreibungstext greifen und ziehen: Sie hebt sich mit Schatten und leichter Neigung ab und bleibt am ursprünglichen Griffpunkt unter dem Cursor. Der Ausgangsplatz bleibt sichtbar; Escape bricht den Drag ab. Die Einstellung „Bewegung reduzieren“ des Betriebssystems wird respektiert.

Auf einer Karte **Checkliste hinzufügen** wählen. Die Liste lässt sich benennen, mit Einträgen ergänzen, abhaken und am Pfeil ein-/ausklappen. Zähler und Fortschrittsbalken bleiben eingeklappt sichtbar. Titeländerungen mit Enter oder Verlassen des Feldes übernehmen; Einträge mit Enter hinzufügen. Änderungen werden sofort gespeichert. Derzeit eine Checkliste pro Aufgabe, maximal 200 Einträge; noch keine Mehrfachlisten oder Sortierung der Einträge.

Bestehende Desktop-Datenbanken werden automatisch von Schema 1 auf Schema 2 erweitert. Der Browser-Vorschauspeicher bleibt kompatibel mit Aufgaben ohne Checkliste.

## Linux starten

Voraussetzungen: Node.js ab 22 (mit npm), aktuelles Rust Stable mit Cargo sowie die Tauri-Systembibliotheken. Für Ubuntu 24.04 / entsprechendes Linux Mint:

```bash
sudo apt update
sudo apt install build-essential curl wget file libssl-dev pkg-config \
  libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

Rust bei Bedarf über den offiziellen Installer von [rustup.rs](https://rustup.rs/) installieren. Details für weitere Distributionen: [Tauri-Voraussetzungen](https://v2.tauri.app/start/prerequisites/).

Im Verzeichnis `taskhub`:

```bash
npm ci
npm run tauri dev
```

Das öffnet das echte Desktop-Fenster und verwendet SQLite. Für ein Installationspaket:

```bash
npm run tauri build -- --bundles deb,appimage
```

Ausgaben liegen unter `target/release/bundle/` im Projekt. Der Build lädt anfangs Entwicklungspakete; die fertige App benötigt kein Netzwerk.

## Windows

Node.js ab 22, Rust Stable mit MSVC-Toolchain, Microsoft C++ Build Tools (Desktopentwicklung mit C++) und WebView2 installieren, siehe die offiziellen Tauri-Voraussetzungen. Dann in PowerShell im Projekt:

```powershell
npm ci
npm run tauri dev
npm run tauri build -- --bundles nsis
```

Unter Windows bauen; dies ist keine Linux-zu-Windows-Cross-Compilation. SQLite wird mitkompiliert. Windows wurde in dieser Umgebung nicht ausgeführt.

## Vorschau auf diesem Rechner ohne npm starten

Solange die vorhandenen Projektpakete und die gebündelte Node.js-Laufzeit von Codex verfügbar sind, genügt im Projektordner:

```bash
./start-preview.sh
```

Dann http://localhost:1420 öffnen und das Terminal geöffnet lassen. Mit Strg+C beenden. Das Skript verwendet eine reguläre Node.js-Installation, falls vorhanden, andernfalls die auf diesem Rechner vorhandene Codex-Laufzeit. Für eine portable Entwicklungsumgebung weiterhin Node.js und npm wie oben beschrieben installieren.

## Nur die Oberfläche ansehen

```bash
npm ci
npm run dev
```

[Lokale Vorschau](http://localhost:1420) öffnen. Die **deutlich gekennzeichnete Browser-Vorschau** verwendet einen separaten Browserspeicher, keine SQLite-Datenbank. Sie eignet sich für UI-Tests und ist noch keine produktive Web-Version. Desktop-Daten und Vorschau-Daten werden nicht synchronisiert. Eine neue Desktop-Installation beginnt leer; es werden keine Beispieldaten in deine Datenbank geschrieben.

## Daten

Die App nutzt den plattformgerechten lokalen Datenordner, statt einen Linux-Pfad fest einzubauen:

- Linux normalerweise `~/.local/share/de.taskhub.desktop/taskhub.db` (abhängig von XDG_DATA_HOME).
- Windows im lokalen App-Datenordner des Nutzers unter `de.taskhub.desktop`.
- Der tatsächlich verwendete Pfad steht in **Einstellungen**.

Änderungen sind erst bei **Lokal gespeichert** bestätigt. Bei Schreibfehlern bleibt der zuletzt bestätigte Zustand sichtbar; weitere Schreibvorgänge stoppen. Fehlgeschlagene Eingaben müssen nach Behebung und Neuladen erneut ausgeführt werden. Mehrere Desktop-Instanzen erkennen konkurrierende Schreibvorgänge über eine Revision und fordern zum Neuladen auf.

Eine reguläre Backup-Oberfläche und ein Papierkorb sind noch nicht implementiert. Vor der Erweiterung auf Datenbankschema 4 wird automatisch eine Migrationssicherung angelegt. Für eine manuelle Sicherung alle TaskHub-Instanzen schließen und den **gesamten Datenordner** kopieren, einschließlich eventuell vorhandener `.db-wal`-/`.db-shm`-Dateien. Nicht bei laufender App nur die Hauptdatei kopieren. Löschen entfernt die bestätigten Objekte dauerhaft.

## Tests und Dokumentation

```bash
npm run build
npm test
cargo test -p taskhub-core --locked
```

- [Architektur und nächste Ausbauschritte](docs/ARCHITECTURE.md)
- [Prüfbericht und verbleibende Prüfungen](docs/TESTING.md)

Der SQLite-Kern ist unabhängig von Tauri testbar. `package-lock.json` und `Cargo.lock` sind enthalten. Eine fertige Linux-Binärdatei wird in diesem Zwischenstand nicht mitgeliefert, weil die Ausführungsumgebung keine GLib-/GTK-/WebKit-Entwicklungsbibliotheken besitzt.

## Neuer Teststand: Focus und Board

Bedienung, Datenmigration und Rückkehr zum bisherigen Stand: [Focus-Testanleitung](docs/FOCUS-PREVIEW.md).
