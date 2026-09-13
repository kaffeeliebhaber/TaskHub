# Archiv, Anhänge und Export testen

Die Startadresse `/` und `/app` öffnen direkt das Board. Die Landingpage bleibt unter `/landing` erreichbar.

## Aufgaben abschließen und archivieren

In der Detailansicht **Aufgabe abgeschlossen** markieren. Damit wird das tatsächliche Abschlussdatum erfasst. Alte Aufgaben in einer Spalte namens „Erledigt“ erhalten kein erfundenes rückwirkendes Abschlussdatum. Sie müssen einmal ausdrücklich abgeschlossen werden.

**Archivieren** in der Detailansicht speichert die Eingaben und archiviert die abgeschlossene Aufgabe. **Archiv → Archivierungsjob** zeigt alle abgeschlossenen, noch aktiven Aufgaben des aktuellen Boards. Filter können Spalte, Priorität, Erstelldatum von/bis und Abschlussdatum von/bis kombinieren. Datum-Grenzen sind inklusive und beziehen sich auf die lokale Zeitzone. Nach Sichtprüfung die gewünschten Treffer markieren und den Job starten. Dies ist ein manuell gestarteter Stapelvorgang, kein regelmäßig laufender Hintergrundjob.

**Archiv ansehen** zeigt auch Beschreibungen, Checklisten, Links, Bilder und Focus-Notizen. Aufgaben lassen sich wiederherstellen oder markieren und nach einer zweiten Bestätigung dauerhaft löschen. Gelöschte Aufgaben werden aus Abhängigkeiten entfernt. Bestehende Focus-Notizen bleiben wie bisher als sitzungsbezogene Notizen erhalten, wenn ihre Aufgabe gelöscht wurde.

## Abhängigkeiten

Im Editor unter **Abhängigkeiten** eine Voraussetzung wählen. Karten zeigen „Wartet auf“ bzw. „Freigegeben“, sobald alle Voraussetzungen abgeschlossen sind. Selbstbezüge, Kreise und Verknüpfungen zwischen verschiedenen Boards werden verhindert. Das ist eine visuelle Planungshilfe; sie sperrt Aufgaben nicht gegen Bearbeitung.

## Bilder und Links

Im Editor bis zu sechs PNG-, JPEG-, WebP- oder GIF-Bilder hinzufügen (jeweils höchstens 2 MB). Speichern übernimmt die Bilder mit der Aufgabe. **Einstellungen → Bilder auf Karten anzeigen** schaltet die kleinen Board-Vorschauen; Detailansicht und Archiv zeigen Bilder unabhängig davon. Screenshots können als Bilddatei ausgewählt werden. Einfügen aus der Zwischenablage ist noch nicht enthalten.

HTTP/HTTPS-Links werden im Browser in einem neuen Tab geöffnet. Die Desktop-App übergibt sie an den Standardbrowser des Betriebssystems.

## Obsidian

**Obsidian exportieren** erzeugt eine Datei im offenen JSON-Canvas-Format. Die Datei in einen Obsidian-Vault kopieren und dort öffnen. Spalten sind Gruppen, Aufgaben sind Textkarten; Abhängigkeiten werden als Pfeile dargestellt. Beschreibungen, Checklisten, Priorität, Links und Focus-Notizen sind enthalten. Archivierte Aufgaben und Bilddateien werden nicht exportiert. Der Export ist eine Momentaufnahme ohne Rücksynchronisation.

Im Browser wird die Datei heruntergeladen. Die Desktop-App speichert sie mit einem eindeutigen Namen im Download-Ordner und zeigt den Pfad an.

## Timer

Ein dreiteiliger Piepton erklingt nach erfolgreichem Ablauf. In den Einstellungen gibt es **Timer-Signalton testen**. Browser erlauben Ton erst nach einer Interaktion; stummgeschaltete Tabs oder Systemlautstärke können die Wiedergabe verhindern. Die Landingpage-Demo verwendet jetzt eigene CSS-Klassen, damit die ursprünglichen echten Timer-Buttons wieder korrekt dargestellt werden.

## Speicherung und Prüfungen

SQLite-Schema 5 ergänzt die Aufgabendetails und die Einstellung für Bildvorschauen. Vor dem Upgrade bestehender Datenbanken wird eine `.before-v5-….bak`-Sicherung erstellt. Die neuen Felder werden im selben Speichervorgang wie die Aufgabe geschrieben.

Die Browser-Vorschau verwendet jetzt IndexedDB, damit Bilddaten nicht am kleinen LocalStorage-Limit scheitern. Beim ersten Speichern wird der vorhandene LocalStorage-Stand übernommen; der alte Eintrag bleibt als Rückfallkopie erhalten. Ältere App-Versionen lesen diesen alten Stand und sehen neue IndexedDB-Änderungen nicht.

Geprüft: TypeScript, Produktionsbuild, Domänentests inkl. Abhängigkeitszyklen, Datumsfilter und Canvas-Export; Rust-Tests inkl. Upgrade von Schema 4, Sicherung und Wiederöffnung mit Aufgabendetails. Manuell: Board als Startseite, Abschlussstatus/Link speichern, Einklappen nach Neuladen, Archivierungsjob, Archivdetails, Wiederherstellen und Timer-Button-Darstellung. Vollständiger Tauri-Build und Windows-Lauf sind mangels Systembibliotheken hier nicht getestet.
