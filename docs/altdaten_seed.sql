-- Altdaten der bisherigen Excel-Verleihliste.
-- Ein Kollege hat den Excel-Export bereits 1:1 in zwei Rohdaten-Tabellen
-- überführt: alle Spalten als TEXT, Werte unverändert.
-- Ziel: PostgreSQL (nutzt nur Standard-SQL).

SET client_encoding = 'UTF8';

DROP TABLE IF EXISTS alt_ausleihen;
DROP TABLE IF EXISTS alt_inventar;

CREATE TABLE alt_inventar (
    inventarnummer  TEXT,
    bezeichnung     TEXT,
    kategorie       TEXT,
    menge           TEXT,
    angeschafft_am  TEXT
);

CREATE TABLE alt_ausleihen (
    inventarnummer     TEXT,
    ausgeliehen_von    TEXT,
    ausgeliehen_am     TEXT,
    zurueckgegeben_am  TEXT
);

INSERT INTO alt_inventar (inventarnummer, bezeichnung, kategorie, menge, angeschafft_am) VALUES
('IT-001', 'Dell Latitude 5540', 'Laptop', '4', '2023-05-12'),
('IT-002', 'Logitech MX Master 3', 'Maus', '10', '12.01.2024'),
('IT-003', 'Epson EB-FH52 Beamer', 'Präsentation', '2', '2022-11-03'),
('IT-004', '  HDMI-Kabel 3m ', 'Kabel', '6', '2024-03-15'),
('IT-005', 'iPhone 14 Testgerät', 'Mobilgerät', '1', '15.08.2023'),
('IT-006', 'Makita Akkuschrauber', 'Werkzeug', '3', '2021-06-30'),
('IT-007', '', 'Werkzeug', '1', '2020-01-10'),
('IT-005', 'iPad Air Testgerät', 'Mobilgerät', '1', '02.02.2024'),
('IT-009', 'Canon EOS R6', 'Kamera', '1', '2023-09-21'),
('IT-010', 'Manfrotto Stativ', 'Kamera', '2', '2023-09-21'),
('IT-011', 'Lenovo ThinkPad T14', 'Laptop', '6', '2024-08-19'),
('IT-012', 'Dell U2723QE Monitor', 'Monitor', '8', '2024-08-19'),
('IT-013', 'Jabra Speak 750', 'Audio', '4', '2023-02-27'),
('IT-014', 'Rode Wireless GO II', 'Audio', '2', '05.06.2024'),
('IT-015', 'USB-C Dockingstation HP G5', 'Zubehör', '12', '2023-11-08'),
('IT-016', 'Samsung Galaxy S23 Testgerät', 'Mobilgerät', '2', '2024-01-29'),
('IT-017', 'Logitech Spotlight Presenter', 'Präsentation', '5', '17.03.2023'),
('IT-018', 'Bosch Laser-Entfernungsmesser', 'Messgerät', '2', '2022-05-16'),
('IT-019', 'DJI Mini 4 Pro Drohne', 'Kamera', '1', '2025-04-02'),
('IT-020', 'Anker PowerCore Powerbank', 'Zubehör', '9', '2024-10-22'),
('IT-021', 'MacBook Pro 14 M3', 'Laptop', '3', '2024-11-05'),
('IT-022', 'Elgato Stream Deck', 'Zubehör', '2', '08.09.2023'),
('IT-023', 'Nokia 3310 Testgerät', 'Mobilgerät', '0', '2019-03-01'),
('IT-024', 'Sony WH-1000XM5', 'Audio', '6', '2024-04-11'),
('IT-025', 'VGA-Adapter (Restbestand)', 'Kabel', '15', '2018-07-23'),
('IT-026', 'Fluke 117 Multimeter', 'Messgerät', '1', '2021-09-14'),
('IT-027', 'GoPro Hero 12', 'Kamera', '2', '2025-01-20'),
('IT-028', 'Surface Pro 9', 'Laptop', '2', '2023-06-08'),
('IT-029', 'Beamer-Leinwand mobil', 'Präsentation', '3', '2020-10-05'),
('IT-030', 'Kärcher Fenstersauger', 'Werkzeug', '2', '14.02.2025'),
('IT-031', 'iPad Pro 12.9 Testgerät', 'Mobilgerät', '2', '2025-03-18'),
('IT-032', 'Netzwerk-Kabeltester', 'Messgerät', '1', '2027-01-15');

