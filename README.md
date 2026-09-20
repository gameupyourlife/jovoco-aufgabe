Update/Generate better-auth schema: npx auth@latest generate --output ./lib/db/auth-schema.ts 
Update database: npx drizzle-kit push

## Legacy data import

1. Set `DATABASE_URL` to a PostgreSQL database in `.env.local`.
2. Apply the Drizzle schema: `npm run db:push`.
3. Import the supplied raw export: `npm run db:import`.
4. Open `/` for the persisted report or `/api/import-report` for JSON.

The importer loads the supplied SQL into staging tables inside one transaction, normalizes supported dates, validates required values and date order, and records every source row in `import_rows`. Invalid inventory rows are rejected; duplicate inventory numbers keep the first valid row; future acquisition dates are accepted with a warning; loans referencing rejected or unknown devices are rejected. Source keys make repeated runs idempotent.

## Leihfristen und Überfälligkeit

Die Leihfrist wird nicht im Anwendungscode pro Kategorie fest verdrahtet, sondern in der PostgreSQL-Tabelle `loan_duration_rules` gespeichert. Beim ersten Zugriff werden diese Standardregeln angelegt:

| Kategorie | Leihfrist |
| --- | ---: |
| Standard | 14 Tage |
| Kamera | 7 Tage |
| Präsentation | 7 Tage |
| Mobilgerät | 30 Tage |

Administratoren können die Regeln unter `/loan-settings` ändern. Die Seite und die zugehörige Server Action verlangen die Berechtigung `loan_settings.manage`; normale Benutzer sehen den Menüpunkt nicht und können die Regeln auch nicht über die API ändern.

Beim Anlegen einer Ausleihe wird die passende Regel anhand der Gerätekategorie gesucht. Der Vergleich ignoriert Groß-/Kleinschreibung und Leerzeichen. Wenn keine spezielle Kategorie passt, wird die Regel `Standard` verwendet; fehlt auch diese, gilt als technische Fallback-Regel eine Frist von 14 Tagen. Das berechnete Fälligkeitsdatum wird zusammen mit der Ausleihe in `loans.due_at` gespeichert. Eine spätere Änderung der Regel verändert bereits angelegte Ausleihen daher nicht rückwirkend.

Aus historischen Importdaten ohne Fälligkeitsdatum wird dieses beim nächsten Laden der Inventaransicht einmalig anhand der dann gültigen Regeln ergänzt. Eine offene Ausleihe gilt als überfällig, sobald ihr gespeichertes Fälligkeitsdatum vor dem aktuellen Datum liegt. Zurückgegebene Ausleihen erscheinen nicht in der Überfälligkeitsübersicht.

## Entscheidungen zu Berechtigungen und Ausleihen

### Rollen und Berechtigungen

Die Berechtigungen werden mit Better Auth serverseitig geprüft. Die Oberfläche blendet Funktionen nur zusätzlich aus; sie ist keine Sicherheitsgrenze.

| Berechtigung | Bedeutung |
| --- | --- |
| `inventory.read` | Verfügbare Geräte ansehen |
| `inventory.read_all` | Den vollständigen Gerätebestand einschließlich nicht verfügbarer Geräte ansehen |
| `loan.create` | Ein Gerät für sich selbst ausleihen |
| `loan.create_for_others` | Ein Gerät für einen anderen registrierten Benutzer ausleihen |
| `loan.read` | Eigene Ausleihen ansehen |
| `loan.read_all` | Die Ausleihhistorie aller Benutzer ansehen |
| `loan.return` | Eigene Ausleihen zurückgeben |
| `loan.return_all` | Jede offene Ausleihe zurückgeben |
| `loan_settings.manage` | Leihfristen verwalten |

Normale Benutzer erhalten `inventory.read`, `loan.create`, `loan.read` und `loan.return`. Administratoren erhalten zusätzlich die erweiterten Inventar- und Leihberechtigungen sowie die Better-Auth-Benutzerverwaltung. Die Benutzerverwaltung unter `/users` ist nur für Benutzer mit der Better-Auth-Berechtigung `user.list` erreichbar.

### Datenschutz und Ausleihende

Eine Ausleihe speichert neben dem historischen Anzeigenamen auch `loans.borrower_user_id`. Die Benutzer-ID ist für Autorisierung maßgeblich, weil ein frei eingegebener Name nicht eindeutig und leicht fälschbar wäre. Bei einer Ausleihe für eine andere Person kann deshalb nur ein existierendes Benutzerkonto ausgewählt werden; der gespeicherte Name wird serverseitig aus diesem Konto übernommen.

Normale Benutzer sehen nur verfügbare Geräte sowie ihre eigenen Ausleihen. Administratoren mit `loan.read_all` sehen die vollständige Ausleihhistorie. Historische Importzeilen ohne Benutzer-ID bleiben aus Datenschutzgründen normalen Benutzern verborgen, sind für berechtigte Verwaltungsbenutzer aber weiterhin nachvollziehbar.

### Verfügbarkeit und Rückgabe

