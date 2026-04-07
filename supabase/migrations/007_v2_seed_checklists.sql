-- InspekcjAI — New Checklist Seeds v2
-- Migration: 007_v2_seed_checklists.sql
-- Replaces old seeds with expanded checklists per spec
-- Existing checklist_items are NOT affected (template_id FK = ON DELETE SET NULL)

-- ─── Remove old templates ────────────────────────────────────────────────────
DELETE FROM checklist_templates;

-- ═════════════════════════════════════════════════════════════════════════════
-- ROCZNY — 45 elementów (6 sekcji)
-- Art. 62 ust. 1 pkt 1 Prawa Budowlanego
-- ═════════════════════════════════════════════════════════════════════════════

-- Section 1: PODSTAWOWE ELEMENTY BUDYNKU (27 elementów)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Ściany nośne / warstwa fakturowa','Art. 62 ust. 1 pkt 1a PB',10,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Fundamenty','Art. 62 ust. 1 pkt 1a PB',20,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Ściany działowe','Art. 62 ust. 1 pkt 1a PB',30,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Kominy poniżej dachu','Art. 62 ust. 1 pkt 1a PB',40,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Izolacje poziome','Art. 62 ust. 1 pkt 1a PB',50,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Izolacje pionowe','Art. 62 ust. 1 pkt 1a PB',60,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Attyki','Art. 62 ust. 1 pkt 1a PB',70,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Schody wewnętrzne','Art. 62 ust. 1 pkt 1a PB',80,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balkony','Art. 62 ust. 1 pkt 1a PB',90,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Tarasy','Art. 62 ust. 1 pkt 1a PB',100,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Podciągi','Art. 62 ust. 1 pkt 1a PB',110,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Wieńce','Art. 62 ust. 1 pkt 1a PB',120,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balustrady wewnętrzne','Art. 62 ust. 1 pkt 1a PB',130,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Filary','Art. 62 ust. 1 pkt 1a PB',140,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Gzymsy','Art. 62 ust. 1 pkt 1a PB',150,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Słupy','Art. 62 ust. 1 pkt 1a PB',160,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stropy','Art. 62 ust. 1 pkt 1a PB',170,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Konstrukcja dachu','Art. 62 ust. 1 pkt 1a PB',180,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Schody zewnętrzne','Art. 62 ust. 1 pkt 1a PB',190,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Loggie','Art. 62 ust. 1 pkt 1a PB',200,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stolarka okienna','Art. 62 ust. 1 pkt 1a PB',210,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Podjazd dla osób niepełnosprawnych','Art. 62 ust. 1 pkt 1a PB',220,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Stolarka drzwiowa','Art. 62 ust. 1 pkt 1a PB',230,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Parapety','Art. 62 ust. 1 pkt 1a PB',240,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Balustrady zewnętrzne','Art. 62 ust. 1 pkt 1a PB',250,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Kominy nad dachem','Art. 62 ust. 1 pkt 1a PB',260,'text_photos'),
  ('roczny','PODSTAWOWE ELEMENTY BUDYNKU','Opaska wokół budynku','Art. 62 ust. 1 pkt 1a PB',270,'text_photos');

-- Section 2: URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU (5 elementów)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Szyldy i reklamy','Art. 62 ust. 1 pkt 1a PB',280,'text_photos'),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Maszty','Art. 62 ust. 1 pkt 1a PB',290,'text_photos'),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Ławy kominiarskie','Art. 62 ust. 1 pkt 1a PB',300,'text_photos'),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Klimatyzatory','Art. 62 ust. 1 pkt 1a PB',310,'text_photos'),
  ('roczny','URZĄDZENIA ZAMOCOWANE DO ŚCIAN I DACHU','Anteny','Art. 62 ust. 1 pkt 1a PB',320,'text_photos');

