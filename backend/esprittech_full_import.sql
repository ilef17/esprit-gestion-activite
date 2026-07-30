SET FOREIGN_KEY_CHECKS=0;
-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : jeu. 30 juil. 2026 à 20:23
-- Version du serveur :  5.7.31
-- Version de PHP : 7.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `esprittech`
--

-- --------------------------------------------------------

--
-- Structure de la table `activite_academique`
--

DROP TABLE IF EXISTS `activite_academique`;
CREATE TABLE IF NOT EXISTS `activite_academique` (
  `id_activite` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `type` enum('jury_soutenance','evenement','comite_organisation','membre_jury','president_jury','formation_ete','formation_hiver','formation_printemps') NOT NULL,
  `titre` varchar(200) NOT NULL,
  `role` varchar(150) DEFAULT NULL,
  `date_activite` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  PRIMARY KEY (`id_activite`),
  KEY `id_collaborateur` (`id_collaborateur`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `activite_academique`
--

INSERT INTO `activite_academique` (`id_activite`, `id_collaborateur`, `type`, `titre`, `role`, `date_activite`, `description`, `date_ajout`, `annee_universitaire`, `semestre`) VALUES
(1, 8, 'evenement', 'evenement', 'organisateur', '2026-07-23', NULL, '2026-07-21 09:54:25', '2025/2026', 'S2'),
(2, 8, 'formation_hiver', 'java', NULL, '2026-07-24', NULL, '2026-07-21 10:33:42', '2025/2026', 'S2'),
(3, 7, 'formation_printemps', 'java', NULL, '2026-07-23', NULL, '2026-07-21 20:43:53', '2025/2026', 'S2'),
(4, 8, 'evenement', 'sparkC++', 'coach', '2026-07-01', NULL, '2026-07-28 15:19:02', '2025/2026', 'S2'),
(5, 8, 'comite_organisation', 'cool algo', NULL, '2026-06-10', NULL, '2026-07-28 15:19:49', '2025/2026', 'S2'),
(6, 8, 'evenement', 'Evenement C', 'coordinateur', '2026-06-30', NULL, '2026-07-28 15:21:12', '2025/2026', 'S2');

-- --------------------------------------------------------

--
-- Structure de la table `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `id_admin` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `notifications_email` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `admin`
--

INSERT INTO `admin` (`id_admin`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `notifications_email`) VALUES
(1, 'Adminito ESPRIT', 'zaied.ilef138@gmail.com', '253JFT6523', '$2a$10$2Za1VWSi/k1voWDwRRHNSOtHNzG8GVtUPr/QApN5AjtJG25tRSe3O', 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `affectation_voeu_pedagogique`
--

DROP TABLE IF EXISTS `affectation_voeu_pedagogique`;
CREATE TABLE IF NOT EXISTS `affectation_voeu_pedagogique` (
  `id_affectation` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_module` int(11) NOT NULL,
  `classe` varchar(100) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_affectation`),
  UNIQUE KEY `unique_classe_module` (`id_module`,`classe`),
  KEY `id_reponse` (`id_reponse`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `affectation_voeu_pedagogique`
--

INSERT INTO `affectation_voeu_pedagogique` (`id_affectation`, `id_reponse`, `id_module`, `classe`, `date_affectation`) VALUES
(1, 1, 3, '2A30', '2026-07-29 21:46:53'),
(2, 2, 3, '2A63', '2026-07-29 21:47:01'),
(3, 1, 4, '3A12', '2026-07-29 21:47:08'),
(4, 2, 6, '3A63', '2026-07-29 21:47:14'),
(5, 2, 3, '2A70', '2026-07-29 21:54:01'),
(6, 1, 3, '2A32', '2026-07-29 21:54:03'),
(7, 1, 4, '3A63', '2026-07-29 22:02:22');

-- --------------------------------------------------------

--
-- Structure de la table `annee_universitaire_creee`
--

DROP TABLE IF EXISTS `annee_universitaire_creee`;
CREATE TABLE IF NOT EXISTS `annee_universitaire_creee` (
  `annee` varchar(9) NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`annee`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `annee_universitaire_creee`
--

INSERT INTO `annee_universitaire_creee` (`annee`, `date_creation`) VALUES
('2025/2026', '2026-07-30 19:38:59'),
('2028/2029', '2026-07-30 19:40:05');

-- --------------------------------------------------------

--
-- Structure de la table `campagne_voeux_pedagogiques`
--

DROP TABLE IF EXISTS `campagne_voeux_pedagogiques`;
CREATE TABLE IF NOT EXISTS `campagne_voeux_pedagogiques` (
  `id_campagne` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL DEFAULT 'Vœux pédagogiques',
  `statut` enum('brouillon','publiee','cloturee') NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_publication` datetime DEFAULT NULL,
  `date_cloture` datetime DEFAULT NULL,
  PRIMARY KEY (`id_campagne`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `campagne_voeux_pedagogiques`
--

INSERT INTO `campagne_voeux_pedagogiques` (`id_campagne`, `titre`, `statut`, `date_creation`, `date_publication`, `date_cloture`) VALUES
(7, 'voeux 2026/2027', 'cloturee', '2026-07-29 09:22:10', '2026-07-29 13:43:32', '2026-07-29 13:45:52'),
(8, 'kkkof', 'publiee', '2026-07-29 21:17:15', '2026-07-29 21:24:44', NULL),
(10, 'voeux', 'brouillon', '2026-07-29 22:00:44', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `collaborateur`
--

DROP TABLE IF EXISTS `collaborateur`;
CREATE TABLE IF NOT EXISTS `collaborateur` (
  `id_collaborateur` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `notifications_email` tinyint(1) NOT NULL DEFAULT '1',
  `profil_visible` tinyint(1) NOT NULL DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_collaborateur`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `collaborateur`
--

INSERT INTO `collaborateur` (`id_collaborateur`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `notifications_email`, `profil_visible`, `date_creation`) VALUES
(7, 'ilef zayed', 'ilef.zayed138@gmail.com', '253JFT5450', '$2a$10$oFvLKKJILCCCdBEHGA3pm.piepUDPjzx5HIxuCFa2LwpR.SGXHj5C', 1, 1, 1, '2026-07-17 20:25:57'),
(8, 'ichrak riahii', 'ichrak.riahi@gmail.com', '253JFT4502', '$2a$10$v2HuFXLRqz7tkrYntEfkRu31JeGgg9qlje0qUZoTrHBDoMa.i/O/C', 1, 1, 1, '2026-07-17 20:25:57'),
(9, 'Ahmed hamoud', 'ahmed@gmail.com', '253JFt1236', '$2a$10$Ex2FgaX3QRYgnYMy.m0C/.BF0dJKrcrYplhuWO/MyHADnxqw0oXf.', 1, 1, 1, '2026-07-17 20:25:57'),
(13, 'Zayed ilef', 'ilef.zayed@esprit.tn', '253JFT1235', '$2a$10$TNNTF5DSvY5geSEh89/jFuaBC2d8pZJHm2LqpSykedbChajuGu8Hm', 1, 1, 1, '2026-07-21 09:05:20'),
(14, 'Nawel Laouini', 'Nawel.Laouini@esprit.tn', '253JFT5789', '$2a$10$cT4HNFhIdYwqmiBZpsRavOY7wSrMQzCaCZSfyic2hxoNTYo4tx7.i', 1, 1, 1, '2026-07-21 09:37:07'),
(15, 'iyed zaied', 'iyed@gmail.com', '253JFT5489', '$2a$10$lStGpMKwfnGzfaBxft.Jy.7LJv/njEdNbKO13Uisg5PL7fgbn9whe', 1, 1, 1, '2026-07-26 12:09:45');

-- --------------------------------------------------------

--
-- Structure de la table `collaborateur_equipe_hors_up`
--

DROP TABLE IF EXISTS `collaborateur_equipe_hors_up`;
CREATE TABLE IF NOT EXISTS `collaborateur_equipe_hors_up` (
  `id_collaborateur` int(11) NOT NULL,
  `id_up` int(11) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_collaborateur`,`id_up`),
  KEY `id_up` (`id_up`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `collaborateur_equipe_hors_up`
--

INSERT INTO `collaborateur_equipe_hors_up` (`id_collaborateur`, `id_up`, `date_affectation`) VALUES
(8, 5, '2026-07-21 09:38:58'),
(9, 5, '2026-07-21 09:38:58'),
(13, 5, '2026-07-21 11:42:22');

-- --------------------------------------------------------

--
-- Structure de la table `collaborateur_sousequipe`
--

DROP TABLE IF EXISTS `collaborateur_sousequipe`;
CREATE TABLE IF NOT EXISTS `collaborateur_sousequipe` (
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) NOT NULL,
  `date_affectation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nombre_classes` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_collaborateur`,`id_sous_equipe`),
  KEY `id_sous_equipe` (`id_sous_equipe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `collaborateur_sousequipe`
--

INSERT INTO `collaborateur_sousequipe` (`id_collaborateur`, `id_sous_equipe`, `date_affectation`, `nombre_classes`) VALUES
(7, 4, '2026-07-17 20:43:07', 0),
(7, 8, '2026-07-30 11:26:20', 0),
(8, 4, '2026-07-17 20:43:07', 0),
(9, 4, '2026-07-28 15:44:08', 0),
(9, 5, '2026-07-17 20:44:20', 0),
(14, 4, '2026-07-28 15:44:17', 0),
(14, 5, '2026-07-22 10:08:49', 0),
(15, 4, '2026-07-26 16:54:09', 0),
(15, 8, '2026-07-28 10:22:19', 0);

-- --------------------------------------------------------

--
-- Structure de la table `critere_evaluation`
--

DROP TABLE IF EXISTS `critere_evaluation`;
CREATE TABLE IF NOT EXISTS `critere_evaluation` (
  `id_critere` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `ponderation` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_critere`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `critere_evaluation`
--

INSERT INTO `critere_evaluation` (`id_critere`, `nom`, `code`, `ponderation`) VALUES
(1, 'Qualité du travail', 'qualite', 29),
(2, 'Respect des délais', 'delais', 20),
(3, 'Implication', 'implication', 21),
(4, 'Coordination', 'coordination', 20),
(6, 'Activité Au Sein ESPRIT', 'activite_ecole', 10);

-- --------------------------------------------------------

--
-- Structure de la table `demande_equipe_notification`
--

DROP TABLE IF EXISTS `demande_equipe_notification`;
CREATE TABLE IF NOT EXISTS `demande_equipe_notification` (
  `id_demande` int(11) NOT NULL,
  `type_equipe` enum('sous_equipe','hors_up') NOT NULL,
  `id_equipe` int(11) NOT NULL,
  PRIMARY KEY (`id_demande`,`type_equipe`,`id_equipe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `demande_equipe_notification`
--

INSERT INTO `demande_equipe_notification` (`id_demande`, `type_equipe`, `id_equipe`) VALUES
(23, 'sous_equipe', 4);

-- --------------------------------------------------------

--
-- Structure de la table `demande_hors_equipe`
--

DROP TABLE IF EXISTS `demande_hors_equipe`;
CREATE TABLE IF NOT EXISTS `demande_hors_equipe` (
  `id_demande` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `contact_responsable` varchar(150) DEFAULT NULL,
  `date_reception` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `destinataire_verification` varchar(150) DEFAULT NULL,
  `statut` enum('a_faire','en_cours','faite') NOT NULL DEFAULT 'a_faire',
  `date_validation` datetime DEFAULT NULL,
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  `id_up` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_demande`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `demande_hors_equipe`
--

INSERT INTO `demande_hors_equipe` (`id_demande`, `id_collaborateur`, `id_sous_equipe`, `titre`, `description`, `date_debut`, `date_fin`, `contact_responsable`, `date_reception`, `destinataire_verification`, `statut`, `date_validation`, `annee_universitaire`, `semestre`, `id_up`) VALUES
(23, 8, 4, 'redaction examen', 'redaction examen', '2026-08-01', '2026-08-05', 'Ahmed hamoud', '2026-07-30 10:46:46', NULL, 'a_faire', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `encadrement`
--

DROP TABLE IF EXISTS `encadrement`;
CREATE TABLE IF NOT EXISTS `encadrement` (
  `id_encadrement` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `nom_etudiant` varchar(150) NOT NULL,
  `sujet` varchar(200) DEFAULT NULL,
  `type` enum('pfe','stage','mini_projet','autre') NOT NULL DEFAULT 'pfe',
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `semestre` enum('S1','S2') DEFAULT NULL,
  PRIMARY KEY (`id_encadrement`),
  KEY `id_collaborateur` (`id_collaborateur`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `encadrement`
--

INSERT INTO `encadrement` (`id_encadrement`, `id_collaborateur`, `nom_etudiant`, `sujet`, `type`, `annee_universitaire`, `date_ajout`, `semestre`) VALUES
(2, 8, 'ilef zayed', 'sujet 45', 'pfe', '2025/2026', '2026-07-21 09:53:26', 'S2');

-- --------------------------------------------------------

--
-- Structure de la table `equipe_hors_up`
--

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
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  PRIMARY KEY (`id_up`),
  KEY `id_module` (`id_module`),
  KEY `id_responsable_idx` (`id_responsable`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `equipe_hors_up`
--

INSERT INTO `equipe_hors_up` (`id_up`, `nom_up`, `id_module`, `id_responsable`, `statut`, `ouverte_voeux`, `places_disponibles`, `date_creation`, `annee_universitaire`, `semestre`) VALUES
(5, 'equipe', 'eq-203', 11, 'active', 0, 0, '2026-07-21 09:38:58', '2025/2026', 'S2');

-- --------------------------------------------------------

--
-- Structure de la table `evaluation_score`
--

DROP TABLE IF EXISTS `evaluation_score`;
CREATE TABLE IF NOT EXISTS `evaluation_score` (
  `id_score` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `id_sous_equipe` int(11) DEFAULT NULL,
  `id_up` int(11) DEFAULT NULL,
  `type_equipe` enum('up','hors_up') NOT NULL DEFAULT 'up',
  `equipe_key` int(11) DEFAULT NULL,
  `annee_universitaire` varchar(9) NOT NULL,
  `semestre` enum('S1','S2') NOT NULL,
  `score` decimal(4,2) NOT NULL,
  `detail_json` json DEFAULT NULL,
  `date_calcul` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_score`),
  UNIQUE KEY `unique_score_periode` (`id_collaborateur`,`type_equipe`,`equipe_key`,`annee_universitaire`,`semestre`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `evaluation_score_ibfk_3` (`id_up`)
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `evaluation_score`
--

INSERT INTO `evaluation_score` (`id_score`, `id_collaborateur`, `id_sous_equipe`, `id_up`, `type_equipe`, `equipe_key`, `annee_universitaire`, `semestre`, `score`, `detail_json`, `date_calcul`) VALUES
(187, 7, 4, NULL, 'up', 4, '2025/2026', 'S2', '1.54', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 15.38, \"ratio\": 0.77, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(188, 8, 4, NULL, 'up', 4, '2025/2026', 'S2', '2.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(189, 9, 4, NULL, 'up', 4, '2025/2026', 'S2', '0.77', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 7.69, \"ratio\": 0.38, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(190, 14, 4, NULL, 'up', 4, '2025/2026', 'S2', '0.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(191, 15, 4, NULL, 'up', 4, '2025/2026', 'S2', '0.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(192, 9, 5, NULL, 'up', 5, '2025/2026', 'S2', '2.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(193, 14, 5, NULL, 'up', 5, '2025/2026', 'S2', '0.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(194, 7, 8, NULL, 'up', 8, '2025/2026', 'S2', '2.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(195, 15, 8, NULL, 'up', 8, '2025/2026', 'S2', '0.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(196, 8, NULL, 5, 'hors_up', 5, '2025/2026', 'S2', '2.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(197, 9, NULL, 5, 'hors_up', 5, '2025/2026', 'S2', '0.55', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 5.45, \"ratio\": 0.27, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44'),
(198, 13, NULL, 5, 'hors_up', 5, '2025/2026', 'S2', '0.00', '{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}', '2026-07-30 11:46:44');

-- --------------------------------------------------------

--
-- Structure de la table `expertise`
--

DROP TABLE IF EXISTS `expertise`;
CREATE TABLE IF NOT EXISTS `expertise` (
  `id_expertise` int(11) NOT NULL AUTO_INCREMENT,
  `id_collaborateur` int(11) NOT NULL,
  `libelle` varchar(150) NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_expertise`),
  KEY `id_collaborateur` (`id_collaborateur`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `expertise`
--

INSERT INTO `expertise` (`id_expertise`, `id_collaborateur`, `libelle`, `date_ajout`) VALUES
(5, 7, 'ia', '2026-07-21 20:44:20'),
(6, 9, 'push', '2026-07-22 10:18:40'),
(7, 8, 'ia', '2026-07-27 11:47:34'),
(9, 15, 'proba', '2026-07-30 12:08:27');

-- --------------------------------------------------------

--
-- Structure de la table `module_voeu_pedagogique`
--

DROP TABLE IF EXISTS `module_voeu_pedagogique`;
CREATE TABLE IF NOT EXISTS `module_voeu_pedagogique` (
  `id_module` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `id_question` int(11) DEFAULT NULL,
  `nom` varchar(150) NOT NULL,
  `niveau` varchar(50) DEFAULT NULL,
  `classes` json DEFAULT NULL,
  PRIMARY KEY (`id_module`),
  KEY `id_campagne` (`id_campagne`),
  KEY `id_question` (`id_question`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `module_voeu_pedagogique`
--

INSERT INTO `module_voeu_pedagogique` (`id_module`, `id_campagne`, `id_question`, `nom`, `niveau`, `classes`) VALUES
(2, 7, 4, 'algo', NULL, '[\"3A63\", \"3b12\", \"3A12\"]'),
(3, 8, 13, 'algo', '2A', '[\"2A30\", \"2A70\", \"2A63\", \"2A32\"]'),
(4, 8, 13, 'proxy', '3A', '[\"3A21\", \"3A63\", \"3A12\", \"3A42\"]'),
(5, 8, 13, 'proba', '3B', '[\"3B25\", \"3B12\", \"3B14\", \"3B24\"]'),
(6, 8, 13, 'unix', '3A', '[\"3A12\", \"3A63\", \"3A11\", \"3A25\"]');

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
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
  KEY `destinataire` (`id_utilisateur`,`type_utilisateur`,`lu`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `notification`
--

INSERT INTO `notification` (`id_notification`, `id_utilisateur`, `type_utilisateur`, `type`, `titre`, `message`, `lien_page`, `lu`, `date_creation`) VALUES
(82, 9, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 13:43:32'),
(83, 8, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 1, '2026-07-29 13:43:32'),
(84, 7, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 1, '2026-07-29 13:43:32'),
(85, 15, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 13:43:32'),
(86, 14, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 13:43:32'),
(87, 13, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 13:43:32'),
(88, 9, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 21:24:44'),
(89, 8, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 1, '2026-07-29 21:24:44'),
(90, 7, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 1, '2026-07-29 21:24:44'),
(91, 15, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 21:24:44'),
(92, 14, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 21:24:44'),
(93, 13, 'collaborateur', 'campagne_voeux', 'Vœux pédagogiques ouverts', 'Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant', 'voeux-pedagogiques', 0, '2026-07-29 21:24:44'),
(94, 8, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"2A30\"', 'voeux-pedagogiques', 1, '2026-07-29 21:46:53'),
(95, 7, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"2A63\"', 'voeux-pedagogiques', 1, '2026-07-29 21:47:01'),
(96, 8, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"3A12\"', 'voeux-pedagogiques', 1, '2026-07-29 21:47:08'),
(97, 7, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"3A63\"', 'voeux-pedagogiques', 1, '2026-07-29 21:47:14'),
(98, 7, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"2A70\"', 'voeux-pedagogiques', 1, '2026-07-29 21:54:01'),
(99, 8, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"2A32\"', 'voeux-pedagogiques', 1, '2026-07-29 21:54:03'),
(100, 8, 'collaborateur', 'affectation_pedagogique', 'Nouvelle classe affectée', 'Vous avez été affecté(e) à la classe \"3A63\"', 'voeux-pedagogiques', 1, '2026-07-29 22:02:22'),
(101, 8, 'collaborateur', 'tache_assignee', 'Nouvelle tâche assignée', 'Adminito ESPRIT vous a assigné la tâche \"njjj\"', 'taches', 1, '2026-07-29 22:57:36'),
(102, 5, 'responsable', 'probleme_coordination', 'Problème de coordination signalé', 'ichrak riahii a signalé un problème de coordination sur la tâche \"njjj\" : hhhhhuuuhh uuuuh jkkk', 'taches', 1, '2026-07-29 22:58:39'),
(103, 8, 'collaborateur', 'tache_echeance', 'Échéance dans 2 jours', 'La tâche \"njjj\" arrive à échéance le 01/08/2026', 'taches', 1, '2026-07-30 08:03:16'),
(104, 5, 'responsable', 'activite_hors_equipe', 'Activité hors-équipe déclarée', 'ichrak riahii a signalé une activité en dehors de la sous-équipe : \"intervention\"', 'horsequipe', 1, '2026-07-30 08:10:57'),
(105, 9, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:04:19'),
(106, 8, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 1, '2026-07-30 10:04:19'),
(107, 7, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 1, '2026-07-30 10:04:19'),
(108, 15, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:04:19'),
(109, 14, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:04:19'),
(110, 9, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:25:21'),
(111, 8, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 1, '2026-07-30 10:25:21'),
(112, 7, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 1, '2026-07-30 10:25:21'),
(113, 15, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:25:21'),
(114, 14, 'collaborateur', 'taches_disponibles', 'Nouvelles tâches à choisir', '3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".', 'taches', 0, '2026-07-30 10:25:21'),
(115, 7, 'collaborateur', 'tache_echeance', 'Échéance dans 2 jours', 'La tâche \"fikffllf\" arrive à échéance le 01/08/2026', 'taches', 1, '2026-07-30 10:36:09'),
(116, 5, 'responsable', 'activite_hors_equipe', 'Activité hors-équipe déclarée', 'ichrak riahii a signalé une activité en dehors de la sous-équipe : \"redaction examen\"', 'horsequipe', 1, '2026-07-30 10:46:46'),
(117, 7, 'collaborateur', 'tache_echeance', 'Échéance dans 2 jours', 'La tâche \"uuriirir\" arrive à échéance le 01/08/2026', 'taches', 0, '2026-07-30 11:45:41'),
(118, 5, 'responsable', 'tache_validee', 'Tâche terminée', 'ichrak riahii a terminé la tâche \"redaction qcm\"', 'taches', 0, '2026-07-30 11:53:57'),
(119, 5, 'responsable', 'tache_validee', 'Tâche terminée', 'ichrak riahii a terminé la tâche \"redaction qcm\"', 'taches', 0, '2026-07-30 11:54:04');

-- --------------------------------------------------------

--
-- Structure de la table `parametre_systeme`
--

DROP TABLE IF EXISTS `parametre_systeme`;
CREATE TABLE IF NOT EXISTS `parametre_systeme` (
  `id` int(11) NOT NULL DEFAULT '1',
  `annee_universitaire` varchar(9) NOT NULL DEFAULT '2025/2026',
  `semestre_actif` enum('S1','S2') NOT NULL DEFAULT 'S2',
  `mail_verification_auto` tinyint(1) NOT NULL DEFAULT '1',
  `validation_auto` tinyint(1) NOT NULL DEFAULT '1',
  `notifications_email` tinyint(1) NOT NULL DEFAULT '1',
  `sauvegarde_auto` tinyint(1) NOT NULL DEFAULT '1',
  `annees_supplementaires` json DEFAULT NULL,
  `mode_sombre` tinyint(1) NOT NULL DEFAULT '0',
  `limite_taches_collaborateur` int(11) NOT NULL DEFAULT '3',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `parametre_systeme`
--

INSERT INTO `parametre_systeme` (`id`, `annee_universitaire`, `semestre_actif`, `mail_verification_auto`, `validation_auto`, `notifications_email`, `sauvegarde_auto`, `annees_supplementaires`, `mode_sombre`, `limite_taches_collaborateur`) VALUES
(1, '2025/2026', 'S2', 1, 1, 1, 1, '[\"2028/2029\"]', 0, 3);

-- --------------------------------------------------------

--
-- Structure de la table `question_voeu_pedagogique`
--

DROP TABLE IF EXISTS `question_voeu_pedagogique`;
CREATE TABLE IF NOT EXISTS `question_voeu_pedagogique` (
  `id_question` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT '0',
  `type` enum('texte','choix_unique','choix_multiple','modules') NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT '1',
  `options` json DEFAULT NULL,
  PRIMARY KEY (`id_question`),
  KEY `id_campagne` (`id_campagne`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `question_voeu_pedagogique`
--

INSERT INTO `question_voeu_pedagogique` (`id_question`, `id_campagne`, `ordre`, `type`, `intitule`, `obligatoire`, `options`) VALUES
(4, 7, 0, 'modules', 'Quels modules souhaitez vous enseigner?', 1, '[]'),
(6, 7, 1, 'choix_unique', 'duelsdjd', 1, '[\"oui\", \"non\"]'),
(10, 8, 0, 'choix_unique', 'hellooooo??', 1, '[\"oui\", \"non\"]'),
(11, 8, 1, 'choix_multiple', 'kkkkk', 1, '[\"heee\", \"eeee\", \"kkkkk\", \"fffff\", \"ggggg\"]'),
(12, 8, 2, 'texte', 'kiiiii', 1, '[]'),
(13, 8, 3, 'modules', 'kkkkk', 1, '[]'),
(16, 10, 0, 'modules', 'u_eei', 1, '[]');

-- --------------------------------------------------------

--
-- Structure de la table `rapport`
--

DROP TABLE IF EXISTS `rapport`;
CREATE TABLE IF NOT EXISTS `rapport` (
  `id_rapport` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `format` enum('pdf','excel') NOT NULL DEFAULT 'pdf',
  `id_sous_equipe` int(11) DEFAULT NULL,
  `id_collaborateur` int(11) DEFAULT NULL,
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2','annuel') DEFAULT NULL,
  `date_generation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chemin_fichier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_rapport`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `id_collaborateur` (`id_collaborateur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Structure de la table `reponse_detail_voeu_pedagogique`
--

DROP TABLE IF EXISTS `reponse_detail_voeu_pedagogique`;
CREATE TABLE IF NOT EXISTS `reponse_detail_voeu_pedagogique` (
  `id_detail` int(11) NOT NULL AUTO_INCREMENT,
  `id_reponse` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `valeur` json DEFAULT NULL,
  PRIMARY KEY (`id_detail`),
  UNIQUE KEY `unique_detail` (`id_reponse`,`id_question`),
  KEY `id_question` (`id_question`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `reponse_detail_voeu_pedagogique`
--

INSERT INTO `reponse_detail_voeu_pedagogique` (`id_detail`, `id_reponse`, `id_question`, `valeur`) VALUES
(1, 1, 10, '\"oui\"'),
(2, 1, 11, '[\"eeee\", \"kkkkk\"]'),
(3, 1, 12, '\"2111\"'),
(4, 1, 13, '[\"algo\", \"proxy\"]'),
(5, 2, 10, '\"oui\"'),
(6, 2, 11, '[\"heee\", \"kkkkk\"]'),
(7, 2, 12, '\"okiii\"'),
(8, 2, 13, '[\"algo\", \"unix\"]');

-- --------------------------------------------------------

--
-- Structure de la table `reponse_voeu_pedagogique`
--

DROP TABLE IF EXISTS `reponse_voeu_pedagogique`;
CREATE TABLE IF NOT EXISTS `reponse_voeu_pedagogique` (
  `id_reponse` int(11) NOT NULL AUTO_INCREMENT,
  `id_campagne` int(11) NOT NULL,
  `id_collaborateur` int(11) NOT NULL,
  `date_soumission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT NULL,
  PRIMARY KEY (`id_reponse`),
  UNIQUE KEY `unique_reponse_campagne` (`id_campagne`,`id_collaborateur`),
  KEY `id_collaborateur` (`id_collaborateur`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `reponse_voeu_pedagogique`
--

INSERT INTO `reponse_voeu_pedagogique` (`id_reponse`, `id_campagne`, `id_collaborateur`, `date_soumission`, `date_modification`) VALUES
(1, 8, 8, '2026-07-29 21:25:51', NULL),
(2, 8, 7, '2026-07-29 21:46:13', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `responsable`
--

DROP TABLE IF EXISTS `responsable`;
CREATE TABLE IF NOT EXISTS `responsable` (
  `id_responsable` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `identifiant_esprit` varchar(50) DEFAULT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notifications_email` tinyint(1) NOT NULL DEFAULT '1',
  `profil_visible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_responsable`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `identifiant_esprit` (`identifiant_esprit`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `responsable`
--

INSERT INTO `responsable` (`id_responsable`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `date_creation`, `notifications_email`, `profil_visible`) VALUES
(5, 'Ahmed hamoud', 'ahmed@gmail.com', '253JFt1236', '$2a$10$Ex2FgaX3QRYgnYMy.m0C/.BF0dJKrcrYplhuWO/MyHADnxqw0oXf.', 1, '2026-07-17 20:43:07', 1, 1),
(6, 'ichrak riahii', 'ichrak.riahi@gmail.com', '253JFT4502', '$2a$10$v2HuFXLRqz7tkrYntEfkRu31JeGgg9qlje0qUZoTrHBDoMa.i/O/C', 1, '2026-07-17 20:44:20', 1, 1),
(11, 'Nawel Laouini', 'Nawel.Laouini@esprit.tn', '253JFT5789', '$2a$10$cT4HNFhIdYwqmiBZpsRavOY7wSrMQzCaCZSfyic2hxoNTYo4tx7.i', 1, '2026-07-21 09:38:58', 1, 1),
(12, 'iyed zaied', 'iyed@gmail.com', '253JFT5489', '$2a$10$lStGpMKwfnGzfaBxft.Jy.7LJv/njEdNbKO13Uisg5PL7fgbn9whe', 1, '2026-07-26 22:13:23', 1, 1),
(14, 'ilef zayed', 'ilef.zayed138@gmail.com', '253JFT5450', '$2a$10$radnwaTrJpFn3dea4a/J1uwpknFCUaWJSOE9f1LtM7W.QbUpXWiL6', 1, '2026-07-29 10:48:23', 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `sauvegarde`
--

DROP TABLE IF EXISTS `sauvegarde`;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `sauvegarde`
--

INSERT INTO `sauvegarde` (`id_sauvegarde`, `nom_fichier`, `taille_octets`, `checksum_sha256`, `type`, `statut`, `message_erreur`, `date_creation`) VALUES
(1, 'arp-backup-2026-07-17T01-00-00-019Z.sql', 0, NULL, 'automatique', 'echec', 'Impossible de lancer mysqldump (spawn mysqldump ENOENT). Vérifiez qu\'il est installé et dans le PATH, ou renseignez MYSQLDUMP_PATH dans .env.', '2026-07-17 02:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `sous_equipe`
--

DROP TABLE IF EXISTS `sous_equipe`;
CREATE TABLE IF NOT EXISTS `sous_equipe` (
  `id_sous_equipe` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `id_module` varchar(30) DEFAULT NULL,
  `id_responsable` int(11) DEFAULT NULL,
  `statut` enum('active','a_suivre') NOT NULL DEFAULT 'active',
  `ouverte_voeux` tinyint(1) NOT NULL DEFAULT '0',
  `places_disponibles` int(11) NOT NULL DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  PRIMARY KEY (`id_sous_equipe`),
  KEY `id_responsable` (`id_responsable`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `sous_equipe`
--

INSERT INTO `sous_equipe` (`id_sous_equipe`, `nom`, `id_module`, `id_responsable`, `statut`, `ouverte_voeux`, `places_disponibles`, `date_creation`, `annee_universitaire`, `semestre`) VALUES
(4, 'Réseau', 'R-203', 5, 'active', 0, 0, '2026-07-17 20:43:07', '2025/2026', 'S2'),
(5, 'cybersecurity', 'cyber-608', 6, 'active', 0, 0, '2026-07-17 20:44:20', '2025/2026', 'S2'),
(8, 'proba', 'proba-203', 14, 'active', 0, 0, '2026-07-28 10:22:19', '2025/2026', 'S1');

-- --------------------------------------------------------

--
-- Structure de la table `tache`
--

DROP TABLE IF EXISTS `tache`;
CREATE TABLE IF NOT EXISTS `tache` (
  `id_tache` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL,
  `description` text,
  `priorite` enum('basse','moyenne','haute') NOT NULL DEFAULT 'moyenne',
  `statut` enum('a_faire','en_cours','validee','probleme_coordination','a_refaire') NOT NULL DEFAULT 'a_faire',
  `membre_concerne` varchar(150) DEFAULT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_echeance` date DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  `id_collaborateur` int(11) DEFAULT NULL,
  `id_sous_equipe` int(11) DEFAULT NULL,
  `id_equipe_hors_up` int(11) DEFAULT NULL,
  `annee_universitaire` varchar(9) DEFAULT NULL,
  `semestre` enum('S1','S2') DEFAULT NULL,
  `rappel_echeance_envoye` tinyint(1) NOT NULL DEFAULT '0',
  `raison_probleme` varchar(400) DEFAULT NULL,
  `disponibilite_notifiee` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_tache`),
  KEY `id_collaborateur` (`id_collaborateur`),
  KEY `id_sous_equipe` (`id_sous_equipe`),
  KEY `id_equipe_hors_up` (`id_equipe_hors_up`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `tache`
--

INSERT INTO `tache` (`id_tache`, `titre`, `description`, `priorite`, `statut`, `membre_concerne`, `date_creation`, `date_echeance`, `date_validation`, `id_collaborateur`, `id_sous_equipe`, `id_equipe_hors_up`, `annee_universitaire`, `semestre`, `rappel_echeance_envoye`, `raison_probleme`, `disponibilite_notifiee`) VALUES
(38, 'redaction', 'redaction examen', 'haute', 'en_cours', NULL, '2026-07-30 10:04:19', '2026-08-02', NULL, 8, 4, NULL, '2025/2026', 'S2', 0, NULL, 0),
(39, 'redaction qcm', 'readction', 'moyenne', 'en_cours', NULL, '2026-07-30 10:04:19', '2026-08-04', '2026-07-30 11:54:04', 8, 4, NULL, '2025/2026', 'S2', 0, NULL, 0),
(40, 'hheie', 'ifikf', 'haute', 'a_faire', NULL, '2026-07-30 10:25:21', '2026-07-31', NULL, NULL, 4, NULL, '2025/2026', 'S2', 0, NULL, 0),
(41, 'uuriirir', 'fkdod', 'moyenne', 'en_cours', NULL, '2026-07-30 10:25:21', '2026-08-01', NULL, 7, 4, NULL, '2025/2026', 'S2', 1, NULL, 0),
(42, 'fikffllf', 'fiifif', 'haute', 'en_cours', NULL, '2026-07-30 10:25:21', '2026-08-01', NULL, 7, 4, NULL, '2025/2026', 'S2', 1, NULL, 0);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activite_academique`
--
ALTER TABLE `activite_academique`
  ADD CONSTRAINT `activite_academique_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `affectation_voeu_pedagogique`
--
ALTER TABLE `affectation_voeu_pedagogique`
  ADD CONSTRAINT `affectation_voeu_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  ADD CONSTRAINT `affectation_voeu_ibfk_2` FOREIGN KEY (`id_module`) REFERENCES `module_voeu_pedagogique` (`id_module`) ON DELETE CASCADE;

--
-- Contraintes pour la table `collaborateur_equipe_hors_up`
--
ALTER TABLE `collaborateur_equipe_hors_up`
  ADD CONSTRAINT `collaborateur_equipe_hors_up_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `collaborateur_equipe_hors_up_ibfk_2` FOREIGN KEY (`id_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE;

--
-- Contraintes pour la table `collaborateur_sousequipe`
--
ALTER TABLE `collaborateur_sousequipe`
  ADD CONSTRAINT `collaborateur_sousequipe_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `collaborateur_sousequipe_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE;

--
-- Contraintes pour la table `demande_equipe_notification`
--
ALTER TABLE `demande_equipe_notification`
  ADD CONSTRAINT `demande_equipe_notification_ibfk_1` FOREIGN KEY (`id_demande`) REFERENCES `demande_hors_equipe` (`id_demande`) ON DELETE CASCADE;

--
-- Contraintes pour la table `demande_hors_equipe`
--
ALTER TABLE `demande_hors_equipe`
  ADD CONSTRAINT `demande_hors_equipe_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `demande_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `encadrement`
--
ALTER TABLE `encadrement`
  ADD CONSTRAINT `encadrement_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `equipe_hors_up`
--
ALTER TABLE `equipe_hors_up`
  ADD CONSTRAINT `equipe_hors_up_ibfk_resp` FOREIGN KEY (`id_responsable`) REFERENCES `responsable` (`id_responsable`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `evaluation_score`
--
ALTER TABLE `evaluation_score`
  ADD CONSTRAINT `evaluation_score_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_score_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_score_ibfk_3` FOREIGN KEY (`id_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE;

--
-- Contraintes pour la table `expertise`
--
ALTER TABLE `expertise`
  ADD CONSTRAINT `expertise_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `module_voeu_pedagogique`
--
ALTER TABLE `module_voeu_pedagogique`
  ADD CONSTRAINT `module_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE,
  ADD CONSTRAINT `module_voeu_ibfk_2` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE;

--
-- Contraintes pour la table `question_voeu_pedagogique`
--
ALTER TABLE `question_voeu_pedagogique`
  ADD CONSTRAINT `question_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE;

--
-- Contraintes pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD CONSTRAINT `rapport_ibfk_1` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE SET NULL,
  ADD CONSTRAINT `rapport_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reponse_detail_voeu_pedagogique`
--
ALTER TABLE `reponse_detail_voeu_pedagogique`
  ADD CONSTRAINT `reponse_detail_ibfk_1` FOREIGN KEY (`id_reponse`) REFERENCES `reponse_voeu_pedagogique` (`id_reponse`) ON DELETE CASCADE,
  ADD CONSTRAINT `reponse_detail_ibfk_2` FOREIGN KEY (`id_question`) REFERENCES `question_voeu_pedagogique` (`id_question`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reponse_voeu_pedagogique`
--
ALTER TABLE `reponse_voeu_pedagogique`
  ADD CONSTRAINT `reponse_voeu_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagne_voeux_pedagogiques` (`id_campagne`) ON DELETE CASCADE,
  ADD CONSTRAINT `reponse_voeu_ibfk_2` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE CASCADE;

--
-- Contraintes pour la table `sous_equipe`
--
ALTER TABLE `sous_equipe`
  ADD CONSTRAINT `sous_equipe_ibfk_1` FOREIGN KEY (`id_responsable`) REFERENCES `responsable` (`id_responsable`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `tache`
--
ALTER TABLE `tache`
  ADD CONSTRAINT `tache_ibfk_1` FOREIGN KEY (`id_collaborateur`) REFERENCES `collaborateur` (`id_collaborateur`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tache_ibfk_2` FOREIGN KEY (`id_sous_equipe`) REFERENCES `sous_equipe` (`id_sous_equipe`) ON DELETE CASCADE,
  ADD CONSTRAINT `tache_ibfk_3` FOREIGN KEY (`id_equipe_hors_up`) REFERENCES `equipe_hors_up` (`id_up`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
SET FOREIGN_KEY_CHECKS=1;
