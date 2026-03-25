-- InspekcjAI — Seed: Checklist Templates
-- Migration: 004_seed_checklists.sql
-- Based on Art. 62 Prawa Budowlanego + EN 1176 for playground

-- ─── Subscription Plans ───────────────────────────────────────────────────────
INSERT INTO subscription_plans (name, label, price_pln, report_limit, inspector_limit, features) VALUES
  ('free',    'Darmowy',  0,   3,    1,    '{"3 raporty miesięcznie","Wszystkie typy inspekcji","PDF export","Podpisy cyfrowe"}'),
  ('pro',     'PRO',      99,  NULL, 1,    '{"Nielimitowane raporty","Wszystkie typy inspekcji","PDF export","Podpisy cyfrowe","AI transkrypcja","AI analiza zdjęć","Priorytetowe wsparcie"}'),
  ('company', 'Firma',    249, NULL, NULL, '{"Nielimitowane raporty","Wielu inspektorów","Wszystkie funkcje PRO","Panel zarządzania zespołem","Wspólny branding firmy"}');

-- ─── Annual Inspection Checklist (roczny + półroczny) ────────────────────────
-- Section: PODSTAWOWE ELEMENTY BUDYNKU
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Ściany nośne / warstwa fakturowa','Art. 62 ust. 1 pkt 1a PB',10),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Fundamenty','Art. 62 ust. 1 pkt 1a PB',20),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Ściany działowe','Art. 62 ust. 1 pkt 1a PB',30),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Kominy poniżej dachu','Art. 62 ust. 1 pkt 1a PB',40),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Izolacje poziome','Art. 62 ust. 1 pkt 1a PB',50),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Izolacje pionowe','Art. 62 ust. 1 pkt 1a PB',60),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Attyki','Art. 62 ust. 1 pkt 1a PB',70),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Schody wewnętrzne','Art. 62 ust. 1 pkt 1a PB',80),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balkony','Art. 62 ust. 1 pkt 1a PB',90),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Tarasy','Art. 62 ust. 1 pkt 1a PB',100),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Podciągi','Art. 62 ust. 1 pkt 1a PB',110),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Wieńce','Art. 62 ust. 1 pkt 1a PB',120),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balustrady wewnętrzne','Art. 62 ust. 1 pkt 1a PB',130),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Filary','Art. 62 ust. 1 pkt 1a PB',140),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Gzymsy','Art. 62 ust. 1 pkt 1a PB',150),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Słupy','Art. 62 ust. 1 pkt 1a PB',160),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stropy','Art. 62 ust. 1 pkt 1a PB',170),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Konstrukcja dachu','Art. 62 ust. 1 pkt 1a PB',180),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Schody zewnętrzne','Art. 62 ust. 1 pkt 1a PB',190),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Loggie','Art. 62 ust. 1 pkt 1a PB',200),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stolarka okienna','Art. 62 ust. 1 pkt 1a PB',210),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Podjazd dla osób niepełnosprawnych','Art. 62 ust. 1 pkt 1a PB',220),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stolarka drzwiowa','Art. 62 ust. 1 pkt 1a PB',230),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Parapety','Art. 62 ust. 1 pkt 1a PB',240),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balustrady zewnętrzne','Art. 62 ust. 1 pkt 1a PB',250),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Kominy nad dachem','Art. 62 ust. 1 pkt 1a PB',260),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Opaska wokół budynku','Art. 62 ust. 1 pkt 1a PB',270);

-- Section: URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Szyldy i reklamy','Art. 62 ust. 1 pkt 1a PB',280),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Maszty','Art. 62 ust. 1 pkt 1a PB',290),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Ławy kominiarskie','Art. 62 ust. 1 pkt 1a PB',300),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Klimatyzatory','Art. 62 ust. 1 pkt 1a PB',310),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Anteny','Art. 62 ust. 1 pkt 1a PB',320);

