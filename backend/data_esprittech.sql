-- MySQL dump 10.13  Distrib 5.7.31, for Win64 (x86_64)
--
-- Host: localhost    Database: esprittech
-- ------------------------------------------------------
-- Server version	5.7.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `activite_academique`
--

LOCK TABLES `activite_academique` WRITE;
/*!40000 ALTER TABLE `activite_academique` DISABLE KEYS */;
INSERT  IGNORE INTO `activite_academique` (`id_activite`, `id_collaborateur`, `type`, `titre`, `role`, `date_activite`, `description`, `date_ajout`, `annee_universitaire`, `semestre`) VALUES (1,8,'evenement','evenement','organisateur','2026-07-23',NULL,'2026-07-21 09:54:25','2025/2026','S2'),(2,8,'formation_hiver','java',NULL,'2026-07-24',NULL,'2026-07-21 10:33:42','2025/2026','S2'),(3,7,'formation_printemps','java',NULL,'2026-07-23',NULL,'2026-07-21 20:43:53','2025/2026','S2'),(4,8,'evenement','sparkC++','coach','2026-07-01',NULL,'2026-07-28 15:19:02','2025/2026','S2'),(5,8,'comite_organisation','cool algo',NULL,'2026-06-10',NULL,'2026-07-28 15:19:49','2025/2026','S2'),(6,8,'evenement','Evenement C','coordinateur','2026-06-30',NULL,'2026-07-28 15:21:12','2025/2026','S2'),(8,8,'comite_organisation','ooooo',NULL,'2026-08-01',NULL,'2026-07-30 08:13:26',NULL,NULL),(10,8,'membre_jury','home',NULL,'2026-07-28',NULL,'2026-07-30 11:11:47',NULL,NULL);
/*!40000 ALTER TABLE `activite_academique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT  IGNORE INTO `admin` (`id_admin`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `notifications_email`) VALUES (1,'Adminito ESPRIT','zaied.ilef138@gmail.com','253JFT6523','$2a$10$2Za1VWSi/k1voWDwRRHNSOtHNzG8GVtUPr/QApN5AjtJG25tRSe3O',1,1);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `affectation_voeu_pedagogique`
--

LOCK TABLES `affectation_voeu_pedagogique` WRITE;
/*!40000 ALTER TABLE `affectation_voeu_pedagogique` DISABLE KEYS */;
INSERT  IGNORE INTO `affectation_voeu_pedagogique` (`id_affectation`, `id_reponse`, `id_module`, `classe`, `date_affectation`) VALUES (1,1,3,'2A30','2026-07-29 21:46:53'),(2,2,3,'2A63','2026-07-29 21:47:01'),(3,1,4,'3A12','2026-07-29 21:47:08'),(4,2,6,'3A63','2026-07-29 21:47:14'),(5,2,3,'2A70','2026-07-29 21:54:01'),(6,1,3,'2A32','2026-07-29 21:54:03'),(7,1,4,'3A63','2026-07-29 22:02:22');
/*!40000 ALTER TABLE `affectation_voeu_pedagogique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `annee_universitaire_creee`
--

LOCK TABLES `annee_universitaire_creee` WRITE;
/*!40000 ALTER TABLE `annee_universitaire_creee` DISABLE KEYS */;
INSERT  IGNORE INTO `annee_universitaire_creee` (`annee`, `date_creation`) VALUES ('2025/2026','2026-07-30 19:38:59'),('2028/2029','2026-07-30 19:40:05');
/*!40000 ALTER TABLE `annee_universitaire_creee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `campagne_voeux_pedagogiques`
--

LOCK TABLES `campagne_voeux_pedagogiques` WRITE;
/*!40000 ALTER TABLE `campagne_voeux_pedagogiques` DISABLE KEYS */;
INSERT  IGNORE INTO `campagne_voeux_pedagogiques` (`id_campagne`, `titre`, `statut`, `date_creation`, `date_publication`, `date_cloture`) VALUES (7,'voeux 2026/2027','cloturee','2026-07-29 09:22:10','2026-07-29 13:43:32','2026-07-29 13:45:52'),(8,'kkkof','publiee','2026-07-29 21:17:15','2026-07-29 21:24:44',NULL),(10,'voeux','brouillon','2026-07-29 22:00:44',NULL,NULL);
/*!40000 ALTER TABLE `campagne_voeux_pedagogiques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `collaborateur`
--

LOCK TABLES `collaborateur` WRITE;
/*!40000 ALTER TABLE `collaborateur` DISABLE KEYS */;
INSERT  IGNORE INTO `collaborateur` (`id_collaborateur`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `notifications_email`, `profil_visible`, `date_creation`) VALUES (7,'ilef zayed','ilef.zayed138@gmail.com','253JFT5450','$2a$10$oFvLKKJILCCCdBEHGA3pm.piepUDPjzx5HIxuCFa2LwpR.SGXHj5C',1,1,1,'2026-07-17 20:25:57'),(8,'ichrak riahii','ichrak.riahi@gmail.com','253JFT4502','$2a$10$v2HuFXLRqz7tkrYntEfkRu31JeGgg9qlje0qUZoTrHBDoMa.i/O/C',1,1,1,'2026-07-17 20:25:57'),(9,'Ahmed hamoud','ahmed@gmail.com','253JFt1236','$2a$10$Ex2FgaX3QRYgnYMy.m0C/.BF0dJKrcrYplhuWO/MyHADnxqw0oXf.',1,1,1,'2026-07-17 20:25:57'),(13,'Zayed ilef','ilef.zayed@esprit.tn','253JFT1235','$2a$10$TNNTF5DSvY5geSEh89/jFuaBC2d8pZJHm2LqpSykedbChajuGu8Hm',1,1,1,'2026-07-21 09:05:20'),(14,'Nawel Laouini','Nawel.Laouini@esprit.tn','253JFT5789','$2a$10$cT4HNFhIdYwqmiBZpsRavOY7wSrMQzCaCZSfyic2hxoNTYo4tx7.i',1,1,1,'2026-07-21 09:37:07'),(15,'iyed zaied','iyed@gmail.com','253JFT5489','$2a$10$lStGpMKwfnGzfaBxft.Jy.7LJv/njEdNbKO13Uisg5PL7fgbn9whe',1,1,1,'2026-07-26 12:09:45');
/*!40000 ALTER TABLE `collaborateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `collaborateur_equipe_hors_up`
--

LOCK TABLES `collaborateur_equipe_hors_up` WRITE;
/*!40000 ALTER TABLE `collaborateur_equipe_hors_up` DISABLE KEYS */;
INSERT  IGNORE INTO `collaborateur_equipe_hors_up` (`id_collaborateur`, `id_up`, `date_affectation`) VALUES (8,5,'2026-07-21 09:38:58'),(9,5,'2026-07-21 09:38:58'),(13,5,'2026-07-21 11:42:22');
/*!40000 ALTER TABLE `collaborateur_equipe_hors_up` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `collaborateur_sousequipe`
--

LOCK TABLES `collaborateur_sousequipe` WRITE;
/*!40000 ALTER TABLE `collaborateur_sousequipe` DISABLE KEYS */;
INSERT  IGNORE INTO `collaborateur_sousequipe` (`id_collaborateur`, `id_sous_equipe`, `date_affectation`, `nombre_classes`) VALUES (7,4,'2026-07-17 20:43:07',0),(7,8,'2026-07-30 11:26:20',0),(8,4,'2026-07-17 20:43:07',0),(9,4,'2026-07-28 15:44:08',0),(9,5,'2026-07-17 20:44:20',0),(14,4,'2026-07-28 15:44:17',0),(14,5,'2026-07-22 10:08:49',0),(15,4,'2026-07-26 16:54:09',0),(15,8,'2026-07-28 10:22:19',0);
/*!40000 ALTER TABLE `collaborateur_sousequipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `critere_evaluation`
--

LOCK TABLES `critere_evaluation` WRITE;
/*!40000 ALTER TABLE `critere_evaluation` DISABLE KEYS */;
INSERT  IGNORE INTO `critere_evaluation` (`id_critere`, `nom`, `code`, `ponderation`) VALUES (1,'Qualité du travail','qualite',29),(2,'Respect des délais','delais',20),(3,'Implication','implication',21),(4,'Coordination','coordination',20),(6,'Activité Au Sein ESPRIT','activite_ecole',10);
/*!40000 ALTER TABLE `critere_evaluation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `demande_equipe_notification`
--

LOCK TABLES `demande_equipe_notification` WRITE;
/*!40000 ALTER TABLE `demande_equipe_notification` DISABLE KEYS */;
INSERT  IGNORE INTO `demande_equipe_notification` (`id_demande`, `type_equipe`, `id_equipe`) VALUES (23,'sous_equipe',4);
/*!40000 ALTER TABLE `demande_equipe_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `demande_hors_equipe`
--

LOCK TABLES `demande_hors_equipe` WRITE;
/*!40000 ALTER TABLE `demande_hors_equipe` DISABLE KEYS */;
INSERT  IGNORE INTO `demande_hors_equipe` (`id_demande`, `id_collaborateur`, `id_sous_equipe`, `titre`, `description`, `date_debut`, `date_fin`, `contact_responsable`, `date_reception`, `destinataire_verification`, `statut`, `date_validation`, `annee_universitaire`, `semestre`, `id_up`) VALUES (23,8,4,'redaction examen','redaction examen','2026-08-01','2026-08-05','Ahmed hamoud','2026-07-30 10:46:46',NULL,'a_faire',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `demande_hors_equipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `encadrement`
--

LOCK TABLES `encadrement` WRITE;
/*!40000 ALTER TABLE `encadrement` DISABLE KEYS */;
INSERT  IGNORE INTO `encadrement` (`id_encadrement`, `id_collaborateur`, `nom_etudiant`, `sujet`, `type`, `annee_universitaire`, `date_ajout`, `semestre`) VALUES (2,8,'ilef zayed','sujet 45','pfe','2025/2026','2026-07-21 09:53:26','S2');
/*!40000 ALTER TABLE `encadrement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `equipe_hors_up`
--

LOCK TABLES `equipe_hors_up` WRITE;
/*!40000 ALTER TABLE `equipe_hors_up` DISABLE KEYS */;
INSERT  IGNORE INTO `equipe_hors_up` (`id_up`, `nom_up`, `id_module`, `id_responsable`, `statut`, `ouverte_voeux`, `places_disponibles`, `date_creation`, `annee_universitaire`, `semestre`) VALUES (5,'equipe','eq-203',11,'active',0,0,'2026-07-21 09:38:58','2025/2026','S2');
/*!40000 ALTER TABLE `equipe_hors_up` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `evaluation_score`
--

LOCK TABLES `evaluation_score` WRITE;
/*!40000 ALTER TABLE `evaluation_score` DISABLE KEYS */;
INSERT  IGNORE INTO `evaluation_score` (`id_score`, `id_collaborateur`, `id_sous_equipe`, `id_up`, `type_equipe`, `equipe_key`, `annee_universitaire`, `semestre`, `score`, `detail_json`, `date_calcul`) VALUES (187,7,4,NULL,'up',4,'2025/2026','S2',1.54,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 15.38, \"ratio\": 0.77, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(188,8,4,NULL,'up',4,'2025/2026','S2',2.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(189,9,4,NULL,'up',4,'2025/2026','S2',0.77,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 7.69, \"ratio\": 0.38, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(190,14,4,NULL,'up',4,'2025/2026','S2',0.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(191,15,4,NULL,'up',4,'2025/2026','S2',0.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(192,9,5,NULL,'up',5,'2025/2026','S2',2.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(193,14,5,NULL,'up',5,'2025/2026','S2',0.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(194,7,8,NULL,'up',8,'2025/2026','S2',2.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(195,15,8,NULL,'up',8,'2025/2026','S2',0.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(196,8,NULL,5,'hors_up',5,'2025/2026','S2',2.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 20, \"ratio\": 1, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(197,9,NULL,5,'hors_up',5,'2025/2026','S2',0.55,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 5.45, \"ratio\": 0.27, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44'),(198,13,NULL,5,'hors_up',5,'2025/2026','S2',0.00,'{\"delais\": {\"nom\": \"Respect des délais\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"qualite\": {\"nom\": \"Qualité du travail\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 29}, \"implication\": {\"nom\": \"Implication\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 21}, \"coordination\": {\"nom\": \"Coordination\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 20}, \"activite_ecole\": {\"nom\": \"Activité Au Sein ESPRIT\", \"note\": 0, \"ratio\": 0, \"connecte\": true, \"ponderation\": 10}}','2026-07-30 11:46:44');
/*!40000 ALTER TABLE `evaluation_score` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `expertise`
--

LOCK TABLES `expertise` WRITE;
/*!40000 ALTER TABLE `expertise` DISABLE KEYS */;
INSERT  IGNORE INTO `expertise` (`id_expertise`, `id_collaborateur`, `libelle`, `date_ajout`) VALUES (5,7,'ia','2026-07-21 20:44:20'),(6,9,'push','2026-07-22 10:18:40'),(7,8,'ia','2026-07-27 11:47:34'),(9,15,'proba','2026-07-30 12:08:27');
/*!40000 ALTER TABLE `expertise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `module_voeu_pedagogique`
--

LOCK TABLES `module_voeu_pedagogique` WRITE;
/*!40000 ALTER TABLE `module_voeu_pedagogique` DISABLE KEYS */;
INSERT  IGNORE INTO `module_voeu_pedagogique` (`id_module`, `id_campagne`, `id_question`, `nom`, `niveau`, `classes`) VALUES (2,7,4,'algo',NULL,'[\"3A63\", \"3b12\", \"3A12\"]'),(3,8,13,'algo','2A','[\"2A30\", \"2A70\", \"2A63\", \"2A32\"]'),(4,8,13,'proxy','3A','[\"3A21\", \"3A63\", \"3A12\", \"3A42\"]'),(5,8,13,'proba','3B','[\"3B25\", \"3B12\", \"3B14\", \"3B24\"]'),(6,8,13,'unix','3A','[\"3A12\", \"3A63\", \"3A11\", \"3A25\"]');
/*!40000 ALTER TABLE `module_voeu_pedagogique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT  IGNORE INTO `notification` (`id_notification`, `id_utilisateur`, `type_utilisateur`, `type`, `titre`, `message`, `lien_page`, `lu`, `date_creation`) VALUES (82,9,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 13:43:32'),(83,8,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',1,'2026-07-29 13:43:32'),(84,7,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',1,'2026-07-29 13:43:32'),(85,15,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 13:43:32'),(86,14,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 13:43:32'),(87,13,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"voeux 2026/2027\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 13:43:32'),(88,9,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 21:24:44'),(89,8,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',1,'2026-07-29 21:24:44'),(90,7,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',1,'2026-07-29 21:24:44'),(91,15,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 21:24:44'),(92,14,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 21:24:44'),(93,13,'collaborateur','campagne_voeux','Vœux pédagogiques ouverts','Le questionnaire \"kkkof\" est disponible, vous pouvez y répondre dès maintenant','voeux-pedagogiques',0,'2026-07-29 21:24:44'),(94,8,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"2A30\"','voeux-pedagogiques',1,'2026-07-29 21:46:53'),(95,7,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"2A63\"','voeux-pedagogiques',1,'2026-07-29 21:47:01'),(96,8,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"3A12\"','voeux-pedagogiques',1,'2026-07-29 21:47:08'),(97,7,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"3A63\"','voeux-pedagogiques',1,'2026-07-29 21:47:14'),(98,7,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"2A70\"','voeux-pedagogiques',1,'2026-07-29 21:54:01'),(99,8,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"2A32\"','voeux-pedagogiques',1,'2026-07-29 21:54:03'),(100,8,'collaborateur','affectation_pedagogique','Nouvelle classe affectée','Vous avez été affecté(e) à la classe \"3A63\"','voeux-pedagogiques',1,'2026-07-29 22:02:22'),(101,8,'collaborateur','tache_assignee','Nouvelle tâche assignée','Adminito ESPRIT vous a assigné la tâche \"njjj\"','taches',1,'2026-07-29 22:57:36'),(102,5,'responsable','probleme_coordination','Problème de coordination signalé','ichrak riahii a signalé un problème de coordination sur la tâche \"njjj\" : hhhhhuuuhh uuuuh jkkk','taches',1,'2026-07-29 22:58:39'),(103,8,'collaborateur','tache_echeance','Échéance dans 2 jours','La tâche \"njjj\" arrive à échéance le 01/08/2026','taches',1,'2026-07-30 08:03:16'),(104,5,'responsable','activite_hors_equipe','Activité hors-équipe déclarée','ichrak riahii a signalé une activité en dehors de la sous-équipe : \"intervention\"','horsequipe',1,'2026-07-30 08:10:57'),(105,9,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:04:19'),(106,8,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',1,'2026-07-30 10:04:19'),(107,7,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',1,'2026-07-30 10:04:19'),(108,15,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:04:19'),(109,14,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','2 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:04:19'),(110,9,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:25:21'),(111,8,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',1,'2026-07-30 10:25:21'),(112,7,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',1,'2026-07-30 10:25:21'),(113,15,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:25:21'),(114,14,'collaborateur','taches_disponibles','Nouvelles tâches à choisir','3 nouvelles tâches sont disponibles pour Réseau — vous pouvez les choisir depuis \"Mes tâches\".','taches',0,'2026-07-30 10:25:21'),(115,7,'collaborateur','tache_echeance','Échéance dans 2 jours','La tâche \"fikffllf\" arrive à échéance le 01/08/2026','taches',1,'2026-07-30 10:36:09'),(116,5,'responsable','activite_hors_equipe','Activité hors-équipe déclarée','ichrak riahii a signalé une activité en dehors de la sous-équipe : \"redaction examen\"','horsequipe',1,'2026-07-30 10:46:46'),(117,7,'collaborateur','tache_echeance','Échéance dans 2 jours','La tâche \"uuriirir\" arrive à échéance le 01/08/2026','taches',0,'2026-07-30 11:45:41'),(118,5,'responsable','tache_validee','Tâche terminée','ichrak riahii a terminé la tâche \"redaction qcm\"','taches',0,'2026-07-30 11:53:57'),(119,5,'responsable','tache_validee','Tâche terminée','ichrak riahii a terminé la tâche \"redaction qcm\"','taches',0,'2026-07-30 11:54:04');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `parametre_systeme`
--

LOCK TABLES `parametre_systeme` WRITE;
/*!40000 ALTER TABLE `parametre_systeme` DISABLE KEYS */;
INSERT  IGNORE INTO `parametre_systeme` (`id`, `annee_universitaire`, `semestre_actif`, `mail_verification_auto`, `validation_auto`, `notifications_email`, `sauvegarde_auto`, `annees_supplementaires`, `mode_sombre`, `limite_taches_collaborateur`) VALUES (1,'2025/2026','S2',1,1,1,1,'[\"2028/2029\"]',0,3);
/*!40000 ALTER TABLE `parametre_systeme` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `question_voeu_pedagogique`
--

LOCK TABLES `question_voeu_pedagogique` WRITE;
/*!40000 ALTER TABLE `question_voeu_pedagogique` DISABLE KEYS */;
INSERT  IGNORE INTO `question_voeu_pedagogique` (`id_question`, `id_campagne`, `ordre`, `type`, `intitule`, `obligatoire`, `options`) VALUES (4,7,0,'modules','Quels modules souhaitez vous enseigner?',1,'[]'),(6,7,1,'choix_unique','duelsdjd',1,'[\"oui\", \"non\"]'),(10,8,0,'choix_unique','hellooooo??',1,'[\"oui\", \"non\"]'),(11,8,1,'choix_multiple','kkkkk',1,'[\"heee\", \"eeee\", \"kkkkk\", \"fffff\", \"ggggg\"]'),(12,8,2,'texte','kiiiii',1,'[]'),(13,8,3,'modules','kkkkk',1,'[]'),(16,10,0,'modules','u_eei',1,'[]');
/*!40000 ALTER TABLE `question_voeu_pedagogique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `rapport`
--

LOCK TABLES `rapport` WRITE;
/*!40000 ALTER TABLE `rapport` DISABLE KEYS */;
/*!40000 ALTER TABLE `rapport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reponse_detail_voeu_pedagogique`
--

LOCK TABLES `reponse_detail_voeu_pedagogique` WRITE;
/*!40000 ALTER TABLE `reponse_detail_voeu_pedagogique` DISABLE KEYS */;
INSERT  IGNORE INTO `reponse_detail_voeu_pedagogique` (`id_detail`, `id_reponse`, `id_question`, `valeur`) VALUES (1,1,10,'\"oui\"'),(2,1,11,'[\"eeee\", \"kkkkk\"]'),(3,1,12,'\"2111\"'),(4,1,13,'[\"algo\", \"proxy\"]'),(5,2,10,'\"oui\"'),(6,2,11,'[\"heee\", \"kkkkk\"]'),(7,2,12,'\"okiii\"'),(8,2,13,'[\"algo\", \"unix\"]');
/*!40000 ALTER TABLE `reponse_detail_voeu_pedagogique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reponse_voeu_pedagogique`
--

LOCK TABLES `reponse_voeu_pedagogique` WRITE;
/*!40000 ALTER TABLE `reponse_voeu_pedagogique` DISABLE KEYS */;
INSERT  IGNORE INTO `reponse_voeu_pedagogique` (`id_reponse`, `id_campagne`, `id_collaborateur`, `date_soumission`, `date_modification`) VALUES (1,8,8,'2026-07-29 21:25:51',NULL),(2,8,7,'2026-07-29 21:46:13',NULL);
/*!40000 ALTER TABLE `reponse_voeu_pedagogique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `responsable`
--

LOCK TABLES `responsable` WRITE;
/*!40000 ALTER TABLE `responsable` DISABLE KEYS */;
INSERT  IGNORE INTO `responsable` (`id_responsable`, `nom`, `email`, `identifiant_esprit`, `mot_de_passe`, `actif`, `date_creation`, `notifications_email`, `profil_visible`) VALUES (5,'Ahmed hamoud','ahmed@gmail.com','253JFt1236','$2a$10$Ex2FgaX3QRYgnYMy.m0C/.BF0dJKrcrYplhuWO/MyHADnxqw0oXf.',1,'2026-07-17 20:43:07',1,1),(6,'ichrak riahii','ichrak.riahi@gmail.com','253JFT4502','$2a$10$v2HuFXLRqz7tkrYntEfkRu31JeGgg9qlje0qUZoTrHBDoMa.i/O/C',1,'2026-07-17 20:44:20',1,1),(11,'Nawel Laouini','Nawel.Laouini@esprit.tn','253JFT5789','$2a$10$cT4HNFhIdYwqmiBZpsRavOY7wSrMQzCaCZSfyic2hxoNTYo4tx7.i',1,'2026-07-21 09:38:58',1,1),(12,'iyed zaied','iyed@gmail.com','253JFT5489','$2a$10$lStGpMKwfnGzfaBxft.Jy.7LJv/njEdNbKO13Uisg5PL7fgbn9whe',1,'2026-07-26 22:13:23',1,1),(14,'ilef zayed','ilef.zayed138@gmail.com','253JFT5450','$2a$10$radnwaTrJpFn3dea4a/J1uwpknFCUaWJSOE9f1LtM7W.QbUpXWiL6',1,'2026-07-29 10:48:23',1,1);
/*!40000 ALTER TABLE `responsable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sauvegarde`
--

LOCK TABLES `sauvegarde` WRITE;
/*!40000 ALTER TABLE `sauvegarde` DISABLE KEYS */;
INSERT  IGNORE INTO `sauvegarde` (`id_sauvegarde`, `nom_fichier`, `taille_octets`, `checksum_sha256`, `type`, `statut`, `message_erreur`, `date_creation`) VALUES (1,'arp-backup-2026-07-17T01-00-00-019Z.sql',0,NULL,'automatique','echec','Impossible de lancer mysqldump (spawn mysqldump ENOENT). Vérifiez qu\'il est installé et dans le PATH, ou renseignez MYSQLDUMP_PATH dans .env.','2026-07-17 02:00:00');
/*!40000 ALTER TABLE `sauvegarde` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sous_equipe`
--

LOCK TABLES `sous_equipe` WRITE;
/*!40000 ALTER TABLE `sous_equipe` DISABLE KEYS */;
INSERT  IGNORE INTO `sous_equipe` (`id_sous_equipe`, `nom`, `id_module`, `id_responsable`, `statut`, `ouverte_voeux`, `places_disponibles`, `date_creation`, `annee_universitaire`, `semestre`) VALUES (4,'Réseau','R-203',5,'active',0,0,'2026-07-17 20:43:07','2025/2026','S2'),(5,'cybersecurity','cyber-608',6,'active',0,0,'2026-07-17 20:44:20','2025/2026','S2'),(8,'proba','proba-203',14,'active',0,0,'2026-07-28 10:22:19','2025/2026','S1');
/*!40000 ALTER TABLE `sous_equipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `tache`
--

LOCK TABLES `tache` WRITE;
/*!40000 ALTER TABLE `tache` DISABLE KEYS */;
INSERT  IGNORE INTO `tache` (`id_tache`, `titre`, `description`, `priorite`, `statut`, `membre_concerne`, `date_creation`, `date_echeance`, `date_validation`, `id_collaborateur`, `id_sous_equipe`, `id_equipe_hors_up`, `annee_universitaire`, `semestre`, `rappel_echeance_envoye`, `raison_probleme`, `disponibilite_notifiee`) VALUES (38,'redaction','redaction examen','haute','en_cours',NULL,'2026-07-30 10:04:19','2026-08-02',NULL,8,4,NULL,'2025/2026','S2',0,NULL,0),(39,'redaction qcm','readction','moyenne','en_cours',NULL,'2026-07-30 10:04:19','2026-08-04','2026-07-30 11:54:04',8,4,NULL,'2025/2026','S2',0,NULL,0),(40,'hheie','ifikf','haute','a_faire',NULL,'2026-07-30 10:25:21','2026-07-31',NULL,NULL,4,NULL,'2025/2026','S2',0,NULL,0),(41,'uuriirir','fkdod','moyenne','en_cours',NULL,'2026-07-30 10:25:21','2026-08-01',NULL,7,4,NULL,'2025/2026','S2',1,NULL,0),(42,'fikffllf','fiifif','haute','en_cours',NULL,'2026-07-30 10:25:21','2026-08-01',NULL,7,4,NULL,'2025/2026','S2',1,NULL,0);
/*!40000 ALTER TABLE `tache` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-30 21:17:25