-- Section 3: POKRYCIE DACHOWE I ODWODNIENIE (5 elementów)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Pokrycie dachowe','Art. 62 ust. 1 pkt 1a PB',330,'text_photos'),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Rynny','Art. 62 ust. 1 pkt 1a PB',340,'text_photos'),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Obróbki blacharskie','Art. 62 ust. 1 pkt 1a PB',350,'text_photos'),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Płytki odbojowe','Art. 62 ust. 1 pkt 1a PB',360,'text_photos'),
  ('roczny','POKRYCIE DACHOWE I ODWODNIENIE','Rury spustowe','Art. 62 ust. 1 pkt 1a PB',370,'text_photos');

-- Section 4: ZABEZPIECZENIE PRZECIWPOŻAROWE (4 elementy)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Hydranty','Art. 62 ust. 1 pkt 1b PB',380,'text_photos'),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Gaśnice','Art. 62 ust. 1 pkt 1b PB',390,'text_photos'),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Drzwi przeciwpożarowe','Art. 62 ust. 1 pkt 1b PB',400,'text_photos'),
  ('roczny','ZABEZPIECZENIE PRZECIWPOŻAROWE','Drogi ewakuacyjne','Art. 62 ust. 1 pkt 1b PB',410,'text_photos');

-- Section 5: ELEWACJA (2 elementy)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','ELEWACJA','Tynk elewacyjny / okładzina','Art. 62 ust. 1 pkt 1a PB',420,'text_photos'),
  ('roczny','ELEWACJA','Ocieplenie / izolacja termiczna','Art. 62 ust. 1 pkt 1a PB',430,'text_photos');

-- Section 6: OTOCZENIE BUDYNKU (2 elementy)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('roczny','OTOCZENIE BUDYNKU','Chodniki i dojścia','Art. 62 ust. 1 pkt 1a PB',440,'text_photos'),
  ('roczny','OTOCZENIE BUDYNKU','Ogrodzenie','Art. 62 ust. 1 pkt 1a PB',450,'text_photos');

-- ═════════════════════════════════════════════════════════════════════════════
-- PÓŁROCZNY — identyczny z rocznym (45 elementów)
-- Art. 62 ust. 1 pkt 1 Prawa Budowlanego
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type)
SELECT 'polroczny', section, element_name, legal_basis, sort_order, field_type
FROM checklist_templates WHERE inspection_type = 'roczny';

-- ═════════════════════════════════════════════════════════════════════════════
-- PIĘCIOLETNI — 59 elementów (roczny + 2 dodatkowe sekcje)
-- Art. 62 ust. 1 pkt 2 Prawa Budowlanego
-- ═════════════════════════════════════════════════════════════════════════════

-- Copy all annual items with updated legal basis
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type)
SELECT 'piecioletni', section, element_name, 'Art. 62 ust. 1 pkt 2 PB', sort_order, field_type
FROM checklist_templates WHERE inspection_type = 'roczny';

-- Section 7: INSTALACJE (7 elementów — tylko pięcioletni)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('piecioletni','INSTALACJE','Instalacja elektryczna','Art. 62 ust. 1 pkt 2 PB',500,'text_photos'),
  ('piecioletni','INSTALACJE','Instalacja piorunochronna','Art. 62 ust. 1 pkt 2 PB',510,'text_photos'),
  ('piecioletni','INSTALACJE','Instalacja gazowa','Art. 62 ust. 1 pkt 2 PB',520,'text_photos'),
  ('piecioletni','INSTALACJE','Wentylacja i klimatyzacja','Art. 62 ust. 1 pkt 2 PB',530,'text_photos'),
  ('piecioletni','INSTALACJE','Instalacja centralnego ogrzewania','Art. 62 ust. 1 pkt 2 PB',540,'text_photos'),
  ('piecioletni','INSTALACJE','Instalacja wodno-kanalizacyjna','Art. 62 ust. 1 pkt 2 PB',550,'text_photos'),
  ('piecioletni','INSTALACJE','Dźwigi i urządzenia dźwigowe','Art. 62 ust. 1 pkt 2 PB',560,'text_photos');

