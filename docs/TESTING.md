# Prüfbericht – 9. September 2026

## Automatisch erfolgreich

- `npm run build`: strikte TypeScript-Prüfung und Produktions-Build mit Vite.
- `npm test`: 8 Tests. Karten in beide Richtungen sortieren, leere Zielspalte, Ablehnung projektübergreifender Verschiebungen, Spalten sortieren, Projekt samt Kindern löschen, serialisierte schnelle Änderungen, Schreibfehler ohne unbestätigten UI-Zustand, Reihenfolge nach Löschen und Hinzufügen.
- `cargo test -p taskhub-core --locked`: 4 Tests. Echte SQLite-Datei speichern/schließen/erneut öffnen, Inhalte/Breite/Einklappzustand/letztes Projekt prüfen, Löschen, veraltete Revision und ungültige Daten ablehnen, Zusatz-Kindtabellen beim Bearbeiten erhalten, 16 Spalten ablehnen.
- npm-Abhängigkeitsprüfung: keine gemeldeten Schwachstellen zum Prüfzeitpunkt.

## In der laufenden Browser-Vorschau geprüft

- Leerer Start und Anlegen von „Haushalt“ mit drei Standardspalten.
- Aufgabe „Küche streichen“ anlegen; mehrzeilige Beschreibung bearbeiten und speichern.
- Spaltenwechsel im Editor mit Tastatur.
- Frei benannte vierte Spalte „Warten“ anlegen und einklappen.
- Spalten per Ziehen neu anordnen.
- Karte direkt auf Titel/Inhalt greifen und in eine andere Spalte ziehen; Aufgabe erscheint im Ziel, Quell-/Zielzähler stimmen.
- Breite einer Spalte von 300 auf 337 px ziehen.
- Neuladen: Projekt, Beschreibung, Aufgabenzuordnung, Spaltenreihenfolge, eingeklappter Zustand und 337 px Breite wiederhergestellt.
- Visuelle Prüfung bei 1280 × 720: dunkles Layout, Navigation, horizontaler Bildlauf, Karte, Dialoge und Spaltenmenü.

Die Testdaten liegen ausschließlich im getrennten Browser-Vorschauspeicher. Die Desktop-Datenbank wurde nicht mit Beispieldaten befüllt.

## Hier nicht ausführbar

`cargo check -p taskhub` wurde gestartet und scheiterte im Build von `glib-sys`: `glib-2.0.pc` ist nicht vorhanden. Auch GTK-3-/WebKitGTK-4.1-Entwicklungsbibliotheken fehlen. Daher **kein erfolgreicher vollständiger Desktop-Build, kein nativer Fenster-/IPC-End-to-End-Test und kein fertiges Installationspaket**. Rust-/SQLite-Kern und Frontend wurden getrennt erfolgreich geprüft. Windows wurde nicht ausgeführt.

## Nächster Test auf dem Zielgerät

1. Voraussetzungen aus README installieren, `npm ci` und `npm run tauri dev` ausführen.
2. Prüfen, dass „Lokal gespeichert“ und in Einstellungen ein echter SQLite-Pfad angezeigt werden.
3. Zwei Projekte und mehrere Aufgaben anlegen. Reihenfolge, Breite und Einklappzustand verändern.
4. App nach „Lokal gespeichert“ vollständig schließen und erneut starten. Inhalte, Reihenfolgen und letztes Projekt prüfen.
5. Bestätigungsdialoge für Löschen zunächst abbrechen, anschließend nur eigens angelegte Testobjekte löschen.
6. Karten innerhalb einer Spalte, zwischen Spalten und in eine eingeklappte Spalte ziehen. Mit vielen Spalten horizontales Scrollen prüfen.
7. Linux-Pakete erstellen und auf dem Zielsystem starten; Windows entsprechend separat bauen und testen.

## Bekannte Grenzen des Zwischenstands

- Kein Papierkorb, keine automatische Sicherung; einfache Task-Bearbeitung mit explizitem Speichern.
- Während einer Suche ist manuelles Ziehen deaktiviert, um mehrdeutige Sortierung gefilterter Karten zu vermeiden.
- Noch kein automatisches horizontales Scrollen während eines Karten-Drags. Bei weit entfernten Spalten den Editor zum Spaltenwechsel verwenden.
- Noch kein vollständiger Accessibility-Audit oder großer Datenmengen-/Langzeittest.

## Ergänzung: Checkliste und animiertes Ziehen

- 10 Frontend-/Domain-Tests und 5 Rust-/SQLite-Tests erfolgreich. Zusätzlich geprüft: Checklistendaten beim Verschieben erhalten, doppelte Eintrags-IDs ablehnen, alte Datenbank verlustfrei auf Schema 2 migrieren und Checkliste nach erneutem Öffnen samt Häkchen/Einklappzustand laden.
- In der Browser-Vorschau auf „Küche streichen“ die Beispielliste „Material & Vorbereitung“ mit drei Einträgen angelegt, ersten Eintrag abgehakt; Fortschritt 1/3.
- Einklappen und Neuladen erhalten 1/3 und den geschlossenen Zustand. Karte samt Liste per Titel in die Nachbarspalte verschoben.
- Native Linux-/Windows-Prüfung weiterhin ausstehend; keine Änderung an den zuvor dokumentierten Desktop-Build-Grenzen.

Die schwebende Karte wurde während eines laufenden Drags visuell geprüft: geneigte vollständige Kopie einschließlich aufgeklappter Checkliste, Quellplatzhalter und hervorgehobene Zielspalte. Nach dem Loslassen wurde die Aufgabe wieder in „In Arbeit“ gespeichert.

## Focus-Teststand (10.09.2026)

- TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- 14 Frontend-/Domain-Tests erfolgreich, einschließlich absoluter Endzeitpunkte, Pause/Fortsetzen, abgelaufener Sitzungen, freier Sitzungen, Notizzuordnung, Entfernen von Taskreferenzen und kombinierter Prioritäts-/Notizensuche.
- 7 Rust-/SQLite-Tests erfolgreich, einschließlich Speicherung der neuen Felder, Notizen und Themes sowie Migration von Schema 1 und Sicherung einer älteren Datenbank vor Migration 4.
- Browserprüfung: Projekt/Task anlegen, Seitenleiste einklappen, Priorität ändern, Timer-Vorbereitung öffnen; gespeicherte pausierte Sitzung und zugehörige Notiz nach Wiederöffnen sichtbar. Focus-Ansicht und Board visuell kontrolliert.
- Native Tauri-Oberfläche und Windows-Build weiterhin nicht in dieser Umgebung geprüft. Ein vollständiger manueller Durchlauf von Drag-and-drop und Timerablauf im nativen Fenster bleibt vor einer Freigabe erforderlich.

## Bedienung und Themes (11.09.2026)

- TypeScript-Prüfung, Vite-Produktionsbuild und 16 Frontend-/Domain-Tests erfolgreich.
- Breitenänderung am Spaltenrand, Doppelklick-Umbenennung, eigener Prioritätsfilter, Timer-Ende mit Rückkehr zur Vorbereitung und interaktive Checkliste im Focus-Raum im Browser geprüft.
- Theme-Auswahl und Speicherung für Hell, Dunkel, Cyberpunk und Kaffee geprüft.
