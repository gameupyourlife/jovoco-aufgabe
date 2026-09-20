# Praxisaufgabe – Geräteverleih

Vielen Dank für dein Interesse. Diese Aufgabe spiegelt eine typische Situation bei uns wider: Ein Kunde verleiht intern Geräte (Laptops, Beamer, Werkzeug, Kameras …) an Mitarbeitende und verwaltet das bisher über eine gewachsene Excel-Liste. Diese Liste soll durch eine kleine Webanwendung ersetzt werden.

## Rahmen

- **Zeitbudget:** ca. 4–6 Stunden. Der Umfang ist bewusst größer, als man in dieser Zeit von Hand tippen würde – mit den erlaubten KI-Tools ist er gut erreichbar. Bitte investiere trotzdem nicht deutlich mehr Zeit: Quality over Quantity, wir bewerten Denkweise und Handwerk, nicht Vollständigkeit.
- **Hilfsmittel:** Alle Werkzeuge sind erlaubt, ausdrücklich auch KI-Tools (Copilot, ChatGPT, Claude …). Wir arbeiten selbst damit. Im anschließenden Gespräch besprechen wir deine Lösung gemeinsam – sei also vorbereitet, deine Entscheidungen zu erklären.
- **Tech:** Freie Wahl bei Sprache und Framework (Frontend + Backend). Als Datenspeicher soll eine **serverbasierte SQL-Datenbank** dienen – **PostgreSQL empfohlen**, andere (z. B. MySQL, MariaDB, SQL Server) sind in Ordnung, gerne als Docker-Container. **SQLite ist nicht zugelassen.** Begründe deine Wahl kurz.
- **Priorisierung:** Die Teile bauen aufeinander auf – bearbeite sie in Reihenfolge. Wenn du kürzen musst, lass eher hinten weg und **notiere, was du bewusst weggelassen hast und warum.**

## Ausgangslage

Im Ordner `data/` liegt `altdaten_seed.sql`. Ein Kollege hat den Export der bisherigen Excel-Liste bereits 1:1 in zwei Rohdaten-Tabellen überführt:

- `alt_inventar`: der Gerätebestand (Inventarnummer, Bezeichnung, Kategorie, Menge, Anschaffungsdatum)
- `alt_ausleihen`: die Ausleihhistorie (wer hat was wann ausgeliehen; eine leere Rückgabespalte bedeutet: noch nicht zurückgegeben)

Alle Spalten sind bewusst TEXT und die Werte **unverändert** aus der Excel-Liste übernommen – so, wie Daten im echten Alltag eben aussehen. Wir haben sie nicht bereinigt. Das Skript ist für **PostgreSQL** geschrieben, nutzt aber nur Standard-SQL – wenn du eine andere SQL-Datenbank bevorzugst, darfst du es anpassen.

## Deine Aufgabe

### Teil 1 – Daten übernehmen

Überführe die Rohdaten aus `alt_inventar` und `alt_ausleihen` in dein eigenes, sauberes Datenmodell (Migrationsskript, Endpunkt oder Admin-Funktion – deine Wahl). Wie du mit problematischen Zeilen umgehst – ablehnen, korrigieren, markieren – ist deine Entscheidung.

Erzeuge dabei einen **Import-Bericht**: welche Zeilen wurden übernommen, welche nicht oder nur mit Vorbehalt – und warum. Der Bericht soll persistiert und über API oder Oberfläche einsehbar sein, nicht nur ein Konsolen-Log.

### Teil 2 – Verleih (Kern)

