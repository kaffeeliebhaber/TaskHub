# Focus-Erweiterung – Teststand

Branch: `feature/focus-and-board`. Der akzeptierte Stand bleibt auf `main`.

## Ausprobieren

Im Projektordner `./start-preview.sh` oder `npm run dev` starten und wie bisher http://localhost:1420 öffnen. Falls die Vorschau bereits läuft, die Seite neu laden.

- Seitenleiste oben einklappen: Projekte, Suche und Einstellungen bleiben über Symbole erreichbar. Die Einstellung wird gespeichert.
- Priorität direkt auf einer Karte oder im Aufgabeneditor ändern. Board und Suche bieten einen kombinierbaren Prioritätsfilter. Auch Checklisten und gespeicherte Focus-Notizen werden durchsucht.
- Neben „Neue Aufgabe“ den Focus-Timer öffnen. 25, 50, 90 oder eigene 1–240 Minuten wählen.
- Eine Karte auf die Timer-Schaltfläche oder in die Vorbereitung ziehen. Die Karte bleibt im Board; sie wird der Focus-Zeit zugeordnet. Alternativ über die Auswahlliste wählen oder ohne Aufgabe starten.
- Der gestartete Timer zeigt eine große Focus-Ansicht. Pause, Fortsetzen, Beenden und Rückkehr zum Board sind möglich. Beim Neuladen wird die verbleibende Zeit aus dem gespeicherten Endzeitpunkt berechnet.
- Notizen mit „Notiz speichern“ oder Strg+Enter sichern. Sie erscheinen auf der zugehörigen Karte und im Editor unter „Focus-Notizen“. Notizen ohne Aufgabe bleiben in der Timer-Vorbereitung zugänglich. Entwürfe werden zusätzlich im Browser-/WebView-Speicher zwischengespeichert.

## Speicherung und Rückkehr

Die Desktop-Datenbank verwendet nun Schema 4. Vor der Migration wird neben der Datenbank eine konsistente Datei `taskhub.db.before-v4-….bak` angelegt. Die Browser-Vorschau sichert ihren bisherigen Stand einmalig unter dem Speicherschlüssel `taskhub-preview-before-focus-v2`. Das ersetzt keine reguläre Backup-Funktion.

Ein Git-Wechsel setzt nur Programmdateien zurück, nicht Nutzerdaten. Für einen Desktop-Rückwechsel auf die ältere Version zuerst alle App-Instanzen schließen und den Datenordner sichern. Anschließend die Migrationssicherung als `taskhub.db` in einem sauberen Datenordner wiederherstellen. Neuere Daten bleiben in der zuvor erstellten Ordnerkopie erhalten. Browserdaten sind getrennt nach Adresse und Browserprofil gespeichert; die bisherige Adresse weiterverwenden.

Dieser Teststand enthält noch keine Focus-Statistik, automatische Pausenzyklen oder Hintergrundbenachrichtigung bei geschlossener App. Der Endzeitpunkt bleibt gespeichert, auch wenn die App geschlossen wird. Ein Abschlusston ist möglich, solange die Anwendung aktiv ist und der Browser Audio erlaubt.

## Bedienungsstand

- Neue Aufgaben werden innerhalb der gewünschten Spalte über „Aufgabe hinzufügen“ erstellt.
- Ein Doppelklick auf einen Spaltentitel öffnet die Umbenennung.
- Der Griff links im Spaltenkopf verschiebt eine komplette Spalte samt Aufgaben. Über „Nach links“ und „Nach rechts“ bleibt dieselbe Funktion auch per Tastatur erreichbar.
- Der Breitenregler im Spaltenmenü speichert 220 bis 600 Pixel; der Rand der Spalte kann weiterhin direkt gezogen werden.
- Nach dem Beenden einer Focus-Zeit öffnet sich automatisch die Timer-Vorbereitung. Die Checkliste der gewählten Aufgabe ist in der Focus-Ansicht vollständig bedienbar.
- Unter Einstellungen stehen Hell, Dunkel, Cyberpunk und Kaffee zur Verfügung. Cyberpunk entspricht dem bisherigen Erscheinungsbild; die Auswahl wird lokal gespeichert.
