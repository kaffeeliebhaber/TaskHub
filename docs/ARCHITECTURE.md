# Architektur

## Grenzen

`React-Komponenten → WorkspaceStore → WorkspaceRepository → Tauri Commands → taskhub-core → SQLite`

- `src/domain/model.ts`: UI-unabhängige Datenobjekte und Operationen für Erstellen, Sortieren, Verschieben, Löschen und Validieren.
- `src/data/store.ts`: serialisierte Änderungen. Jede Operation arbeitet auf der neuesten bestätigten Revision. Die Oberfläche übernimmt einen Zustand erst nach erfolgreichem Speichern. Fehler bleiben sichtbar, statt auf einen anderen Speicher auszuweichen.
- `src/data/repository.ts`: austauschbarer Speichervertrag. Desktop verwendet drei eng begrenzte Tauri-Befehle. Nur außerhalb von Tauri wird ein expliziter Browser-Vorschauadapter gewählt.
- `src/App.tsx`: Navigation und Board. `src/components/Editors.tsx`: Eingaben und einfacher Task-Editor. `Dialog.tsx`: natives HTML-Dialogelement mit Fokusbegrenzung und Escape.
- `src-tauri`: Fenster, plattformgerechter App-Datenpfad, IPC. Kein allgemeiner Dateisystem-, Shell- oder SQL-Zugriff aus dem Frontend.
- `crates/taskhub-core`: eigenständige Rust-Bibliothek mit Datentypen, Validierung, Migration, Transaktionen und SQLite.

## Datenmodell und Persistenz

UUIDs aus Web Crypto; Projekte, Boards, Spalten und Aufgaben besitzen stabile IDs. `boards.project_id` ist eindeutig, jede Spalte gehört einem Board, jeder Task einer Spalte. Foreign Keys verhindern verwaiste Objekte. Die Servervalidierung prüft zusätzlich exakt ein Board pro Projekt und höchstens 15 Spalten. Spalten haben keine fest eingebaute Statusbedeutung. Zeitangaben werden in UTC als ISO-Text geschrieben.

Schema-Versionierung über `PRAGMA user_version`. Die erste Migration läuft atomar; Datenbanken aus einer neueren App werden zurückgewiesen. Fremdschlüssel, WAL und ein Busy-Timeout werden beim Öffnen aktiviert. Laden nutzt eine Lesetransaktion für eine konsistente Momentaufnahme. Speichern nutzt `BEGIN IMMEDIATE`, prüft die erwartete Revision und aktualisiert alle Änderungen atomar. Upserts aktualisieren vorhandene Datensätze, statt sie per REPLACE zu löschen. Nur nicht mehr enthaltene IDs werden entfernt; zukünftige Kindtabellen bleiben bei normalen Updates bestehen.

Für den ersten lokalen Einzelplatz-Meilenstein wird der gesamte Arbeitsstand zwischen UI und Backend übertragen. Das ist bewusst einfach, kostet bei großen Datenbeständen aber O(N) pro Änderung. Vor Synchronisation, Mehrbenutzerbetrieb oder sehr großen Boards den Repository-Vertrag um gezielte Commands und paginierte Abfragen erweitern. Eine Web-API braucht eigene Authentifizierung, serverseitige Validierung und Konfliktbehandlung; der Vorschauadapter erfüllt diese Aufgaben nicht.

## Erweiterungsplan

- **Task-Popup:** einfachen Editor durch Inhalt/Eigenschaften-Ansicht ersetzen; Entwurfszustand mit entprelltem Autosave und Flush beim Schließen. Aktuell explizites Speichern, Abbrechen verwirft Entwurf.
- **Labels:** eigene `labels`- und `task_labels`-Tabellen mit Foreign Keys; Datenzugriff über Repository erweitern, keine SQL-Aufrufe aus Komponenten.
- **Checklisten/Gruppen:** benannte Abschnitte mit sortierten Einträgen; Checkbox optional je Abschnittstyp; Präsentationszustand getrennt von Erledigtstatus halten.
- **Termine/Priorität:** additive Migration für Task-Eigenschaften. Filter als reine Selektoren, keine Veränderung der manuellen Reihenfolge. Termine mit klarer Datums-/Zeitzonen-Semantik.
- **Board-/Karteneinstellungen und Regeln:** versionierte Einstellungsobjekte, standardmäßig keine Einschränkungen. Regeln bei Verschiebeoperationen im Backend prüfen, nicht nur in Drop-Zonen.
- **Backups:** SQLite Backup API oder `VACUUM INTO`, plus Anhänge und Manifest; atomare Sicherung und separat geprüfter Restore. Kein simples Kopieren einer offenen WAL-Datenbank.
- **Bug-Board:** zunächst Board-Vorlage, später optionale typisierte Bug-Eigenschaften auf demselben Taskmodell. Kein zweites konkurrierendes Board-System.
- **Web:** HTTP-Repository statt Desktop-Repository, Backend-Dienst mit denselben fachlichen Invarianten. Authentifizierung und Synchronisation separat entwerfen.

