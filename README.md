# Geräteverleih

Next.js-Anwendung zur Verwaltung eines internen Geräteverleihs. Die Anwendung ersetzt die Rohdaten aus `docs/altdaten_seed.sql` durch ein typisiertes Datenmodell und deckt Inventar, Ausleihen, Rückgaben, Leihfristen, Reservierungen, Verwaltung und Auswertungen ab.

## Technische Entscheidungen

- **Next.js 16 und React 19:** Server Components laden geschützte Daten direkt serverseitig; Server Actions führen mutierende Vorgänge aus.
- **PostgreSQL:** Die Aufgabenstellung verlangt eine serverbasierte SQL-Datenbank. PostgreSQL wird über `pg` und Drizzle ORM verwendet. Die Datenbank ist wichtig für Transaktionen, Fremdschlüssel und Zeilensperren bei konkurrierenden Ausleihen.
- **Drizzle ORM:** Das Schema liegt in `lib/db/schema.ts`. Die Legacy-Tabellen bleiben als Staging-Tabellen erhalten und werden nicht mit dem sauberen Modell vermischt.
- **Better Auth:** E-Mail-/Passwort-Anmeldung, Sessions und rollenbasierte Berechtigungen (`user` und `admin`).
- **shadcn/ui und Recharts:** UI-Komponenten und Diagramme für die Verwaltungs- und Auswertungsseiten.

## Lokales Setup

Voraussetzungen: Node.js, eine erreichbare PostgreSQL-Datenbank und npm.

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. `.env.local` anlegen:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/geraeteverleih
   BETTER_AUTH_SECRET=ein-langer-zufalliger-wert
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. Datenbankschema synchronisieren und die Legacy-Daten importieren:

   ```bash
   npm run db:push
   npm run db:import
   ```

4. Entwicklungsserver starten:

   ```bash
   npm run dev
   ```

Danach ist die Anwendung unter `http://localhost:3000/login` erreichbar. Konten können auf der Login-Seite angelegt werden. Das erste Konto erhält nicht automatisch Admin-Rechte; die Rolle muss über die Better-Auth-Benutzerverwaltung gesetzt werden.

Verfügbare Prüfungen:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Datenübernahme und Importbericht

`npm run db:import` führt `docs/altdaten_seed.sql` innerhalb einer PostgreSQL-Transaktion aus und übernimmt anschließend die Rohdaten aus `alt_inventar` und `alt_ausleihen`.

Für jede Quellzeile wird in `import_rows` ein Ergebnis mit Status, Begründung und Rohdaten gespeichert. Ein Lauf wird zusätzlich in `import_runs` mit Zählwerten protokolliert. Der Bericht ist für angemeldete Benutzer unter `/imports` und als JSON unter `/api/import-report` verfügbar.

Die Importregeln sind bewusst konservativ:

- Unterstützt werden ISO-Daten (`YYYY-MM-DD`) und deutsche Daten (`DD.MM.YYYY`); ungültige Pflichtfelder, Mengen und Datumswerte werden abgelehnt.
- Bei doppelten Inventarnummern gewinnt die erste gültige Zeile.
- Ein Anschaffungsdatum in der Zukunft wird übernommen, aber als Warnung markiert.
- Ausleihen mit unbekannter oder abgelehnter Inventarnummer, fehlender Person, ungültigem Datum oder Rückgabe vor der Ausleihe werden abgelehnt.
- Leere Rückgabedaten bleiben offene Ausleihen.
- `source_key`-Werte und Unique Constraints machen wiederholte Imports idempotent; bereits übernommene Zeilen werden als `skipped` protokolliert.
- Historische Namen werden übernommen, aber mangels verlässlicher Benutzer-ID nicht nachträglich einem Benutzerkonto zugeordnet.

## Datenmodell

Die zentralen Tabellen sind:

- `devices`: Inventarnummer, Bezeichnung, Kategorie, Menge, Anschaffungsdatum und optionales Ausmusterungsdatum.
- `loans`: Gerät, historischer Anzeigename, optionale Benutzer-ID, Ausleih-, Fälligkeits- und Rückgabedatum.
- `reservations`: Gerät, reservierendes Benutzerkonto, Start-/Enddatum und Status (`active`, `cancelled`, `fulfilled`).
- `loan_duration_rules`: konfigurierbare Leihfristen je Kategorie.
- `import_runs` und `import_rows`: dauerhaft gespeicherter Importbericht.

## Ausleihen und Verfügbarkeit

Die Inventaransicht ist `/inventory`. Sie zeigt Geräte mit Freitextsuche, Kategoriefilter und Filter für verfügbare Geräte. Standardbenutzer sehen verfügbare Geräte und ihre eigenen Ausleihdaten; berechtigte Verwaltungsbenutzer sehen zusätzlich den vollständigen Bestand und die gesamte Historie.

Eine Einheit ist verfügbar, wenn `Menge - offene Ausleihen > 0` ist und das Gerät nicht ausgemustert wurde. Reservierte Einheiten werden bei einer direkten Ausleihe ebenfalls berücksichtigt. Dadurch kann die Oberfläche keine Verfügbarkeit vortäuschen, die der Server nicht bestätigen kann.

Checkout und Rückgabe laufen über serverseitige Actions. Beim Checkout wird die Gerätezeile in einer PostgreSQL-Transaktion mit `FOR UPDATE` gesperrt, anschließend werden offene Ausleihen und aktive Reservierungen erneut gezählt. Das schützt auch bei parallelen Requests vor Überbuchung. Eine Rückgabe setzt nur `returned_at`; die Historie bleibt erhalten.

## Leihfristen und Überfälligkeit