Die Verfügbarkeit wird als `Bestand - offene Ausleihen` berechnet. Auch wenn ein Benutzer fremde Ausleihen nicht sehen darf, werden sie bei der Verfügbarkeitsberechnung berücksichtigt. Dadurch kann die UI keine Geräte als verfügbar anzeigen, die tatsächlich bereits vollständig verliehen sind.

Checkout und Rückgabe werden als Server Actions ausgeführt und prüfen die Berechtigung erneut. Beim Checkout wird die Gerätezeile in einer PostgreSQL-Transaktion gesperrt, bevor offene Ausleihen gezählt und die neue Ausleihe angelegt wird. Damit werden parallele Ausleihen nicht nur durch die UI, sondern auch gegen Race Conditions geschützt.

Die Seite `Meine Ausleihen` zeigt ausschließlich offene Ausleihen mit der eigenen `borrower_user_id`. Eine Rückgabe ist für normale Benutzer nur für diese eigenen Datensätze möglich; berechtigte Verwaltungsbenutzer dürfen jede offene Ausleihe zurückgeben. Die Rückgabe bewahrt die Historie und setzt nur `returned_at`.

### Bewusste Einschränkungen

- Benutzer werden über Rollen (`user` und `admin`) verwaltet; individuelle Benutzerberechtigungen sind derzeit nicht erforderlich.
- Historische Ausleihen werden nicht nachträglich automatisch einem Benutzer zugeordnet, weil die Rohdaten keine verlässliche Benutzer-ID enthalten.
- Die Benutzerliste für delegierte Ausleihen ist auf die ersten 100 Konten begrenzt. Für einen größeren Produktivbestand wäre eine serverseitige Suche mit Pagination sinnvoll.

## Reservierungen

Reservierungen sind unter `/reservations` verfügbar. Sie werden in der Tabelle `reservations` gespeichert und haben einen unveränderlichen Lebenszyklus: `active`, `cancelled` oder `fulfilled`. Stornierte und abgeholte Reservierungen bleiben sichtbar, damit die Entscheidungshistorie erhalten bleibt.

### Getroffene Regeln und Gründe

- Eine Reservierung gilt für eine Einheit eines Geräts und besitzt ein inklusives Start- und Enddatum. Berühren sich zwei Zeiträume am selben Tag, überschneiden sie sich. Das verhindert Doppelbuchungen an Übergabetagen.
- Der Zeitraum darf ab heute beginnen und muss mit `Ende >= Beginn` gültig sein. So sind Reservierungen für den aktuellen Tag möglich, ohne rückwirkende Reservierungen zu erzeugen.
- Bei der Anlage wird die Gerätezeile in einer PostgreSQL-Transaktion mit `FOR UPDATE` gesperrt. Danach werden offene Ausleihen und aktive, zeitlich überschneidende Reservierungen gezählt. Die Reservierung wird abgelehnt, sobald diese belegten Einheiten die Geräte-Menge erreichen. Damit entscheidet nicht nur die Oberfläche über Verfügbarkeit und parallele Anfragen können keine Doppelbuchung erzeugen.
- Auch eine direkte Ausleihe prüft die aktive Reservierungsbelegung. Eine aktive Reservierung reserviert eine Einheit bereits ab ihrer Anlage; deshalb wird die direkte Ausleihe abgelehnt, sobald offene Ausleihen plus aktive Reservierungen die Geräte-Menge erreichen. Bei Geräten mit mehreren Einheiten bleiben nicht reservierte Einheiten nutzbar. Die Inventaransicht zeigt den Status `Reserviert` und deaktiviert die direkte Ausleihe, sobald das Gerät reservierte Einheiten hat. Die Abholung über die Reservierung erzeugt stattdessen die Ausleihe.
- Eine offene Ausleihe blockiert einen zukünftigen Zeitraum, wenn sie kein Fälligkeitsdatum hat oder ihr Fälligkeitsdatum am bzw. nach dem Reservierungsbeginn liegt. Überfällige Ausleihen haben ein Fälligkeitsdatum in der Vergangenheit und blockieren deshalb vorsichtshalber jeden zukünftigen Zeitraum: Ohne bestätigte Rückgabe darf das Gerät nicht fest eingeplant werden.
- Eine Reservierung kann nur innerhalb ihres Zeitraums abgeholt werden. Bei der Abholung wird sie in derselben Transaktion als `fulfilled` markiert und eine normale Ausleihe mit der aktuell konfigurierten Leihfrist erzeugt. Ist die Einheit inzwischen durch eine andere offene Ausleihe belegt, wird die Abholung abgelehnt statt die Bestandsgrenze zu überschreiten.
- Stornieren, Abholen und Erstellen sind Server Actions. Better Auth prüft die Berechtigung serverseitig; normale Benutzer sehen und bearbeiten nur ihre eigenen Reservierungen. Administratoren erhalten die `read_all`, `cancel_all` und `pickup_all`-Varianten. Die Daten speichern zusätzlich die Benutzer-ID und nicht nur den damals sichtbaren Namen, weil Namen nicht eindeutig oder autoritativ sind.

Die zentralen Intervallgrenzen sind mit kleinen Unit-Tests in `tests/reservations.test.ts` abgesichert: angrenzende Zeiträume überschneiden sich, eine Lücke von einem Tag nicht, und vollständig eingeschlossene Zeiträume überschneiden sich.