Absichtlich noch nicht enthalten: umfangreiche Task-Detailleiste, Rich Text, Labels, mehrere Checklisten je Task, Gruppen, Termine, Anhänge, Kommentare, Archiv/Papierkorb, automatische Backups und Regeln. Auch native Menüleiste, Projektduplikation und Tastatur-Sortierung von Karten sind noch Ausbaupunkte. Karten können bereits per Dialog ohne Mausziehen die Spalte wechseln; Spalten werden am vollständigen Kopf animiert gezogen.

## Betrieb

Spalten verwenden HTML5-Drag-and-Drop; Karten verwenden Pointer Capture mit sichtbaren Drop-Zielen, damit Ziehen und Öffnen auf derselben Fläche zuverlässig getrennt werden. Tauri-Datei-Drop-Interception ist abgeschaltet (`dragDropEnabled: false`). Linux WebKitGTK und Windows WebView2 müssen trotzdem jeweils praktisch getestet werden. Das Fenster nutzt die normale Betriebssystem-Titelleiste. Kein Cloud-Zugang, keine Telemetrie, keine externen Fonts. CSP begrenzt Produktionsinhalte auf die App und IPC.

## UI-Erweiterung: Checkliste und Drag-Vorschau

`TaskCard.tsx` kapselt Pointer Capture, Drag-Vorschau und Klickverhalten. Die Vorschau wird per React-Portal an den Body gehängt, damit Spalten sie nicht abschneiden; sie ignoriert Zeigereingaben. Die Position verwendet den tatsächlichen Griffpunkt statt die Karte am Cursor zu zentrieren. Aufgabenzuordnung wird erst beim Loslassen geändert; Escape, Pointer-Abbruch und Fenster-Fokusverlust verwerfen den Drag.

`Checklist.tsx` kapselt die erste Liste je Task. Fachliche Daten (Einträge, Titel) und Anzeigezustand (collapsed) werden über dieselbe Speicherwarteschlange persistiert. Für diese erste Ausbaustufe speichert Migration 2 ein optionales, typisiertes JSON-Objekt in `tasks.checklist`; bestehende Datensätze erhalten NULL. Rust prüft Einträge, eindeutige IDs und Größenlimits. Bei Mehrfachlisten und eigener Eintrags-Sortierung in einem späteren Schritt zu eigenen Kindtabellen migrieren. Die vorhandene Domain-Schnittstelle kann dann beibehalten werden.

## Focus und Prioritäten

`domain/focus.ts` enthält die unabhängig testbare Zeit- und Notizlogik. `useFocus` aktualisiert nur die Anzeige; ein gespeicherter Endzeitpunkt vermeidet Drift durch pausierte Browsertabs. Alle dauerhaften Änderungen laufen durch die bestehende Speicherwarteschlange. Eine Sitzung kann ohne Task bestehen; beim Löschen eines Tasks werden ihre Referenzen gelöst und der frühere Titel bleibt erhalten. Notizen sind eigenständige Datensätze und bleiben über neue Sitzungen hinweg erhalten.

Migration 3 ergänzt `tasks.priority`, die Seitenleisten-Einstellung, einen typisierten JSON-Sitzungszustand in den Metadaten und die Tabelle `focus_notes`. Vor einer bestehenden Datenbankmigration wird mit SQLite `VACUUM INTO` eine konsistente Sicherung erstellt. Browser-Vorschau und Desktop behalten getrennte Repository-Adapter.

Migration 4 ergänzt das gespeicherte Oberflächen-Theme in den Metadaten. Die React-Oberfläche wendet Themes über semantische CSS-Variablen an; Cyberpunk bleibt die Ausgangspalette, während Hell, Dunkel und Kaffee dieselben Komponenten verwenden.
