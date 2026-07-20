-- ============================================================================
-- Migration : type d'affectation (normal / alternance / international / autre)
-- A exécuter après migration_affectation_voeux_pedagogiques.sql
--
-- Pourquoi : un collaborateur peut avoir répondu "oui" à l'alternance et/ou à
-- l'international, avec des modules différents pour chaque catégorie (Q1 =
-- cours normal, Q3 = alternance, Q5 = international). Sans ce champ, une fois
-- affecté à un module on ne sait plus dans quelle catégorie il a été choisi.
-- ============================================================================

ALTER TABLE `reponse_voeu_pedagogique`
  ADD COLUMN `type_affecte` varchar(20) DEFAULT NULL AFTER `module_affecte`;