INSERT INTO alt_ausleihen (inventarnummer, ausgeliehen_von, ausgeliehen_am, zurueckgegeben_am) VALUES
('IT-025', 'Felix Baumann', '2025-02-10', '2025-02-12'),
('IT-013', 'Julia Winter', '2025-03-03', '2025-03-05'),
('IT-006', 'Tobias Lang', '2025-03-17', '2025-03-21'),
('IT-017', 'Anna Schmidt', '2025-04-01', '2025-04-02'),
('IT-011', 'Nina Krüger', '2025-04-14', '2025-05-02'),
('IT-021', 'Marc Vogel', '2025-05-06', '2025-05-09'),
('IT-015', 'David Wolf', '2025-05-19', '2025-06-30'),
('IT-003', 'Tim Becker', '2025-06-11', '2025-06-12'),
('IT-024', 'Sarah Albrecht', '2025-07-07', '2025-07-11'),
('IT-019', 'Lukas Brandt', '2025-08-04', '2025-08-08'),
('IT-027', 'Mehmet Aydin', '2025-08-25', '2025-09-01'),
('IT-001', 'Clara Vogt', '2025-09-15', '2025-10-01'),
('IT-012', 'Jonas Weber', '2025-09-29', '2025-10-13'),
('IT-018', 'Paul Neumann', '13.10.2025', '2025-10-15'),
('IT-016', 'Lisa Hoffmann', '2025-11-03', '2025-11-17'),
('IT-020', 'Sofia Keller', '2025-11-24', '2025-11-25'),
('IT-028', 'Julia Winter', '2025-12-01', '2026-01-07'),
('IT-002', 'Nina Krüger', '2025-12-15', '2025-12-16'),
('IT-011', 'Felix Baumann', '2026-01-12', '2026-01-26'),
('IT-026', 'Tobias Lang', '2026-01-19', '2026-01-21'),
('IT-014', 'Clara Vogt', '2026-02-09', '2026-02-13'),
('IT-029', 'Mehmet Aydin', '2026-02-23', '24.02.2026'),
('IT-021', 'Sarah Albrecht', '2026-03-09', '2026-03-20'),
('IT-009', 'David Wolf', '2026-03-16', '2026-03-18'),
('IT-031', 'Anna Schmidt', '2026-03-30', '2026-04-03'),
('IT-017', 'Paul Neumann', '2026-04-07', '2026-04-08'),
('IT-024', 'Lisa Hoffmann', '2026-04-20', '2026-05-04'),
('IT-005', 'Nina Krüger', '2026-05-05', '2026-05-08'),
('IT-002', 'Tim Becker', '2026-05-11', '2026-05-12'),
('IT-030', 'Sofia Keller', '2026-05-18', '2026-05-19'),
('IT-012', 'Julia Winter', '2026-05-26', '2026-06-09'),
('IT-042', 'Paul Neumann', '2026-06-01', ''),
('IT-001', 'Anna Schmidt', '2026-06-02', '2026-06-16'),
('IT-015', 'Mehmet Aydin', '2026-06-08', ''),
('IT-006', 'Lisa Hoffmann', '2026-06-15', '2026-06-10'),
('IT-016', 'Felix Baumann', '2026-06-17', ''),
('IT-001', 'Jonas Weber', '2026-06-20', ''),
('IT-021', 'Clara Vogt', '2026-06-22', ''),
('IT-012', 'Tobias Lang', '2026-06-24', ''),
('IT-024', 'David Wolf', '2026-06-29', ''),
('IT-001', 'Miriam Fischer', '2026-07-01', ''),
('IT-010', 'Jonas Weber', '01.07.2026', ''),
('IT-021', 'Sarah Albrecht', '2026-07-02', ''),
('IT-005', 'Marc Vogel', '2026-07-03', ''),
('IT-011', 'Sofia Keller', '2026-07-06', ''),
('IT-013', 'Nina Krüger', '2026-07-07', ''),
('IT-009', 'Lukas Brandt', '2026-07-08', ''),
('IT-015', 'Jonas Weber', '2026-07-09', ''),
('IT-003', 'Anna Schmidt', '2026-07-10', ''),
('IT-027', 'Julia Winter', '2026-07-13', ''),
('IT-009', 'Sofia Keller', '2026-07-14', ''),
('IT-021', 'Tim Becker', '2026-07-14', ''),
('IT-012', 'Miriam Fischer', '2026-07-15', ''),
('IT-031', 'Mehmet Aydin', '2026-07-15', ''),
('IT-015', 'Paul Neumann', '2026-07-16', ''),
('IT-011', 'David Wolf', '2026-07-16', ''),
('IT-019', 'Lukas Brandt', '2026-07-16', '');