Die Standardregeln werden in `loan_duration_rules` angelegt und sind unter `/loan-settings` änderbar:

| Kategorie | Frist |
| --- | ---: |
| Standard | 14 Tage |
| Kamera | 7 Tage |
| Präsentation | 7 Tage |
| Mobilgerät | 30 Tage |

Der Kategorienvergleich ignoriert Groß-/Kleinschreibung und umgebende Leerzeichen. Fehlt eine Spezialregel, wird `Standard`, ersatzweise 14 Tage verwendet. Das Fälligkeitsdatum wird beim Anlegen in `loans.due_at` gespeichert; spätere Regeländerungen verändern bestehende Ausleihen nicht. Historische Ausleihen ohne Fälligkeitsdatum werden beim Laden der Inventaransicht einmalig ergänzt.

Eine offene Ausleihe ist überfällig, wenn ihr gespeichertes Fälligkeitsdatum vor dem aktuellen Datum liegt. Die Überfälligkeitsansicht ist Teil der Ausleihverwaltung unter `/loan-management`; zurückgegebene Ausleihen erscheinen dort nicht.

## Reservierungen

Reservierungen sind unter `/reservations` verfügbar; die Verwaltungsansicht liegt unter `/reservation-management`. Die Oberfläche nimmt ein Startdatum an. Das Enddatum wird aus der zu diesem Gerät passenden Leihfrist berechnet. Damit entspricht eine Reservierung einem planbaren Leihzeitraum und verwendet dieselbe Fristenkonfiguration wie eine Ausleihe.

Dabei gelten folgende Regeln:

- Der Start darf heute oder später liegen. Der berechnete Zeitraum ist inklusiv; Zeiträume, die am selben Tag beginnen bzw. enden, überschneiden sich.
- Eine Reservierung belegt eine Einheit. Bei der Prüfung werden offene Ausleihen und aktive, zeitlich überschneidende Reservierungen gegen die Geräte-Menge gerechnet.
- Eine offene Ausleihe ohne Fälligkeitsdatum blockiert den Zeitraum. Eine Ausleihe mit Fälligkeit am oder nach dem Reservierungsbeginn blockiert ebenfalls; überfällige Ausleihen blockieren vorsichtshalber jeden zukünftigen Zeitraum, bis eine Rückgabe bestätigt wurde.
- Anlage, Stornierung und Abholung sind serverseitig autorisiert und transaktional. Die Gerätezeile wird bei der Anlage bzw. Abholung gesperrt.
- Eine Reservierung kann nur innerhalb ihres Zeitraums abgeholt werden. Die Abholung erzeugt eine normale Ausleihe mit aktueller Leihfrist und setzt den Reservierungsstatus auf `fulfilled`.
- Stornierte und abgeholte Reservierungen werden nicht gelöscht. So bleibt die Entscheidungshistorie erhalten.

Die Logik ist in `tests/reservations.test.ts` mit Tests für Fristen, Fallbacks, Intervallgrenzen, Kapazität und Statusübergänge abgesichert.

## Verwaltung und Auswertungen

Unter `/device-management` können berechtigte Benutzer Geräte anlegen, bearbeiten und ausmustern. Ausmustern setzt `retired_at`, statt den Datensatz zu löschen. Ausgemusterte Geräte sind nicht mehr ausleih- oder reservierbar, bestehende Ausleihen und die Historie bleiben jedoch sichtbar. Eine laufende Ausleihe wird durch das Ausmustern nicht automatisch beendet.

Unter `/reports` werden serverseitig drei Kennzahlen berechnet:

- aktuell meist ausleihende Personen anhand offener Ausleihen,
- am häufigsten verliehene Geräte anhand aller historischen Ausleihen,
- Auslastung je Kategorie als `offene Ausleihen / Menge aktiver Geräte`.

Die Auslastung ignoriert ausgemusterte Geräte bei Kapazität und offenen Ausleihen. Der Zugriff auf die Auswertungen besitzt derzeit `report.read` sowohl für die Rolle `user` als auch für `admin`; die übrigen Verwaltungsbereiche sind auf berechtigte Benutzer beschränkt.

## Berechtigungen und Datenschutz

Die Berechtigungen werden mit Better Auth serverseitig geprüft. UI-Sichtbarkeit ist nur Komfort und keine Sicherheitsgrenze.

- Standardbenutzer dürfen Inventar ansehen, für sich selbst ausleihen, eigene Ausleihen zurückgeben und eigene Reservierungen verwalten.
- Administratoren dürfen zusätzlich für andere registrierte Benutzer ausleihen/reservieren, vollständige Historien sehen, Rückgaben und Reservierungen anderer Benutzer bearbeiten, Geräte verwalten, Leihfristen ändern und Benutzerrollen verwalten.
- Ausleihen und Reservierungen speichern sowohl einen historischen Namen als auch die Benutzer-ID. Für Autorisierung und Sichtbarkeit ist die ID maßgeblich; bei delegierten Vorgängen wird der Name serverseitig aus dem ausgewählten Konto übernommen.
- Die Benutzerliste für delegierte Vorgänge ist aktuell auf 100 Konten begrenzt. Für einen größeren Bestand wäre serverseitige Suche mit Pagination der nächste Schritt.

## Bewusste Abgrenzungen

Nicht umgesetzt wurden die optionalen Erweiterungen CSV-Export, QR-Codes und Benachrichtigungen. Eine frei wählbare Reservierungs-Endzeit ist ebenfalls nicht vorgesehen; die Dauer folgt bewusst der konfigurierten Leihfrist des Geräts. Diese Begrenzungen halten die Kernlogik innerhalb des vorgesehenen Zeitbudgets und vermeiden eine zweite, von Ausleihen abweichende Fristenlogik.
