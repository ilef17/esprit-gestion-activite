-- Schéma ESPRIT Tech 2026 - ARP (Gestion des Activités & Analyse de Performance)
-- Aligné sur esprittech.sql (dump fourni), complété avec l'authentification
-- (mot_de_passe, identifiant_esprit) déjà présente dans le dump.

CREATE DATABASE IF NOT EXISTS esprittech;
USE esprittech;

-- --------------------------------------------------------
-- admin
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin` (
  `id_admin` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base déjà existante (ARP en prod) : décommentez si la table `admin`
-- existe déjà sans cette colonne / contrainte.
-- ALTER TABLE `admin` ADD COLUMN `identifiant_esprit` varchar(50) DEFAULT NULL AFTER `email`;
-- ALTER TABLE `admin` ADD UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`);

-- Migration pour une base déjà existante dont `responsable`/`collaborateur` n'auraient pas
-- encore la contrainte d'unicité sur `identifiant_esprit` (un même identifiant ESPRIT ne peut
-- alors être utilisé que par un seul compte, comme pour l'email) :
-- ALTER TABLE `responsable` ADD UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`);
-- ALTER TABLE `collaborateur` ADD UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`);

-- --------------------------------------------------------
-- responsable
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `responsable` (
  `id_responsable` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  -- Utilisée par le filtre Année/Semestre global (tableau de bord, listes) pour ne
  -- montrer que les comptes créés durant la période sélectionnée.
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_responsable`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration si la table existe déjà :
-- ALTER TABLE `responsable` ADD COLUMN `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- collaborateur
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collaborateur` (
  `id_collaborateur` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_collaborateur`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE `collaborateur` ADD COLUMN `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- sous_equipe
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sous_equipe` (
  `id_sous_equipe` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `id_module` varchar(30) DEFAULT NULL,
  `id_responsable` int(11) DEFAULT NULL,
  `statut` enum('active','a_suivre') NOT NULL DEFAULT 'active',
  `ouverte_voeux` tinyint(1) NOT NULL DEFAULT '0',
  `places_disponibles` int(11) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sous_equipe`),
  KEY `id_responsable` (`id_responsable`),
  CONSTRAINT `sous_equipe_ibfk_1` FOREIGN KEY (`id_responsable`) REFERENCES `responsable` (`id_responsable`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE `sous_equipe` ADD COLUMN `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- collaborateur_sousequipe (many-to-many)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collaborateur_sousequipe` (
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) NOT NULL,
  -- Date à laquelle le collaborateur a rejoint cette sous-équipe (filtre Année/Semestre).
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_collaborateur`,`id_sous_equipe`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  CONSTRAINT `collaborateur_sousequipe_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  CONSTRAINT `collaborateur_sousequipe_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE `collaborateur_sousequipe` ADD COLUMN `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- activite
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activite` (
  `id_activite` int(11) NOT NULL AUTO_INCREMENT,
  `nom_activite` varchar(150) NOT NULL,
  `description` text,
  `id_collaborateur` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_activite`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `activite_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- equipe
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipe` (
  `id_equipe` int(11) NOT NULL AUTO_INCREMENT,
  `nom_equipe` varchar(100) NOT NULL,
  `nombre` int(11) DEFAULT '0',
  `id_activite` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_equipe`),
  KEY `id_activite` (`id_activite`),
  CONSTRAINT `equipe_ibfk_1` FOREIGN KEY (`id_activite`) REFERENCES `activite` (`id_activite`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- module
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `module` (
  `id_module` int(11) NOT NULL AUTO_INCREMENT,
  `nom_module` varchar(150) NOT NULL,
  PRIMARY KEY (`id_module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- up
-- --------------------------------------------------------
DROP TABLE IF EXISTS `equipe_hors_up`;
CREATE TABLE IF NOT EXISTS `equipe_hors_up` (
  `id_up` int(11) NOT NULL AUTO_INCREMENT,
  `nom_up` varchar(150) NOT NULL,
  `id_module` varchar(30) DEFAULT NULL,
  `id_responsable` int(11) DEFAULT NULL,
  `statut` enum('active','a_suivre') NOT NULL DEFAULT 'active',
  `ouverte_voeux` tinyint(1) NOT NULL DEFAULT '0',
  `places_disponibles` int(11) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_up`),
  KEY `id_responsable` (`id_responsable`),
  CONSTRAINT `equipe_hors_up_ibfk_1` FOREIGN KEY (`id_responsable`) REFERENCES `responsable` (`id_responsable`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE `equipe_hors_up` ADD COLUMN `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `collaborateur_equipe_hors_up` (
  `id_collaborateur` int(11) NOT NULL,
  `id_up` int(11) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_collaborateur`,`id_up`),
  KEY `id_up` (`id_up`),
  CONSTRAINT `collaborateur_equipe_hors_up_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  CONSTRAINT `collaborateur_equipe_hors_up_ibfk_2` FOREIGN KEY (`id_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ALTER TABLE `collaborateur_equipe_hors_up` ADD COLUMN `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- --------------------------------------------------------
-- equipe_up (many-to-many)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipe_up` (
  `id_equipe` int(11) NOT NULL,
  `id_up` int(11) NOT NULL,
  PRIMARY KEY (`id_equipe`,`id_up`),
  KEY `id_up` (`id_up`),
  CONSTRAINT `equipe_up_ibfk_1` FOREIGN KEY (`id_equipe`) REFERENCES `equipe` (`id_equipe`) ON DELETE CASCADE,
  CONSTRAINT `equipe_up_ibfk_2` FOREIGN KEY (`id_up`) REFERENCES `up` (`id_up`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- tache  (NOUVELLE TABLE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tache` (
  `id_tache` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL,
  `description` text,
  -- Le cahier des charges limite les statuts que le collaborateur peut choisir
  -- lui-même à : "En cours", "Faite" (=validee) et "Problème de coordination".
  -- "a_faire" reste la valeur initiale posée par le responsable/admin à la création.
  -- "a_refaire" est posé par le responsable/admin (cahier des charges : Validée / À
  -- refaire / Non réalisée — "Non réalisée" correspond à 'a_faire' non traité).
  `statut` enum('a_faire','en_cours','validee','probleme_coordination','a_refaire') NOT NULL DEFAULT 'a_faire',
  `priorite` enum('haute','moyenne','basse') NOT NULL DEFAULT 'moyenne',
  `membre_concerne` varchar(150) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_echeance` date DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  -- Empêche de renvoyer deux fois le rappel J-2 (email + notification) pour une même tâche.
  `rappel_echeance_envoye` tinyint(1) NOT NULL DEFAULT '0',
  `id_collaborateur` int(11) DEFAULT NULL,
  `id_sous_equipe` int(11) DEFAULT NULL,
  -- Une tâche appartient soit à une sous_equipe (UP), soit à une equipe_hors_up —
  -- jamais les deux. Contrôlé côté application (taches.controller.js), pas par une
  -- contrainte CHECK, pour rester compatible avec les anciennes versions de MySQL.
  `id_equipe_hors_up` int(11) DEFAULT NULL,
  -- Période à laquelle la tâche a été créée (utilisée par les rapports semestriels
  -- / annuels — voir rapportGenerator.js). Renseignée automatiquement à la création
  -- d'après l'année/semestre actifs dans `parametre_systeme`.
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  PRIMARY KEY (`id_tache`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `id_equipe_hors_up` (`id_equipe_hors_up`),
  CONSTRAINT `tache_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tache_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE,
  CONSTRAINT `tache_ibfk_3` FOREIGN KEY (`id_equipe_hors_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration à exécuter si la table `tache` existe déjà avec l'ancien schéma :
-- ALTER TABLE `tache` MODIFY `statut` enum('a_faire','en_cours','validee','probleme_coordination','a_refaire') NOT NULL DEFAULT 'a_faire';
-- ALTER TABLE `tache` ADD COLUMN `membre_concerne` varchar(150) DEFAULT NULL AFTER `statut`;
-- ALTER TABLE `tache` ADD COLUMN `priorite` enum('haute','moyenne','basse') NOT NULL DEFAULT 'moyenne' AFTER `statut`;
-- ALTER TABLE `tache` ADD COLUMN `annee_universitaire` varchar(9) DEFAULT NULL AFTER `id_sous_equipe`;
-- ALTER TABLE `tache` ADD COLUMN `semestre` enum('S1','S2') DEFAULT NULL AFTER `annee_universitaire`;
-- -- Rattache les tâches déjà existantes (sans période) à la période actuellement active,
-- -- pour ne pas les faire disparaître des rapports semestriels/annuels du jour au lendemain :
-- UPDATE `tache` t JOIN `parametre_systeme` p ON p.id = 1
--   SET t.annee_universitaire = p.annee_universitaire, t.semestre = p.semestre_actif
-- -- Permet aux équipes hors UP d'avoir leurs propres tâches (jusqu'ici seules les
-- -- sous_equipe UP en avaient) :
-- ALTER TABLE `tache` ADD COLUMN `id_equipe_hors_up` int(11) DEFAULT NULL AFTER `id_sous_equipe`;
-- ALTER TABLE `tache` ADD KEY `id_equipe_hors_up` (`id_equipe_hors_up`);
-- ALTER TABLE `tache` ADD CONSTRAINT `tache_ibfk_3` FOREIGN KEY (`id_equipe_hors_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE;
--   WHERE t.annee_universitaire IS NULL;

-- --------------------------------------------------------
-- critere_evaluation  (NOUVELLE TABLE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `critere_evaluation` (
  `id_critere` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `ponderation` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_critere`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `critere_evaluation` (`id_critere`, `nom`, `code`, `ponderation`) VALUES
  (1, 'Qualité du travail', 'qualite', 30),
  (2, 'Respect des délais', 'delais', 25),
  (3, 'Implication', 'implication', 25),
  (4, 'Coordination', 'coordination', 20)
ON DUPLICATE KEY UPDATE nom = VALUES(nom), code = VALUES(code), ponderation = VALUES(ponderation);

-- --------------------------------------------------------
-- evaluation_score  (NOUVELLE TABLE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `evaluation_score` (
  `id_score` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) NOT NULL,
  `annee_universitaire` varchar(9) NOT NULL,
  `semestre` enum('S1','S2') NOT NULL,
  `score` decimal(4,2) NOT NULL,
  `detail_json` json DEFAULT NULL,
  `date_calcul` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_score`),
  UNIQUE KEY `unique_score_periode` (`id_collaborateur`,`id_sous_equipe`,`annee_universitaire`,`semestre`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  CONSTRAINT `evaluation_score_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  CONSTRAINT `evaluation_score_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- demande_hors_equipe  (NOUVELLE TABLE)
-- --------------------------------------------------------
-- Le collaborateur déclare ici une activité réalisée en dehors de sa sous-équipe, pour
-- information uniquement (pas de validation à obtenir). `id_sous_equipe` sert à retrouver
-- le responsable à notifier ; `statut` suit le même principe que les tâches.
CREATE TABLE IF NOT EXISTS `demande_hors_equipe` (
  `id_demande` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) DEFAULT NULL,
  `id_up` int(11) DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `contact_responsable` varchar(150) DEFAULT NULL,
  `date_reception` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `destinataire_verification` varchar(150) DEFAULT NULL,
  `statut` enum('a_faire','en_cours','faite') NOT NULL DEFAULT 'a_faire',
  `date_validation` datetime DEFAULT NULL,
  PRIMARY KEY (`id_demande`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `id_up` (`id_up`),
  CONSTRAINT `demande_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  CONSTRAINT `demande_hors_equipe_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `demande_hors_equipe_ibfk_3` FOREIGN KEY (`id_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration si la table existe déjà avec l'ancien schéma (demande/validation) :
-- voir migration_activite_hors_equipe.sql

-- --------------------------------------------------------
-- rapport  (NOUVELLE TABLE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rapport` (
  `id_rapport` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `format` enum('pdf','excel') NOT NULL DEFAULT 'pdf',
  `id_sous_equipe` int(11) DEFAULT NULL,
  `id_collaborateur` int(11) DEFAULT NULL,
  -- Période couverte par le rapport : 'S1'/'S2' pour un rapport semestriel,
  -- 'annuel' pour un rapport combinant les deux semestres de l'année indiquée.
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2','annuel') DEFAULT NULL,
  `date_generation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chemin_fichier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_rapport`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `rapport_ibfk_1` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE SET NULL,
  CONSTRAINT `rapport_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base déjà existante (ARP en prod) : décommentez si la table `rapport` existe déjà sans cette colonne.
-- ALTER TABLE `rapport` ADD COLUMN `id_collaborateur` int(11) DEFAULT NULL AFTER `id_sous_equipe`;
-- ALTER TABLE `rapport` ADD KEY `id_collaborateur` (`id_collaborateur`);
-- ALTER TABLE `rapport` ADD CONSTRAINT `rapport_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL;
-- ALTER TABLE `rapport` ADD COLUMN `annee_universitaire` varchar(9) DEFAULT NULL AFTER `id_collaborateur`;
-- ALTER TABLE `rapport` ADD COLUMN `semestre` enum('S1','S2','annuel') DEFAULT NULL AFTER `annee_universitaire`;

-- --------------------------------------------------------
-- sauvegarde  (NOUVELLE TABLE — historique des sauvegardes DB)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sauvegarde` (
  `id_sauvegarde` int(11) NOT NULL AUTO_INCREMENT,
  `nom_fichier` varchar(255) NOT NULL,
  `taille_octets` bigint(20) NOT NULL DEFAULT '0',
  `checksum_sha256` varchar(64) DEFAULT NULL,
  `type` enum('manuelle','automatique') NOT NULL DEFAULT 'manuelle',
  `statut` enum('ok','echec') NOT NULL DEFAULT 'ok',
  `message_erreur` varchar(255) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sauvegarde`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- parametre_systeme  (NOUVELLE TABLE — ligne singleton id=1)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parametre_systeme` (
  `id` int(11) NOT NULL DEFAULT '1',
  `annee_universitaire` varchar(9) NOT NULL DEFAULT '2025/2026',
  `semestre_actif` enum('S1','S2') NOT NULL DEFAULT 'S2',
  `mail_verification_auto` tinyint(1) NOT NULL DEFAULT '1',
  `validation_auto` tinyint(1) NOT NULL DEFAULT '1',
  `notifications_email` tinyint(1) NOT NULL DEFAULT '1',
  `sauvegarde_auto` tinyint(1) NOT NULL DEFAULT '1',
  `annees_supplementaires` JSON DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `parametre_systeme` (`id`) VALUES (1)
ON DUPLICATE KEY UPDATE id = id;

-- Migration pour une base existante : ALTER TABLE `parametre_systeme` ADD COLUMN
-- `annees_supplementaires` JSON DEFAULT NULL AFTER `sauvegarde_auto`; (à lancer manuellement)

-- --------------------------------------------------------
-- expertise  (NOUVELLE TABLE — expertises déclarées par un professeur)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expertise` (
  `id_expertise` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `libelle` varchar(150) NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_expertise`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `expertise_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- encadrement  (NOUVELLE TABLE — étudiants encadrés par un professeur)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `encadrement` (
  `id_encadrement` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `nom_etudiant` varchar(150) NOT NULL,
  `sujet` varchar(200) DEFAULT NULL,
  `type` enum('pfe','stage','mini_projet','autre') NOT NULL DEFAULT 'pfe',
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_encadrement`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `encadrement_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- activite_academique  (NOUVELLE TABLE — jury de soutenance, événements, comités d'organisation)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activite_academique` (
  `id_activite` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `type` enum('jury_soutenance','evenement','comite_organisation','membre_jury','president_jury','formation_ete','formation_hiver','formation_printemps') NOT NULL,
  `titre` varchar(200) NOT NULL,
  `role` varchar(150) DEFAULT NULL,
  `date_activite` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_activite`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `activite_academique_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base existante : le type 'jury_soutenance' reste accepté pour ne
-- pas casser les entrées déjà en base, mais n'est plus proposé côté formulaire — il est
-- remplacé par la distinction membre/président de jury, plus les 3 types de formation.
-- ALTER TABLE `activite_academique` MODIFY `type` enum('jury_soutenance','evenement','comite_organisation','membre_jury','president_jury','formation_ete','formation_hiver','formation_printemps') NOT NULL;

-- --------------------------------------------------------
-- voeu  (NOUVELLE TABLE — préférences de sous-équipe exprimées par un collaborateur,
-- classées par rang, pour une année universitaire et un semestre donnés)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `voeu` (
  `id_voeu` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) NOT NULL,
  `annee_universitaire` varchar(9) NOT NULL,
  `semestre` enum('S1','S2') NOT NULL,
  `rang` int(11) NOT NULL,
  `date_soumission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_voeu`),
  UNIQUE KEY `unique_voeu_periode` (`id_collaborateur`,`annee_universitaire`,`semestre`,`id_sous_equipe`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  CONSTRAINT `voeu_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  CONSTRAINT `voeu_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base déjà existante (ARP en prod) : exécutez ce bloc si la table
-- `voeu` n'existe pas encore (copie du CREATE TABLE ci-dessus, à lancer manuellement) :
-- CREATE TABLE IF NOT EXISTS `voeu` ( ... ) -- voir bloc ci-dessus

-- --------------------------------------------------------
-- Vœux pédagogiques (formulaire dynamique) — campagne_voeux_pedagogiques /
-- question_voeu_pedagogique / option_voeu_pedagogique / reponse_voeu_pedagogique /
-- reponse_valeur_voeu_pedagogique / affectation_voeu_pedagogique
-- Voir migration_voeux_pedagogiques_v2.sql pour le détail et la mise à jour
-- d'une base existante (l'ancien questionnaire à 8 questions fixes est
-- entièrement remplacé par ce formulaire créé par l'admin).
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campagne_voeux_pedagogiques` (
  `id_campagne` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL DEFAULT 'Vœux pédagogiques',
  `statut` enum('brouillon','publiee','cloturee') NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_publication` datetime DEFAULT NULL,
  `date_cloture` datetime DEFAULT NULL,
  PRIMARY KEY (`id_campagne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `question_voeu_pedagogique` (
  `id_question` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 0,
  `type` enum('module','choix_unique','choix_multiple','oui_non','texte') NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_question`),
  KEY `id_campagne` (`id_campagne`),
  CONSTRAINT `question_vp_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `option_voeu_pedagogique` (
  `id_option` int(11) NOT NULL AUTO_INCREMENT,
  `id_question` int(11) NOT NULL,
  `libelle` varchar(150) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 0,
  `classes` JSON DEFAULT NULL,
  PRIMARY KEY (`id_option`),
  KEY `id_question` (`id_question`),
  CONSTRAINT `option_vp_ibfk_1` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reponse_voeu_pedagogique` (
  `id_reponse` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `id_collaborateur` int(11) NOT NULL,
  `date_soumission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT NULL,
  PRIMARY KEY (`id_reponse`),
  UNIQUE KEY `unique_reponse_campagne` (`id_campagne`,`id_collaborateur`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `reponse_vp_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE,
  CONSTRAINT `reponse_vp_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reponse_valeur_voeu_pedagogique` (
  `id_valeur` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `id_option` int(11) DEFAULT NULL,
  `valeur_texte` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_valeur`),
  KEY `id_reponse` (`id_reponse`),
  KEY `id_question` (`id_question`),
  KEY `id_option` (`id_option`),
  CONSTRAINT `reponse_valeur_vp_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  CONSTRAINT `reponse_valeur_vp_ibfk_2` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE,
  CONSTRAINT `reponse_valeur_vp_ibfk_3` FOREIGN KEY (`id_option`) REFERENCES `option_voeu_pedagogique` (`id_option`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Une classe (id_question + id_option + classe) ne peut être affectée qu'une
-- seule fois : dès qu'elle est prise, elle disparaît du pool disponible.
CREATE TABLE IF NOT EXISTS `affectation_voeu_pedagogique` (
  `id_affectation` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `id_option` int(11) NOT NULL,
  `classe` varchar(150) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_affectation`),
  UNIQUE KEY `unique_classe_affectee` (`id_question`,`id_option`,`classe`),
  KEY `id_reponse` (`id_reponse`),
  CONSTRAINT `affectation_vp_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  CONSTRAINT `affectation_vp_ibfk_2` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE,
  CONSTRAINT `affectation_vp_ibfk_3` FOREIGN KEY (`id_option`) REFERENCES `option_voeu_pedagogique` (`id_option`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base déjà existante : voir migration_voeux_pedagogiques_v2.sql
-- (à lancer manuellement — supprime puis recrée les tables ci-dessus).

-- --------------------------------------------------------
-- notification (NOUVELLE TABLE)
-- --------------------------------------------------------
-- Notifications in-app (cloche) pour les 3 rôles. Comme il n'existe pas de table
-- `utilisateur` unique (admin / responsable / collaborateur sont séparés), le
-- destinataire est identifié par (id_utilisateur, type_utilisateur).
CREATE TABLE IF NOT EXISTS `notification` (
  `id_notification` int(11) NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int(11) NOT NULL,
  `type_utilisateur` enum('admin','responsable','collaborateur') NOT NULL,
  `type` varchar(40) NOT NULL,
  `titre` varchar(150) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `lien_page` varchar(60) DEFAULT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notification`),
  KEY `destinataire` (`id_utilisateur`, `type_utilisateur`, `lu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration pour une base déjà existante :
-- CREATE TABLE `notification` (...) -- voir définition ci-dessus.

-- Empêche l'envoi en double du rappel J-2 d'échéance de tâche (le cron tourne
-- une fois par jour et ne doit relancer ni l'email ni la notification déjà émis).
-- ALTER TABLE `tache` ADD COLUMN `rappel_echeance_envoye` tinyint(1) NOT NULL DEFAULT '0';

-- --------------------------------------------------------
-- Seed: sous-équipes de base (matching template UI) + un admin de test
-- --------------------------------------------------------
INSERT INTO `sous_equipe` (`nom`) VALUES
  ('Web & Mobile'), ('Data & IA'), ('Réseaux & Cloud'), ('Design & UX')
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

-- Mot de passe: "admin123" (déjà hashé en bcrypt) -- change-le après le premier login
INSERT INTO `admin` (`nom`, `email`, `mot_de_passe`) VALUES
  ('Admin ESPRIT', 'admin@esprit.tn', '$2b$10$TqxxxBbH33b8jW1w.EXg7e7T1i.TrVS7vJpu7Xx5EJF8sYwqVQ2.m')
ON DUPLICATE KEY UPDATE nom = VALUES(nom);