1. **Geräteübersicht:** alle Geräte inkl. aktueller Verfügbarkeit, mit **Suche und Filter** (Freitext, Kategorie, „nur verfügbare").
2. **Ausleihe anlegen:** eine Person leiht ein Gerät aus – **aber nur, wenn es verfügbar ist.** Ist es das nicht, soll der Aufruf ablehnen und nachvollziehbar mitteilen, warum. Was genau „verfügbar" bedeutet, ist Teil deiner Überlegung – triff sinnvolle Annahmen und dokumentiere sie.
3. **Rückgabe:** eine offene Ausleihe wird zurückgegeben.
4. **Historie:** alle Ausleihen eines Geräts bzw. einer Person einsehen.

### Teil 3 – Leihfristen und Überfälligkeit

Der Kunde hat folgende Regeln genannt: Standardleihfrist **14 Tage**, für Kameras und Präsentationstechnik **7 Tage**, für Mobilgeräte **30 Tage**.

1. Die Fristen sollen **konfigurierbar** sein (z. B. eigene Tabelle), nicht im Code verstreut.
2. Beim Anlegen einer Ausleihe wird das fällige Rückgabedatum berechnet und angezeigt.
3. Eine Ansicht zeigt alle **überfälligen** Ausleihen auf einen Blick.

### Teil 4 – Reservierungen

Mitarbeitende sollen ein Gerät für einen **zukünftigen Zeitraum** reservieren können:

1. Reservierung anlegen – **aber nur, wenn das Gerät in diesem Zeitraum voraussichtlich verfügbar ist.** Wie offene Ausleihen (pünktliche wie überfällige) und andere Reservierungen in diese Prüfung einfließen, ist Teil deiner Überlegung – dokumentiere deine Regeln.
2. Reservierung stornieren.
3. Bei Abholung wird die Reservierung zur Ausleihe.

Sichere die Verfügbarkeits- und Reservierungslogik mit **ein paar gut gewählten Unit-Tests** ab – wenige, treffende Randfälle sind mehr wert als viele triviale.

### Teil 5 – Verwaltung und Auswertungen

1. **Geräteverwaltung:** Geräte anlegen, bearbeiten und **ausmustern**. Ausgemusterte Geräte sind nicht mehr ausleihbar, ihre Historie bleibt erhalten.
2. **Auswertungen:** eine kleine Ansicht mit z. B.: Wer hat aktuell die meisten Geräte? Welche Geräte werden am häufigsten ausgeliehen? Wie ist die Auslastung je Kategorie? (Was „Auslastung" genau heißt: deine Überlegung.)

### Teil 6 – Kurz schriftlich (max. eine halbe Seite)

- Was ist dir an den gelieferten Daten aufgefallen und wie bist du damit umgegangen?
- Welche **drei Fragen** würdest du der Büroleitung des Kunden stellen, bevor das System produktiv geht?

### Optionale Erweiterungen

Nur wenn dann noch Zeit im Budget ist: CSV-Export der Überfälligen · QR-Code je Gerät (für einen Aufkleber am Gerät) · Benachrichtigungskonzept für Überfällige (nur skizzieren, nicht bauen).

## Abgabe

Ein öffentliches Git-Repository (bevorzugt) oder Zip mit:

- dem Code (lauffähig, mit kurzer Setup-README),
- deinem schriftlichen Teil 6 und deinen dokumentierten Annahmen und Regeln.

Sende uns die Abgabe bitte **spätestens eine Stunde vor dem Termin** zu (am besten das Repo direkt nach der Erstellung – dann kannst du es nicht vergessen).

Im Termin stellst du deine Lösung kurz vor und wir schauen die laufende Anwendung an. Danach sprechen wir über deinen Code – **zum Teil bewusst ohne Hilfsmittel**: Du sagst zum Beispiel voraus, wie sich deine Anwendung in einem konkreten Fall verhält (wir probieren es dann gemeinsam aus) oder wir schauen zusammen auf ein Stück fremden Code. Zum Schluss setzt du eine kleine Änderung live in deiner Lösung um – dabei sind deine gewohnten Werkzeuge inkl. KI ausdrücklich erlaubt. Halte dafür deine Entwicklungsumgebung bereit.

Viel Erfolg!