-- Section 8: ESTETYKA I ZAGOSPODAROWANIE TERENU (5 elementów — tylko pięcioletni)
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('piecioletni','ESTETYKA I ZAGOSPODAROWANIE TERENU','Estetyka budynku','Art. 62 ust. 1 pkt 2 PB',600,'text_photos'),
  ('piecioletni','ESTETYKA I ZAGOSPODAROWANIE TERENU','Zagospodarowanie terenu','Art. 62 ust. 1 pkt 2 PB',610,'text_photos'),
  ('piecioletni','ESTETYKA I ZAGOSPODAROWANIE TERENU','Mała architektura','Art. 62 ust. 1 pkt 2 PB',620,'text_photos'),
  ('piecioletni','ESTETYKA I ZAGOSPODAROWANIE TERENU','Zieleń','Art. 62 ust. 1 pkt 2 PB',630,'text_photos'),
  ('piecioletni','ESTETYKA I ZAGOSPODAROWANIE TERENU','Oświetlenie terenu','Art. 62 ust. 1 pkt 2 PB',640,'text_photos');

-- ═════════════════════════════════════════════════════════════════════════════
-- PLAC ZABAW — 83 elementy (3 grupy z różnymi field_type)
-- Normy EN 1176 / EN 1177
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Grupa A: STAN TECHNICZNY (19 elementów) — field_type = 'text_photos' ───
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('plac_zabaw','STAN TECHNICZNY','Ogrodzenie terenu','EN 1176-7',10,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Furtki i bramy wejściowe','EN 1176-7',20,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Nawierzchnia bezpieczna (amortyzująca)','EN 1177',30,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Nawierzchnia — strefy upadku','EN 1177',40,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Huśtawki','EN 1176-2',50,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Zjeżdżalnie','EN 1176-3',60,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Karuzele','EN 1176-5',70,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Huśtawki wahadłowe','EN 1176-2',80,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Urządzenia wspinaczkowe','EN 1176-1',90,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Piaskownice','EN 1176-1',100,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Sprężynowce (bujaki)','EN 1176-6',110,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Kolejki linowe (tyrolki)','EN 1176-4',120,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Trampoliny','EN 1176-1',130,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Domki i wieże zabawowe','EN 1176-1',140,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Ławki i stoły','EN 1176-7',150,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Kosze na śmieci','EN 1176-7',160,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Oświetlenie placu','EN 1176-7',170,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Tablice informacyjne i regulamin','EN 1176-7',180,'text_photos'),
  ('plac_zabaw','STAN TECHNICZNY','Zieleń i drzewa w obrębie placu','EN 1176-7',190,'text_photos');

-- ─── Grupa B: USTALENIA INNE (23 elementy) — field_type = 'yesno_desc_photos' ───
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('plac_zabaw','USTALENIA INNE','Brak ostrych krawędzi i wystających elementów','EN 1176-1',200,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Brak zagrożenia uwięzienia głowy/szyi','EN 1176-1',210,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Brak zagrożenia uwięzienia palców','EN 1176-1',220,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Brak zagrożenia uwięzienia odzieży','EN 1176-1',230,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stabilność fundamentów urządzeń','EN 1176-1',240,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan korozji elementów metalowych','EN 1176-1',250,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan elementów drewnianych (gnicie, pęknięcia)','EN 1176-1',260,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan elementów z tworzyw sztucznych','EN 1176-1',270,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan połączeń śrubowych','EN 1176-1',280,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan spawów','EN 1176-1',290,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan lin i łańcuchów','EN 1176-2',300,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan łożysk i elementów ruchomych','EN 1176-1',310,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Prawidłowe odstępy między urządzeniami','EN 1176-1',320,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Kompletność elementów urządzeń','EN 1176-1',330,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Widoczność placu z zewnątrz','EN 1176-7',340,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Dostępność dla służb ratunkowych','EN 1176-7',350,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Odległość od dróg i parkingów','EN 1176-7',360,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Brak zanieczyszczeń (szkło, śmieci, odchody)','EN 1176-7',370,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Drenaż i odprowadzenie wody','EN 1176-7',380,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Stan oznakowania wiekowego urządzeń','EN 1176-7',390,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Dane kontaktowe zarządcy na tablicy','EN 1176-7',400,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Numer alarmowy na tablicy','EN 1176-7',410,'yesno_desc_photos'),
  ('plac_zabaw','USTALENIA INNE','Czytelność regulaminu','EN 1176-7',420,'yesno_desc_photos');

-- ─── Grupa C: ZGODNOŚĆ Z NORMAMI (41 elementów) — field_type = 'yesno' ─────
INSERT INTO checklist_templates (inspection_type, section, element_name, legal_basis, sort_order, field_type) VALUES
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Certyfikaty zgodności urządzeń z EN 1176','EN 1176-1',500,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Dokumentacja techniczna urządzeń dostępna','EN 1176-7',510,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Instrukcje montażu producenta zachowane','EN 1176-7',520,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Protokoły poprzednich kontroli dostępne','EN 1176-7',530,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Dziennik kontroli placu prowadzony','EN 1176-7',540,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Huśtawki — wysokość siedziska zgodna z normą','EN 1176-2',550,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Huśtawki — strefa bezpieczeństwa zachowana','EN 1176-2',560,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Huśtawki — zawiesia sprawne','EN 1176-2',570,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Zjeżdżalnie — strefa wybiegu wystarczająca','EN 1176-3',580,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Zjeżdżalnie — barierki ochronne kompletne','EN 1176-3',590,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Zjeżdżalnie — powierzchnia ślizgu gładka','EN 1176-3',600,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Karuzele — prędkość obrotowa bezpieczna','EN 1176-5',610,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Karuzele — brak szczelin zgniatających','EN 1176-5',620,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Urządzenia wspinaczkowe — uchwyty pewne','EN 1176-1',630,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Urządzenia wspinaczkowe — max wysokość upadku','EN 1176-1',640,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Sprężynowce — sprężyny osłonięte','EN 1176-6',650,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Sprężynowce — uchwyty stabilne','EN 1176-6',660,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Piaskownica — głębokość piasku wystarczająca','EN 1176-1',670,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Piaskownica — piasek czysty','EN 1176-1',680,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Nawierzchnia — grubość zgodna z EN 1177','EN 1177',690,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Nawierzchnia — HIC test aktualny','EN 1177',700,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Brak elementów toksycznych (farby, impregnaty)','EN 1176-1',710,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Brak elementów łatwopalnych','EN 1176-1',720,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Kolejka linowa — hamulec końcowy sprawny','EN 1176-4',730,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Kolejka linowa — lina bez uszkodzeń','EN 1176-4',740,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Trampolina — siatka ochronna kompletna','EN 1176-1',750,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Trampolina — sprężyny osłonięte','EN 1176-1',760,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Ogrodzenie — wysokość min. 1.0 m','EN 1176-7',770,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Ogrodzenie — brak ostrych zakończeń','EN 1176-7',780,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Furtka — samozamykacz sprawny','EN 1176-7',790,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Brak dostępu do transformatorów / instalacji','EN 1176-7',800,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Brak zbiorników wodnych bez zabezpieczenia','EN 1176-7',810,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Rośliny — brak gatunków trujących','EN 1176-7',820,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Rośliny — brak gatunków ciernistych przy urządzeniach','EN 1176-7',830,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Powierzchnia placu zgodna z liczbą urządzeń','EN 1176-7',840,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Urządzenia posiadają tabliczki znamionowe','EN 1176-1',850,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Podłoże pod nawierzchnią stabilne','EN 1177',860,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Elementy ruchome — luz w normie','EN 1176-1',870,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Śruby i nakrętki — zabezpieczone przed odkręceniem','EN 1176-1',880,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Malowanie / impregnacja — stan powłoki','EN 1176-1',890,'yesno'),
  ('plac_zabaw','ZGODNOŚĆ Z NORMAMI','Zgodność rozmieszczenia z projektem','EN 1176-7',900,'yesno');
