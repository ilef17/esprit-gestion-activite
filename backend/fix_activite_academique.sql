-- Aligne activite_academique côté Aiven sur la base WAMP (colonnes annee_universitaire/
-- semestre déjà présentes en local mais absentes de l'ancien schema.sql).
ALTER TABLE `activite_academique`
  ADD COLUMN `annee_universitaire` varchar(9) DEFAULT NULL,
  ADD COLUMN `semestre` enum('S1','S2') DEFAULT NULL;
