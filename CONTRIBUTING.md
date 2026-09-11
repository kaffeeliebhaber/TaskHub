# Zu TaskHub beitragen

Danke für dein Interesse an TaskHub. Das Projekt befindet sich noch in einer frühen Preview-Phase. Konkrete Fehlerberichte, nachvollziehbare Verbesserungsvorschläge und Feedback zur Bedienung helfen derzeit am meisten.

## Fehler melden

Bitte prüfe zuerst, ob bereits ein ähnliches GitHub Issue existiert. Ein hilfreicher Fehlerbericht enthält das Betriebssystem, die verwendete Version, genaue Schritte zum Reproduzieren, erwartetes und tatsächliches Verhalten sowie bei Bedarf einen Screenshot ohne persönliche Daten.

## Änderungen vorschlagen

Größere Änderungen sollten zuerst als Issue beschrieben werden. Für einen Pull Request:

1. Repository forken und einen klar benannten Branch erstellen.
2. Abhängigkeiten mit `npm ci` installieren.
3. Änderung klein und thematisch zusammenhängend halten.
4. `npm run build`, `npm test` und bei Rust-Änderungen `cargo test -p taskhub-core --locked` ausführen.
5. Problem, neue Funktionsweise und durchgeführte Tests beschreiben.

Die Oberfläche soll ruhig, klar und mit Tastatur bedienbar bleiben. Persistente Änderungen brauchen verständliche Fehlerzustände; neue Datenfelder eine rückwärtskompatible SQLite-Migration.