-- Section: POKRYCIE DACHOWE I ODWODNIENIE
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Pokrycie dachowe','Art. 62 ust. 1 pkt 1a PB',330),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Rynny','Art. 62 ust. 1 pkt 1a PB',340),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Obróbki blacharskie','Art. 62 ust. 1 pkt 1a PB',350),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Płytki odbojowe','Art. 62 ust. 1 pkt 1a PB',360),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Rury spustowe','Art. 62 ust. 1 pkt 1a PB',370);

-- Section: ZABEZPIECZENIE PRZECIWPOŻAROWE
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Hydranty','Art. 62 ust. 1 pkt 1b PB',380),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Gaśnice','Art. 62 ust. 1 pkt 1b PB',390),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Drzwi przeciwpożarowe','Art. 62 ust. 1 pkt 1b PB',400),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Drogi ewakuacyjne','Art. 62 ust. 1 pkt 1b PB',410);

-- ─── Five-year Inspection (pięcioletni) — extends annual ─────────────────────
-- Copy all annual items
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order)
SELECT 'piecioletni', section, element_name, 'Art. 62 ust. 1 pkt 2 PB', sort_order
FROM checklist_templates WHERE inspection_type = 'roczny';

-- Add 5-year specific items
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('piecioletni','INSTALACJE','Instalacja elektryczna','Art. 62 ust. 1 pkt 2 PB',500),
  ('piecioletni','INSTALACJE','Instalacja piorunochronna','Art. 62 ust. 1 pkt 2 PB',510),
  ('piecioletni','INSTALACJE','Instalacja gazowa','Art. 62 ust. 1 pkt 2 PB',520),
  ('piecioletni','INSTALACJE','Wentylacja i klimatyzacja','Art. 62 ust. 1 pkt 2 PB',530),
  ('piecioletni','INSTALACJE','Instalacja centralnego ogrzewania','Art. 62 ust. 1 pkt 2 PB',540),
  ('piecioletni','INSTALACJE','Instalacja wodno-kanalizacyjna','Art. 62 ust. 1 pkt 2 PB',550),
  ('piecioletni','INSTALACJE','Dźwigi i urządzenia dźwigowe','Art. 62 ust. 1 pkt 2 PB',560);

-- ─── Playground Inspection (plac_zabaw) — EN 1176 ────────────────────────────
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order) VALUES
  ('plac_zabaw','STAN OGÓLNY','Ogrodzenie terenu','EN 1176-1',10),
  ('plac_zabaw','STAN OGÓLNY','Nawierzchnia bezpieczna (amortyzująca)','EN 1177',20),
  ('plac_zabaw','STAN OGÓLNY','Tablice informacyjne i regulamin','EN 1176-7',30),
  ('plac_zabaw','URZĄDZENIA','Huśtawki','EN 1176-2',40),
  ('plac_zabaw','URZĄDZENIA','Zjeżdżalnie','EN 1176-3',50),
  ('plac_zabaw','URZĄDZENIA','Karuzele','EN 1176-5',60),
  ('plac_zabaw','URZĄDZENIA','Huśtawki wahadłowe','EN 1176-2',70),
  ('plac_zabaw','URZĄDZENIA','Urządzenia wspinaczkowe','EN 1176-1',80),
  ('plac_zabaw','URZĄDZENIA','Piaskownice','EN 1176-1',90),
  ('plac_zabaw','URZĄDZENIA','Ławki i stoły','EN 1176-1',100),
  ('plac_zabaw','URZĄDZENIA','Kosze na śmieci','EN 1176-7',110),
  ('plac_zabaw','BEZPIECZEŃSTWO','Brak ostrych krawędzi i wystających elementów','EN 1176-1',120),
  ('plac_zabaw','BEZPIECZEŃSTWO','Brak zagrożenia uwięzienia / zablokowania','EN 1176-1',130),
  ('plac_zabaw','BEZPIECZEŃSTWO','Stabilność fundamentów urządzeń','EN 1176-1',140),
  ('plac_zabaw','BEZPIECZEŃSTWO','Stan korozji elementów metalowych','EN 1176-1',150),
  ('plac_zabaw','BEZPIECZEŃSTWO','Stan elementów drewnianych','EN 1176-1',160),
  ('plac_zabaw','BEZPIECZEŃSTWO','Stan połączeń i śrub','EN 1176-1',170);
