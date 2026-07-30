-- ============================================================================
-- REFONTE COMPLÈTE — Vœux pédagogiques
-- Remplace les 8 questions fixes par un formulaire dynamique (questions +
-- modules/classes créés par l'admin). À exécuter en une fois.
-- ATTENTION : supprime les anciennes données de campagnes/réponses/affectations
-- de vœux pédagogiques (demande explicite : "forget everything and start new").
-- ============================================================================

DROP TABLE IF EXISTS `affectation_voeu_pedagogique`;
DROP TABLE IF EXISTS `reponse_detail_voeu_pedagogique`;
DROP TABLE IF EXISTS `reponse_voeu_pedagogique`;
DROP TABLE IF EXISTS `module_voeu_pedagogique`;
DROP TABLE IF EXISTS `question_voeu_pedagogique`;
DROP TABLE IF EXISTS `campagne_voeux_pedagogiques`;

CREATE TABLE `campagne_voeux_pedagogiques` (
  `id_campagne` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL DEFAULT 'Vœux pédagogiques',
  `statut` enum('brouillon','publiee','cloturee') NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_publication` datetime DEFAULT NULL,
  `date_cloture` datetime DEFAULT NULL,
  PRIMARY KEY (`id_campagne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `question_voeu_pedagogique` (
  `id_question` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 0,
  `type` enum('texte','choix_unique','choix_multiple','modules') NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 1,
  `options` JSON DEFAULT NULL,
  PRIMARY KEY (`id_question`),
  KEY `id_campagne` (`id_campagne`),
  CONSTRAINT `question_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `module_voeu_pedagogique` (
  `id_module` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `classes` JSON DEFAULT NULL,
  PRIMARY KEY (`id_module`),
  KEY `id_campagne` (`id_campagne`),
  CONSTRAINT `module_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reponse_voeu_pedagogique` (
  `id_reponse` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `id_collaborateur` int(11) NOT NULL,
  `date_soumission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT NULL,
  PRIMARY KEY (`id_reponse`),
  UNIQUE KEY `unique_reponse_campagne` (`id_campagne`,`id_collaborateur`),
  KEY `id_collaborateur` (`id_collaborateur`),
  CONSTRAINT `reponse_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE,
  CONSTRAINT `reponse_voeu_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reponse_detail_voeu_pedagogique` (
  `id_detail` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `valeur` JSON DEFAULT NULL,
  PRIMARY KEY (`id_detail`),
  UNIQUE KEY `unique_detail` (`id_reponse`,`id_question`),
  KEY `id_question` (`id_question`),
  CONSTRAINT `reponse_detail_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  CONSTRAINT `reponse_detail_ibfk_2` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `affectation_voeu_pedagogique` (
  `id_affectation` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_module` int(11) NOT NULL,
  `classe` varchar(100) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_affectation`),
  UNIQUE KEY `unique_classe_module` (`id_module`,`classe`),
  KEY `id_reponse` (`id_reponse`),
  CONSTRAINT `affectation_voeu_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  CONSTRAINT `affectation_voeu_ibfk_2` FOREIGN KEY (`id_module`) REFERENCES `module_voeu_pedagogique` (`id_module`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;