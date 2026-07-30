import pool from '../config/db.js'

// Auto-provisionne au démarrage les éléments de schéma dont dépendent les
// notifications, sans exiger de migration SQL manuelle : la table `notification`
// (si absente) et la colonne `tache.rappel_echeance_envoye` (si absente sur une
// base créée avant son ajout). Chaque étape est idempotente et sans danger à
// relancer à chaque démarrage du serveur.

async function colonneExiste(table, colonne) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, colonne]
  )
  return rows[0]?.n > 0
}

async function ajouterColonneSiAbsente(table, colonne, definitionSql) {
  const existe = await colonneExiste(table, colonne)
  if (existe) return
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definitionSql}`)
  console.log(`[schema] Colonne ajoutée : ${table}.${colonne}`)
}

export async function ensureNotificationSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notification\` (
        \`id_notification\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_utilisateur\` int(11) NOT NULL,
        \`type_utilisateur\` enum('admin','responsable','collaborateur') NOT NULL,
        \`type\` varchar(40) NOT NULL,
        \`titre\` varchar(150) NOT NULL,
        \`message\` varchar(255) DEFAULT NULL,
        \`lien_page\` varchar(60) DEFAULT NULL,
        \`lu\` tinyint(1) NOT NULL DEFAULT '0',
        \`date_creation\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_notification\`),
        KEY \`destinataire\` (\`id_utilisateur\`, \`type_utilisateur\`, \`lu\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await ajouterColonneSiAbsente(
      'tache', 'rappel_echeance_envoye',
      "`rappel_echeance_envoye` tinyint(1) NOT NULL DEFAULT '0'"
    )

    // Raison écrite (max 46 mots, contrôlé côté application) que le collaborateur doit
    // fournir en plus du membre concerné quand il signale un problème de coordination —
    // voir taches.controller.js -> editTache.
    await ajouterColonneSiAbsente(
      'tache', 'raison_probleme',
      "`raison_probleme` varchar(400) DEFAULT NULL"
    )

    // Marque les tâches proposées "au choix" (non assignées, ouvertes à tous les membres
    // de l'équipe) pour lesquelles une notification/e-mail de disponibilité a déjà été
    // envoyée — évite de spammer l'équipe si le responsable republie la liste sans rien
    // ajouter de nouveau (voir notifierEquipeNouvellesTaches).
    await ajouterColonneSiAbsente(
      'tache', 'disponibilite_notifiee',
      "`disponibilite_notifiee` tinyint(1) NOT NULL DEFAULT '0'"
    )

    // Nombre maximum de tâches qu'un collaborateur peut avoir "à faire"/"en cours" en
    // même temps avant de ne plus pouvoir en choisir de nouvelles dans le pool commun
    // (voir taches.controller.js -> choisirTache). Réglable en base ; 3 par défaut.
    await ajouterColonneSiAbsente(
      'parametre_systeme', 'limite_taches_collaborateur',
      "`limite_taches_collaborateur` int(11) NOT NULL DEFAULT '3'"
    )

    // Permet à "Activité hors-équipe" de cibler une équipe hors UP (en plus d'une
    // sous-équipe) — le collaborateur choisit l'une ou l'autre comme équipe à
    // prévenir. Les deux colonnes id_sous_equipe/id_up restent mutuellement
    // exclusives côté application (voir demandes.controller.js -> addDemande).
    await ajouterColonneSiAbsente(
      'demande_hors_equipe', 'id_up',
      "`id_up` int(11) DEFAULT NULL"
    )

    // Permet de sélectionner PLUSIEURS équipes (sous-équipes et/ou équipes hors UP) à
    // prévenir pour une même activité hors-équipe, au lieu d'une seule — chaque ligne
    // associe la demande à une équipe ; tous les responsables distincts des équipes
    // choisies sont notifiés (voir demandes.controller.js -> addDemande). Les colonnes
    // id_sous_equipe/id_up sur demande_hors_equipe restent renseignées uniquement quand
    // une seule équipe est choisie (rétro-compatibilité de l'affichage existant).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`demande_equipe_notification\` (
        \`id_demande\` int(11) NOT NULL,
        \`type_equipe\` enum('sous_equipe','hors_up') NOT NULL,
        \`id_equipe\` int(11) NOT NULL,
        PRIMARY KEY (\`id_demande\`, \`type_equipe\`, \`id_equipe\`),
        CONSTRAINT \`demande_equipe_notification_ibfk_1\` FOREIGN KEY (\`id_demande\`) REFERENCES \`demande_hors_equipe\` (\`id_demande\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // Utilisées par "Mon profil" (préférences de compte côté collaborateur) —
    // ajoutées ici aussi par sécurité si la base n'a pas été mise à jour depuis.
    await ajouterColonneSiAbsente(
      'collaborateur', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )
    await ajouterColonneSiAbsente(
      'collaborateur', 'profil_visible',
      "`profil_visible` tinyint(1) NOT NULL DEFAULT '1'"
    )

    // Mêmes colonnes côté responsable, pour sa propre page "Mon profil".
    await ajouterColonneSiAbsente(
      'responsable', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )
    await ajouterColonneSiAbsente(
      'responsable', 'profil_visible',
      "`profil_visible` tinyint(1) NOT NULL DEFAULT '1'"
    )

    // Côté admin, seule "Notifications par email" existe dans "Mon profil" (pas de
    // toggle de visibilité, l'admin voit tout par définition).
    await ajouterColonneSiAbsente(
      'admin', 'notifications_email',
      "`notifications_email` tinyint(1) NOT NULL DEFAULT '1'"
    )

    // "Activité Au Sein ESPRIT" était jusqu'ici un critère personnalisé (code NULL) noté
    // manuellement par l'admin dans la grille "Noter les membres" — ce qui ouvrait la
    // porte à du favoritisme (un ami noté plus haut qu'un collègue équivalent, sans
    // justification vérifiable). On le rattache à un calcul automatique (encadrements +
    // expertises + activités académiques, voir getActiviteEcoleRatios dans
    // evaluationScore.model.js) en lui donnant le code `activite_ecole`, exactement comme
    // les 4 critères de base : dès qu'un critère a un code, l'UI admin masque la grille de
    // notation manuelle (elle ne s'affiche que pour `!c.code`) et la note est recalculée à
    // partir des données réelles à chaque application de la formule.
    // Si l'admin l'avait déjà créé à la main (nom identique), on lui ajoute juste le code
    // en conservant sa pondération existante ; sinon on le crée avec pondération 0 (à
    // ajuster ensuite via le curseur, comme n'importe quel critère).
    const [dejaConnecte] = await pool.query(
      "SELECT id_critere FROM critere_evaluation WHERE code = 'activite_ecole' LIMIT 1"
    )
    if (dejaConnecte.length === 0) {
      const [dejaPersonnalise] = await pool.query(
        "SELECT id_critere FROM critere_evaluation WHERE nom = 'Activité Au Sein ESPRIT' AND code IS NULL LIMIT 1"
      )
      if (dejaPersonnalise.length > 0) {
        await pool.query(
          "UPDATE critere_evaluation SET code = 'activite_ecole' WHERE id_critere = ?",
          [dejaPersonnalise[0].id_critere]
        )
        console.log('[schema] Critère "Activité Au Sein ESPRIT" rattaché au calcul automatique')
      } else {
        await pool.query(
          "INSERT INTO critere_evaluation (nom, code, ponderation) VALUES ('Activité Au Sein ESPRIT', 'activite_ecole', 0)"
        )
        console.log('[schema] Critère "Activité Au Sein ESPRIT" créé (calcul automatique)')
      }
    }

    console.log('[schema] Notifications : schéma vérifié ✓')
  } catch (err) {
    console.error('[schema] Erreur lors de la vérification du schéma de notifications :', err)
  }
}

// Auto-provisionne au démarrage les tables des vœux pédagogiques (refonte
// dynamique : questions + modules/classes créés par l'admin), sans exiger de
// relancer manuellement migration_voeux_pedagogiques.sql. Contrairement à ce
// fichier, on utilise ici CREATE TABLE IF NOT EXISTS (pas de DROP TABLE) pour
// rester idempotent et sans danger à chaque démarrage, sans effacer les
// campagnes/réponses déjà existantes.
export async function ensureVoeuxPedagogiquesSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`campagne_voeux_pedagogiques\` (
        \`id_campagne\` int(11) NOT NULL AUTO_INCREMENT,
        \`titre\` varchar(150) NOT NULL DEFAULT 'Vœux pédagogiques',
        \`statut\` enum('brouillon','publiee','cloturee') NOT NULL DEFAULT 'brouillon',
        \`date_creation\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`date_publication\` datetime DEFAULT NULL,
        \`date_cloture\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id_campagne\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`question_voeu_pedagogique\` (
        \`id_question\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_campagne\` int(11) NOT NULL,
        \`ordre\` int(11) NOT NULL DEFAULT 0,
        \`type\` enum('texte','choix_unique','choix_multiple','modules') NOT NULL,
        \`intitule\` varchar(255) NOT NULL,
        \`obligatoire\` tinyint(1) NOT NULL DEFAULT 1,
        \`options\` JSON DEFAULT NULL,
        PRIMARY KEY (\`id_question\`),
        KEY \`id_campagne\` (\`id_campagne\`),
        CONSTRAINT \`question_voeu_ibfk_1\` FOREIGN KEY (\`id_campagne\`) REFERENCES \`campagne_voeux_pedagogiques\` (\`id_campagne\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`module_voeu_pedagogique\` (
        \`id_module\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_campagne\` int(11) NOT NULL,
        \`nom\` varchar(150) NOT NULL,
        \`classes\` JSON DEFAULT NULL,
        PRIMARY KEY (\`id_module\`),
        KEY \`id_campagne\` (\`id_campagne\`),
        CONSTRAINT \`module_voeu_ibfk_1\` FOREIGN KEY (\`id_campagne\`) REFERENCES \`campagne_voeux_pedagogiques\` (\`id_campagne\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`reponse_voeu_pedagogique\` (
        \`id_reponse\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_campagne\` int(11) NOT NULL,
        \`id_collaborateur\` int(11) NOT NULL,
        \`date_soumission\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`date_modification\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id_reponse\`),
        UNIQUE KEY \`unique_reponse_campagne\` (\`id_campagne\`,\`id_collaborateur\`),
        KEY \`id_collaborateur\` (\`id_collaborateur\`),
        CONSTRAINT \`reponse_voeu_ibfk_1\` FOREIGN KEY (\`id_campagne\`) REFERENCES \`campagne_voeux_pedagogiques\` (\`id_campagne\`) ON DELETE CASCADE,
        CONSTRAINT \`reponse_voeu_ibfk_2\` FOREIGN KEY (\`id_collaborateur\`) REFERENCES \`collaborateur\` (\`id_collaborateur\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`reponse_detail_voeu_pedagogique\` (
        \`id_detail\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_reponse\` int(11) NOT NULL,
        \`id_question\` int(11) NOT NULL,
        \`valeur\` JSON DEFAULT NULL,
        PRIMARY KEY (\`id_detail\`),
        UNIQUE KEY \`unique_detail\` (\`id_reponse\`,\`id_question\`),
        KEY \`id_question\` (\`id_question\`),
        CONSTRAINT \`reponse_detail_ibfk_1\` FOREIGN KEY (\`id_reponse\`) REFERENCES \`reponse_voeu_pedagogique\` (\`id_reponse\`) ON DELETE CASCADE,
        CONSTRAINT \`reponse_detail_ibfk_2\` FOREIGN KEY (\`id_question\`) REFERENCES \`question_voeu_pedagogique\` (\`id_question\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`affectation_voeu_pedagogique\` (
        \`id_affectation\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_reponse\` int(11) NOT NULL,
        \`id_module\` int(11) NOT NULL,
        \`classe\` varchar(100) NOT NULL,
        \`date_affectation\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_affectation\`),
        UNIQUE KEY \`unique_classe_module\` (\`id_module\`,\`classe\`),
        KEY \`id_reponse\` (\`id_reponse\`),
        CONSTRAINT \`affectation_voeu_ibfk_1\` FOREIGN KEY (\`id_reponse\`) REFERENCES \`reponse_voeu_pedagogique\` (\`id_reponse\`) ON DELETE CASCADE,
        CONSTRAINT \`affectation_voeu_ibfk_2\` FOREIGN KEY (\`id_module\`) REFERENCES \`module_voeu_pedagogique\` (\`id_module\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    console.log('[schema] Vœux pédagogiques : schéma vérifié ✓')
  } catch (err) {
    console.error('[schema] Erreur lors de la vérification du schéma des vœux pédagogiques :', err)
  }
}